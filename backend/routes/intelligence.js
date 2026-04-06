const express = require('express');
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const https = require('https');
const http = require('http');

const router = express.Router();

// ========================================================
// HELPER: Haversine distance (km) between two lat/lng points
// ========================================================
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ========================================================
// HELPER: fetch JSON over HTTP/HTTPS (no extra deps)
// ========================================================
function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

// ========================================================
// AI THREAT LEVEL ASSESSMENT
// Computes a composite risk score from multiple signals
// ========================================================
function computeThreatLevel(disasters, weather) {
    let score = 0;
    const factors = [];

    // Factor 1: Active disaster count in area
    const activeCritical = disasters.filter(d => d.severity === 'critical').length;
    const activeHigh = disasters.filter(d => d.severity === 'high').length;
    score += activeCritical * 30 + activeHigh * 15;
    if (activeCritical > 0) factors.push(`${activeCritical} critical disaster(s) nearby`);
    if (activeHigh > 0) factors.push(`${activeHigh} high-severity disaster(s) nearby`);

    // Factor 2: Weather conditions
    if (weather) {
        // Heavy rain → flood risk
        if (weather.rain) {
            const rainMm = weather.rain['1h'] || weather.rain['3h'] || 0;
            if (rainMm > 50) { score += 25; factors.push(`Heavy rainfall: ${rainMm}mm`); }
            else if (rainMm > 20) { score += 15; factors.push(`Moderate rainfall: ${rainMm}mm`); }
        }

        // High wind → cyclone risk
        if (weather.wind && weather.wind.speed > 20) {
            score += 20;
            factors.push(`Strong winds: ${weather.wind.speed} m/s`);
        } else if (weather.wind && weather.wind.speed > 10) {
            score += 10;
            factors.push(`Moderate winds: ${weather.wind.speed} m/s`);
        }

        // Temperature extremes
        if (weather.main) {
            if (weather.main.temp > 45) { score += 15; factors.push(`Extreme heat: ${weather.main.temp}°C`); }
            if (weather.main.temp < 0) { score += 10; factors.push(`Freezing conditions: ${weather.main.temp}°C`); }
            if (weather.main.humidity > 90) { score += 5; factors.push(`Very high humidity: ${weather.main.humidity}%`); }
        }

        // Severe weather alerts from condition codes
        if (weather.weather && weather.weather[0]) {
            const id = weather.weather[0].id;
            if (id >= 200 && id < 300) { score += 20; factors.push('Thunderstorm detected'); }
            if (id >= 500 && id <= 504) { score += 10; factors.push('Rain activity'); }
            if (id === 511 || id >= 600 && id < 700) { score += 10; factors.push('Snow/ice conditions'); }
            if (id >= 762 && id <= 781) { score += 25; factors.push('Severe weather: volcanic ash/tornado'); }
        }
    }

    // Factor 3: Disaster density (multiple recent reports = escalation)
    if (disasters.length >= 5) { score += 15; factors.push('High disaster density in area'); }
    else if (disasters.length >= 3) { score += 8; factors.push('Elevated disaster activity'); }

    // Clamp 0-100
    score = Math.min(100, Math.max(0, score));

    let level, color;
    if (score >= 70) { level = 'CRITICAL'; color = '#e74c3c'; }
    else if (score >= 45) { level = 'HIGH'; color = '#e67e22'; }
    else if (score >= 20) { level = 'MODERATE'; color = '#f1c40f'; }
    else { level = 'LOW'; color = '#27ae60'; }

    return { score, level, color, factors };
}

// ========================================================
// PROXIMITY ALERTS: disasters within N km of user
// GET /api/intelligence/proximity?lat=X&lng=Y&radius=50
// ========================================================
router.get('/proximity', auth, async (req, res) => {
    try {
        const { lat, lng, radius = 50 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'lat and lng are required' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const maxRadius = parseFloat(radius);

        const [disasters] = await db.query(
            'SELECT * FROM disaster_reports WHERE status != "resolved" ORDER BY created_at DESC'
        );

        const nearby = disasters
            .map(d => {
                const dist = haversineDistance(userLat, userLng, parseFloat(d.latitude), parseFloat(d.longitude));
                return { ...d, distance_km: Math.round(dist * 10) / 10 };
            })
            .filter(d => d.distance_km <= maxRadius)
            .sort((a, b) => a.distance_km - b.distance_km);

        res.json({
            user_location: { lat: userLat, lng: userLng },
            radius_km: maxRadius,
            alerts_count: nearby.length,
            alerts: nearby
        });
    } catch (error) {
        console.error('Proximity alert error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========================================================
// WEATHER DATA: current weather for a location
// GET /api/intelligence/weather?lat=X&lng=Y
// Uses OpenWeatherMap free tier (fallback to mock if no key)
// ========================================================
router.get('/weather', auth, async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: 'lat and lng are required' });
        }

        const apiKey = process.env.OPENWEATHER_API_KEY;

        if (apiKey) {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&appid=${encodeURIComponent(apiKey)}&units=metric`;
            const data = await fetchJSON(url);
            return res.json(data);
        } else {
            return res.status(400).json({ error: 'OPENWEATHER_API_KEY is not configured. Cannot fetch real-time weather.' });
        }
    } catch (error) {
        console.error('Weather fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

// ========================================================
// AI RISK ASSESSMENT: threat level for a given location
// GET /api/intelligence/risk?lat=X&lng=Y
// Combines disaster proximity + weather + AI scoring
// ========================================================
router.get('/risk', auth, async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: 'lat and lng are required' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        // Get nearby disasters (100km radius for risk assessment)
        const [disasters] = await db.query(
            'SELECT * FROM disaster_reports WHERE status != "resolved"'
        );
        const nearby = disasters.filter(d => {
            const dist = haversineDistance(userLat, userLng, parseFloat(d.latitude), parseFloat(d.longitude));
            return dist <= 100;
        });

        // Get weather data
        let weather = null;
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (apiKey) {
            try {
                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&appid=${encodeURIComponent(apiKey)}&units=metric`;
                weather = await fetchJSON(url);
            } catch (e) {
                console.error('Weather API error during risk assessment:', e.message);
            }
        } else {
            // Weather API not configured
            weather = null;
        }

        const threat = computeThreatLevel(nearby, weather);

        // Generate AI recommendations
        const recommendations = [];
        if (threat.level === 'CRITICAL') {
            recommendations.push('Evacuate immediately if in affected area');
            recommendations.push('Contact emergency services: 112');
            recommendations.push('Monitor official channels for updates');
        } else if (threat.level === 'HIGH') {
            recommendations.push('Stay alert and prepare emergency kit');
            recommendations.push('Avoid low-lying areas and flood-prone zones');
            recommendations.push('Keep emergency contacts accessible');
        } else if (threat.level === 'MODERATE') {
            recommendations.push('Stay informed about developing situations');
            recommendations.push('Review your emergency plan');
        } else {
            recommendations.push('No immediate threats detected');
            recommendations.push('Stay prepared with basic emergency supplies');
        }

        res.json({
            location: { lat: userLat, lng: userLng },
            threat,
            nearby_disasters: nearby.length,
            weather_summary: weather ? {
                temp: weather.main?.temp,
                humidity: weather.main?.humidity,
                wind_speed: weather.wind?.speed,
                condition: weather.weather?.[0]?.main
            } : null,
            recommendations
        });
    } catch (error) {
        console.error('Risk assessment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========================================================
// IMD / NDMA DATA FEED
// GET /api/intelligence/official-feeds
// Fetches latest alerts from Indian disaster agencies
// ========================================================
router.get('/official-feeds', auth, async (req, res) => {
    try {
        // Indian Govt (IMD/NDMA) do not offer free public JSON APIs globally.
        // We removed the hardcoded mock data per your request.
        // To get real feeds here, you will need to build an RSS scraper for ndma.gov.in
        res.json({
            last_updated: new Date().toISOString(),
            feeds: [],
            _note: 'No hardcoded data. Real-time feeds require an active Indian Govt. RSS integration/web scraper.'
        });
    } catch (error) {
        console.error('Official feeds error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
