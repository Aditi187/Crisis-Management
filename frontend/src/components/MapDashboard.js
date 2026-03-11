import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { disastersAPI, intelligenceAPI } from '../services/api';
import socketService from '../services/socket';
import '../styles/MapDashboard.css';

// Custom marker icons for different categories
const getCategoryIcon = (category, severity) => {
    const emojis = {
        flood: '🌊', fire: '🔥', earthquake: '🌍', cyclone: '🌀',
        landslide: '⛰️', tsunami: '🌊', drought: '☀️', other: '⚠️'
    };
    const colors = {
        critical: '#e74c3c', high: '#e67e22', medium: '#f1c40f', low: '#3498db'
    };
    const emoji = emojis[category] || '⚠️';
    const color = colors[severity] || '#f1c40f';

    return L.divIcon({
        html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${emoji}</div>`,
        className: 'custom-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
    });
};

// Component to handle routing display
function RoutingDisplay({ from, to, onClear }) {
    const map = useMap();
    const routeLayerRef = useRef(null);

    useEffect(() => {
        if (!from || !to) return;

        // Fetch route from OSRM
        const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.routes && data.routes.length > 0) {
                    // Clear previous route
                    if (routeLayerRef.current) {
                        map.removeLayer(routeLayerRef.current);
                    }

                    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    const routeLine = L.polyline(coords, {
                        color: '#3498db',
                        weight: 5,
                        opacity: 0.8
                    });
                    routeLine.addTo(map);
                    routeLayerRef.current = routeLine;

                    const distance = (data.routes[0].distance / 1000).toFixed(1);
                    const duration = Math.round(data.routes[0].duration / 60);

                    routeLine.bindPopup(
                        `<b>Route Info</b><br/>Distance: ${distance} km<br/>ETA: ${duration} min`
                    ).openPopup();

                    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
                }
            })
            .catch(err => console.error('Routing error:', err));

        return () => {
            if (routeLayerRef.current) {
                map.removeLayer(routeLayerRef.current);
            }
        };
    }, [from, to, map]);

    return null;
}

function MapDashboard() {
    const [disasters, setDisasters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [userLocation, setUserLocation] = useState(null);
    const [routeTo, setRouteTo] = useState(null);
    const [stats, setStats] = useState({ total: 0, critical: 0, responding: 0, resolved: 0 });
    const [weatherData, setWeatherData] = useState(null);
    const [showProximityRadius, setShowProximityRadius] = useState(true);

    useEffect(() => {
        fetchDisasters();
        fetchStats();

        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = [pos.coords.latitude, pos.coords.longitude];
                    setUserLocation(loc);
                    // Fetch weather for user's location
                    intelligenceAPI.getWeather(loc[0], loc[1])
                        .then(res => setWeatherData(res.data))
                        .catch(() => {});
                },
                () => {
                    setUserLocation([20.5937, 78.9629]); // Default: India center
                }
            );
        }

        socketService.onDisasterCreated((d) => {
            setDisasters(prev => [d, ...prev]);
            fetchStats();
        });
        socketService.onDisasterUpdated((d) => {
            setDisasters(prev => prev.map(item => item.id === d.id ? d : item));
            fetchStats();
        });
        socketService.onDisasterDeleted(({ id }) => {
            setDisasters(prev => prev.filter(item => item.id !== id));
            fetchStats();
        });

        return () => socketService.offDisasterEvents();
    }, []);

    const fetchDisasters = async () => {
        try {
            const res = await disastersAPI.getAll();
            setDisasters(res.data);
        } catch (err) {
            console.error('Error fetching disasters:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await disastersAPI.getStats();
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const handleNavigate = (lat, lng) => {
        if (!userLocation) {
            alert('Unable to get your location. Please enable location services.');
            return;
        }
        setRouteTo([parseFloat(lat), parseFloat(lng)]);
    };

    const filtered = selectedCategory === 'all'
        ? disasters.filter(d => d.status !== 'resolved')
        : disasters.filter(d => d.category === selectedCategory && d.status !== 'resolved');

    const categories = ['all', 'flood', 'fire', 'earthquake', 'cyclone', 'landslide', 'tsunami', 'drought', 'other'];
    const categoryEmojis = { all: '📍', flood: '🌊', fire: '🔥', earthquake: '🌍', cyclone: '🌀', landslide: '⛰️', tsunami: '🌊', drought: '☀️', other: '⚠️' };

    if (loading) return <div className="loading">Loading map...</div>;

    const center = userLocation || [20.5937, 78.9629];

    return (
        <div className="map-dashboard">
            <div className="content-header">
                <h2>🗺️ Real-Time Command Map</h2>
                <div className="map-stats">
                    <span className="map-stat critical">{stats.critical} Critical</span>
                    <span className="map-stat responding">{stats.responding} Responding</span>
                    <span className="map-stat total">{stats.total} Active</span>
                </div>
            </div>

            {weatherData && (
                <div className="map-weather-bar">
                    <span>🌡️ {Math.round(weatherData.main?.temp || 0)}°C</span>
                    <span>💧 {weatherData.main?.humidity || 0}%</span>
                    <span>💨 {(weatherData.wind?.speed || 0).toFixed(1)} m/s</span>
                    <span>☁️ {weatherData.weather?.[0]?.description || 'N/A'}</span>
                    <label className="proximity-toggle">
                        <input type="checkbox" checked={showProximityRadius} onChange={e => setShowProximityRadius(e.target.checked)} />
                        50 km Radius
                    </label>
                </div>
            )}

            <div className="category-filter">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {categoryEmojis[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            {routeTo && (
                <div className="route-banner">
                    <span>🧭 Navigation active — showing route to disaster site</span>
                    <button onClick={() => setRouteTo(null)} className="btn btn-sm btn-secondary">✕ Clear Route</button>
                </div>
            )}

            <div className="map-container">
                <MapContainer center={center} zoom={5} className="leaflet-map">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {userLocation && (
                        <Marker
                            position={userLocation}
                            icon={L.divIcon({
                                html: '<div style="background:#3498db;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(52,152,219,0.5)"></div>',
                                className: 'custom-marker',
                                iconSize: [16, 16],
                                iconAnchor: [8, 8]
                            })}
                        >
                            <Popup>📍 Your Location</Popup>
                        </Marker>
                    )}

                    {userLocation && showProximityRadius && (
                        <Circle
                            center={userLocation}
                            radius={50000}
                            pathOptions={{
                                color: '#3498db',
                                fillColor: '#3498db',
                                fillOpacity: 0.06,
                                weight: 2,
                                dashArray: '8 4'
                            }}
                        />
                    )}

                    {filtered.map(disaster => (
                        <Marker
                            key={disaster.id}
                            position={[parseFloat(disaster.latitude), parseFloat(disaster.longitude)]}
                            icon={getCategoryIcon(disaster.category, disaster.severity)}
                        >
                            <Popup>
                                <div className="map-popup">
                                    <h4>{disaster.title}</h4>
                                    <p>{disaster.description.substring(0, 100)}...</p>
                                    <div className="popup-meta">
                                        <span className={`popup-badge ${disaster.severity}`}>{disaster.severity.toUpperCase()}</span>
                                        <span className={`popup-status ${disaster.status}`}>{disaster.status}</span>
                                    </div>
                                    <p className="popup-location">📍 {disaster.location_name}</p>
                                    <button
                                        className="popup-nav-btn"
                                        onClick={() => handleNavigate(disaster.latitude, disaster.longitude)}
                                    >
                                        🧭 Navigate Here
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {routeTo && userLocation && (
                        <RoutingDisplay from={userLocation} to={routeTo} onClear={() => setRouteTo(null)} />
                    )}
                </MapContainer>
            </div>

            <div className="map-legend">
                <h4>Legend</h4>
                <div className="legend-items">
                    <span><span className="legend-dot" style={{background:'#e74c3c'}}></span> Critical</span>
                    <span><span className="legend-dot" style={{background:'#e67e22'}}></span> High</span>
                    <span><span className="legend-dot" style={{background:'#f1c40f'}}></span> Medium</span>
                    <span><span className="legend-dot" style={{background:'#3498db'}}></span> Low</span>
                </div>
            </div>
        </div>
    );
}

export default MapDashboard;
