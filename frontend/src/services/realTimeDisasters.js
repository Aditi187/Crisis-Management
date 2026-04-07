/**
 * Real-Time Disaster API Service
 * Fetches live disaster data from public APIs:
 * - USGS Earthquake API
 * - NASA EONET API (Earth Observatory Natural Event Tracking)
 */

// USGS Earthquake API configuration (swapped to all_day for guaranteed visual markers)
const USGS_API = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

// NASA EONET API configuration (limited to 30 days to prevent 6000+ marker crash)
const EONET_API = 'https://eonet.gsfc.nasa.gov/api/v3/events?days=30';

// OCHA ReliefWeb Global Disasters API (UN) -> Switched to V2 due to V1 deprecation
const RELIEFWEB_API = 'https://api.reliefweb.int/v2/disasters?appname=crisis_management&profile=full&preset=latest&limit=25&query[value]=status:current';

/**
 * Map between NASA EONET category IDs and our disaster types
 */
const EVENT_CATEGORY_MAP = {
    8: 'fire',
    12: 'storm',
    15: 'flood',
    10: 'volcano',
    14: 'tsunami',
    17: 'earthquake',
};
export const fetchEarthquakes = async () => {
    try {
        const response = await fetch(USGS_API);
        if (!response.ok) throw new Error('USGS API failed');
        
        const data = await response.json();
        
        // Parse earthquake features and convert to our format
        return data.features.map(feature => ({
            id: `usgs_${feature.id}`,
            source: 'usgs',
            category: 'earthquake',
            title: feature.properties.title,
            description: `Magnitude ${feature.properties.mag}`,
            location_name: feature.properties.place || 'Unknown location',
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
            severity: getSeverityFromMagnitude(feature.properties.mag),
            magnitude: feature.properties.mag,
            depth: feature.geometry.coordinates[2],
            timestamp: new Date(feature.properties.time),
            status: 'responding',
            url: feature.properties.url
        })).filter(eq => eq.magnitude >= 3.0); // Filter out minor earthquakes
    } catch (error) {
        console.error('Error fetching earthquakes:', error);
        return [];
    }
};

/**
 * Fetch and parse disaster data from NASA EONET API
 * @returns {Promise<Array>} Array of natural events
 */
export const fetchNasaEvents = async () => {
    try {
        const response = await fetch(EONET_API);
        if (!response.ok) throw new Error('NASA EONET API failed');
        
        const data = await response.json();
        
        // Parse events and convert to our format
        return data.events
            .filter(event => event.geometries && event.geometries.length > 0)
            .map(event => {
                const geometry = event.geometries[0]; // Get latest geometry
                const categoryId = event.categories[0]?.id;
                const category = EVENT_CATEGORY_MAP[categoryId] || 'other';
                
                return {
                    id: `eonet_${event.id}`,
                    source: 'nasa',
                    category: category,
                    title: event.title,
                    description: event.description || `${category.toUpperCase()} event`,
                    location_name: event.title,
                    latitude: geometry.coordinates[1],
                    longitude: geometry.coordinates[0],
                    severity: 'medium', // NASA doesn't provide severity
                    timestamp: new Date(event.geometry.date || event.updated),
                    status: 'responding',
                    url: event.link || ''
                };
            });
    } catch (error) {
        console.error('Error fetching NASA events:', error);
        return [];
    }
};

/**
 * Determine severity level from earthquake magnitude
 * @param {number} magnitude - Earthquake magnitude
 * @returns {string} Severity level
 */
const getSeverityFromMagnitude = (magnitude) => {
    if (magnitude >= 7.0) return 'critical';
    if (magnitude >= 6.0) return 'high';
    if (magnitude >= 5.0) return 'medium';
    return 'low';
};

/**
 * Fetch and parse disaster data from ReliefWeb API (UN Office for the Coordination of Humanitarian Affairs)
 * Covers global floods, droughts, epidemics, and civil emergencies.
 */
export const fetchReliefWebEvents = async () => {
    try {
        const response = await fetch(RELIEFWEB_API);
        if (!response.ok) throw new Error('ReliefWeb API failed');
        
        const data = await response.json();
        
        if (!data.data) return [];

        return data.data
            .filter(event => event.fields && event.fields.primary_country && event.fields.primary_country.location)
            .map(event => {
                const fields = event.fields;
                const types = fields.type || [];
                const primaryType = types.length > 0 ? types[0].name.toLowerCase() : 'other';
                
                // Map to our categories
                let category = 'other';
                if (primaryType.includes('flood')) category = 'flood';
                if (primaryType.includes('fire')) category = 'fire';
                if (primaryType.includes('cyclone') || primaryType.includes('storm')) category = 'cyclone';
                if (primaryType.includes('drought')) category = 'drought';
                if (primaryType.includes('earthquake')) category = 'earthquake';
                if (primaryType.includes('landslide')) category = 'landslide';

                return {
                    id: `rw_${event.id}`,
                    source: 'reliefweb',
                    category: category,
                    title: fields.name,
                    description: fields.description || `Global ${category} emergency.`,
                    location_name: fields.primary_country.name,
                    latitude: fields.primary_country.location.lat,
                    longitude: fields.primary_country.location.lon,
                    severity: 'high', // ReliefWeb typically tracks major internationally recognized crises
                    timestamp: new Date(fields.date?.created || Date.now()),
                    status: 'responding',
                    url: fields.url || ''
                };
            });
    } catch (error) {
        console.error('Error fetching ReliefWeb events:', error);
        return [];
    }
};

/**
 * Fetch all real-time disaster data from multiple sources
 * @returns {Promise<Array>} Combined array of all disasters
 */
export const fetchAllDisasters = async () => {
    try {
        const [earthquakes, nasaEvents, reliefWebEvents] = await Promise.all([
            fetchEarthquakes(),
            fetchNasaEvents(),
            fetchReliefWebEvents()
        ]);
        
        // Combine and remove duplicates
        const allDisasters = [...earthquakes, ...nasaEvents, ...reliefWebEvents];
        
        // Sort by timestamp (newest first)
        allDisasters.sort((a, b) => b.timestamp - a.timestamp);
        
        console.log(`Fetched ${allDisasters.length} real-time global disasters:`, {
            earthquakes: earthquakes.length,
            nasaEvents: nasaEvents.length,
            reliefWebEvents: reliefWebEvents.length
        });
        
        return allDisasters;
    } catch (error) {
        console.error('Error fetching all disasters:', error);
        return [];
    }
};

/**
 * Get unique disasters by location (prevents duplicate markers for same event)
 * @param {Array} disasters - Array of disasters
 * @param {number} radius - Radius in degrees to consider as same location
 * @returns {Array} Filtered disasters
 */
export const filterDuplicatesByLocation = (disasters, radius = 0.5) => {
    const filtered = [];
    const processed = new Set();
    
    for (const disaster of disasters) {
        let isDuplicate = false;
        
        for (const processed_id of processed) {
            const other = disasters.find(d => d.id === processed_id);
            if (other) {
                const latDiff = Math.abs(disaster.latitude - other.latitude);
                const lngDiff = Math.abs(disaster.longitude - other.longitude);
                
                if (latDiff < radius && lngDiff < radius) {
                    isDuplicate = true;
                    break;
                }
            }
        }
        
        if (!isDuplicate) {
            filtered.push(disaster);
            processed.add(disaster.id);
        }
    }
    
    return filtered;
};

/**
 * Calculate distance between two coordinates (in km)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Filter disasters within a certain distance from a point
 * @param {Array} disasters - Array of disasters
 * @param {number} userLat - User latitude
 * @param {number} userLon - User longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} Filtered disasters
 */
export const getDisastersNearby = (disasters, userLat, userLon, radiusKm = 50) => {
    return disasters.filter(disaster => {
        const distance = calculateDistance(userLat, userLon, disaster.latitude, disaster.longitude);
        return distance <= radiusKm;
    });
};

const realTimeDisastersService = {
    fetchEarthquakes,
    fetchNasaEvents,
    fetchAllDisasters,
    filterDuplicatesByLocation,
    calculateDistance,
    getDisastersNearby
};

export default realTimeDisastersService;
