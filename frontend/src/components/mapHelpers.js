/**
 * Helper utilities for the map
 * These functions handle specific tasks to keep components clean
 */

import L from 'leaflet';

// EMOJI AND COLOR MAPPING
export const DISASTER_EMOJIS = {
    flood: '🌊',
    fire: '🔥',
    earthquake: '🌍',
    cyclone: '🌀',
    landslide: '⛰️',
    tsunami: '🌊',
    drought: '☀️',
    other: '⚠️',
    all: '📍'
};

export const SEVERITY_COLORS = {
    critical: '#e74c3c',  // Red
    high: '#e67e22',      // Orange
    medium: '#f1c40f',    // Yellow
    low: '#3498db'        // Blue
};

// Create a custom marker icon with emoji and color
export const createMarkerIcon = (category, severity) => {
    const emoji = DISASTER_EMOJIS[category] || '⚠️';
    const color = SEVERITY_COLORS[severity] || '#f1c40f';

    const markerStyle = `
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;

    return L.divIcon({
        html: `<div style="${markerStyle}">${emoji}</div>`,
        className: 'custom-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
    });
};

// Create user location marker
export const createUserLocationIcon = () => {
    const userStyle = `
        background: #3498db;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(52,152,219,0.5);
    `;

    return L.divIcon({
        html: `<div style="${userStyle}"></div>`,
        className: 'custom-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
};

// Filter disasters by category and status
export const filterDisasters = (disasters, selectedCategory) => {
    // If "all" is selected, show all active disasters
    if (selectedCategory === 'all') {
        return disasters.filter(d => d.status !== 'resolved');
    }
    // Otherwise, filter by category AND show only active ones
    return disasters.filter(
        d => d.category === selectedCategory && d.status !== 'resolved'
    );
};

// Combine local and real-time disasters
export const combinedisasters = (localDisasters, realTimeDisasters, showRealTime) => {
    if (!showRealTime) return localDisasters;
    return [...localDisasters, ...realTimeDisasters];
};

// Calculate route distance and duration
export const calculateRouteInfo = (distance, duration) => {
    const distanceKm = (distance / 1000).toFixed(1);
    const durationMinutes = Math.round(duration / 60);
    return {  distanceKm, durationMinutes };
};
