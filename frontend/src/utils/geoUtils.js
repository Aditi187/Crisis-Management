/**
 * Geospatial Utilities for Predictive Mapping and Safe Routing
 * Built using @turf/turf for dynamic physics-based algorithmic routing.
 */
import * as turf from '@turf/turf';

/**
 * Computes a predictive hazard spread cone (Polygon) based on wind dynamics.
 * Assumes the hazard spreads downwind.
 *
 * @param {number} lat - Origin latitude
 * @param {number} lng - Origin longitude
 * @param {number} windSpeed - Wind speed in m/s
 * @param {number} windDeg - Wind direction in degrees (meteorological)
 * @param {number} severityScale - Multiplier based on hazard severity
 * @returns {Object} Turf.js Polygon GeoJSON
 */
export const computePredictiveCone = (lat, lng, windSpeed, windDeg, severityScale = 1.0) => {
    const origin = turf.point([lng, lat]);
    
    // Base radius of the disaster (without wind)
    const baseRadiusKm = 2 * severityScale;
    
    // Wind factor: higher wind means a longer downwind cone
    // 5 m/s wind expands the cone by ~10km downwind
    const windSpreadKm = (windSpeed || 0) * 2 * severityScale;
    
    // If no wind, just return a circle buffer
    if (windSpreadKm < 1) {
        return turf.buffer(origin, baseRadiusKm, { units: 'kilometers' });
    }

    // Wind direction is where wind comes FROM. So the hazard moves TO (windDeg + 180) % 360
    const travelDirDeg = (windDeg + 180) % 360;

    // Calculate the fanned-out points downwind
    const spreadAngleDeg = 45; // Cone opening angle

    // Forward point (max reach)
    const pCenter = turf.destination(origin, windSpreadKm + baseRadiusKm, travelDirDeg, { units: 'kilometers' });
    
    // Left and right flank points
    const pLeft = turf.destination(origin, windSpreadKm, travelDirDeg - spreadAngleDeg, { units: 'kilometers' });
    const pRight = turf.destination(origin, windSpreadKm, travelDirDeg + spreadAngleDeg, { units: 'kilometers' });
    
    // Rear buffer (wind doesn't push it backward, but it still has a base radius)
    const pRear = turf.destination(origin, baseRadiusKm, windDeg, { units: 'kilometers' });

    // Combine points to make a predictive polygon
    const polygon = turf.polygon([[
        turf.getCoord(pRear),
        turf.getCoord(pLeft),
        turf.getCoord(pCenter),
        turf.getCoord(pRight),
        turf.getCoord(pRear)
    ]]);

    return polygon;
};

/**
 * Generate hazard polygons for all active critical disasters
 */
export const getHazardPolygons = (disasters, weatherData) => {
    const polygons = [];
    
    disasters.forEach(d => {
        // Only build cones for dynamic hazards (fires, gas leaks, storms) or critical ones
        if (d.status === 'resolved') return;
        
        let severityScale = 1.0;
        if (d.severity === 'critical') severityScale = 2.0;
        if (d.severity === 'high') severityScale = 1.5;

        // Use global weather or generic constraints if localized weather missing
        const windSpeed = weatherData?.wind?.speed || 2; 
        const windDeg = weatherData?.wind?.deg || 0;

        const poly = computePredictiveCone(parseFloat(d.latitude), parseFloat(d.longitude), windSpeed, windDeg, severityScale);
        
        // Attach properties so we know what hazard this cone represents
        poly.properties = {
            id: d.id,
            category: d.category,
            severity: d.severity,
            title: d.title
        };
        polygons.push(poly);
    });

    return polygons;
};

/**
 * Validates if an OSRM route intersects any active hazard polygons.
 * @param {Array<Array<number>>} coords - Array of [lat, lng]
 * @param {Array<Object>} hazardPolygons - Array of Turf polygons
 * @returns {Object} Safe status and conflicting hazards
 */
export const checkRouteSafety = (coords, hazardPolygons) => {
    // Turf uses [lng, lat]
    const routeLine = turf.lineString(coords.map(c => [c[1], c[0]]));
    const conflicts = [];

    hazardPolygons.forEach(poly => {
        if (turf.booleanIntersects(routeLine, poly)) {
            conflicts.push(poly);
        }
    });

    return {
        isSafe: conflicts.length === 0,
        conflictingHazards: conflicts
    };
};

/**
 * Iteratively compute a safe waypoint to bypass a hazard polygon
 */
export const getAvoidanceWaypoint = (startLatLng, endLatLng, hazardPoly) => {
    // Simple heuristic: get the center of the hazard, and project a waypoint 
    // perpendicular to the route at a safe distance.
    const start = turf.point([startLatLng[1], startLatLng[0]]);
    const end = turf.point([endLatLng[1], endLatLng[0]]);
    const hazardCenter = turf.center(hazardPoly);
    
    // Find bearing from start to end
    const bearingRoute = turf.bearing(start, end);
    
    // We want to route AROUND the center by pushing the waypoint out by ~10km perpendicular to travel path
    // We pick left or right randomly/heuristically (simplification for dynamic alg)
    const escapeDeg = (bearingRoute + 90) % 360; 
    
    const safeWaypoint = turf.destination(hazardCenter, 5, escapeDeg, { units: 'kilometers' });
    
    const coord = turf.getCoord(safeWaypoint);
    // returns [lat, lng]
    return [coord[1], coord[0]];
};
