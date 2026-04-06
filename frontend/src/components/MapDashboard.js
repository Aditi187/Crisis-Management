import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { disastersAPI, intelligenceAPI } from '../services/api';
import socketService from '../services/socket';
import { fetchAllDisasters } from '../services/realTimeDisasters';
import { createMarkerIcon, createUserLocationIcon } from './mapHelpers';
import { getHazardPolygons, checkRouteSafety, getAvoidanceWaypoint } from '../utils/geoUtils';
import RealTimeControls from './RealTimeControls';
import CategoryFilter from './CategoryFilter';
import MapLegend from './MapLegend';
import '../styles/MapDashboard.css';

/**
 * RoutingDisplay - Sub-component for drawing navigation routes
 * Computes intersection against hazard polygons and routes around them
 */
function RoutingDisplay({ from, to, onClear, hazardPolygons = [] }) {
    const map = useMap();
    const routeLayerRef = useRef(null);
    const [isCalculating, setIsCalculating] = useState(true);

    useEffect(() => {
        if (!from || !to) return;
        
        const fetchRoute = async () => {
            setIsCalculating(true);
            try {
                // Initial naive route
                let osrmCoords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
                let url = `https://router.project-osrm.org/route/v1/driving/${osrmCoords}?overview=full&geometries=geojson`;
                
                let res = await fetch(url);
                let data = await res.json();
                
                if (data.routes && data.routes.length > 0) {
                    let coords = data.routes[0].geometry.coordinates; // [lng, lat]
                    
                    // -- Component 2: Autonomous Safe-Routing check --
                    const safety = checkRouteSafety(coords, hazardPolygons);
                    
                    if (!safety.isSafe) {
                        console.warn("Route intersects hazard! Rerouting...");
                        const bypass = getAvoidanceWaypoint(from, to, safety.conflictingHazards[0]);
                        // New path with bypass
                        osrmCoords = `${from[1]},${from[0]};${bypass[1]},${bypass[0]};${to[1]},${to[0]}`;
                        url = `https://router.project-osrm.org/route/v1/driving/${osrmCoords}?overview=full&geometries=geojson`;
                        res = await fetch(url);
                        data = await res.json();
                        if (data.routes && data.routes.length > 0) {
                            coords = data.routes[0].geometry.coordinates;
                        }
                    }

                    if (routeLayerRef.current) {
                        map.removeLayer(routeLayerRef.current);
                    }

                    const latLngs = coords.map(c => [c[1], c[0]]);
                    const routeLine = L.polyline(latLngs, {
                        color: safety.isSafe ? '#3498db' : '#f39c12', // Orange if diverted
                        weight: 5,
                        opacity: 0.8
                    });
                    routeLine.addTo(map);
                    routeLayerRef.current = routeLine;

                    const distance = (data.routes[0].distance / 1000).toFixed(1);
                    const duration = Math.round(data.routes[0].duration / 60);

                    routeLine.bindPopup(
                        `<b>${safety.isSafe ? 'Primary Route' : 'Safe Diverted Route'}</b><br/>Distance: ${distance} km<br/>ETA: ${duration} min`
                    ).openPopup();

                    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
                }
            } catch (err) {
                console.error('Routing error:', err);
            } finally {
                setIsCalculating(false);
            }
        };

        fetchRoute();

        return () => {
            if (routeLayerRef.current) {
                map.removeLayer(routeLayerRef.current);
            }
        };
    }, [from, to, map, hazardPolygons]);

    return null;
}

/**
 * MapDashboard - Main map component for viewing disasters globally
 * Shows both local database disasters and real-time public API data
 */
function MapDashboard() {
    // Local database disasters
    const [disasters, setDisasters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [stats, setStats] = useState({ total: 0, critical: 0, responding: 0 });

    // User location and routing
    const [userLocation, setUserLocation] = useState(null);
    const [routeTo, setRouteTo] = useState(null);

    // Real-time API data
    const [realTimeDisasters, setRealTimeDisasters] = useState([]);
    const [showRealTime, setShowRealTime] = useState(true);
    const [realTimeLoading, setRealTimeLoading] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [apiErrors, setApiErrors] = useState({ usgs: false, eonet: false });

    // Other data
    const [weatherData, setWeatherData] = useState(null);
    const [showProximityRadius, setShowProximityRadius] = useState(true);
    const autoRefreshRef = useRef(null);

    // ===== DATA FETCHING =====

    const fetchRealTimeDisasters = async () => {
        setRealTimeLoading(true);
        try {
            const data = await fetchAllDisasters();
            setRealTimeDisasters(data);
            setLastUpdateTime(new Date());
            setApiErrors({ usgs: false, eonet: false });
        } catch (error) {
            console.error('Error fetching real-time disasters:', error);
            setApiErrors({ usgs: true, eonet: true });
        } finally {
            setRealTimeLoading(false);
        }
    };

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

    // ===== INITIALIZATION & CLEANUP =====

    useEffect(() => {
        // Fetch initial data
        fetchDisasters();
        fetchStats();
        fetchRealTimeDisasters();

        // Auto-refresh real-time data every 5 seconds
        autoRefreshRef.current = setInterval(fetchRealTimeDisasters, 5000);

        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = [pos.coords.latitude, pos.coords.longitude];
                    setUserLocation(loc);
                    // Fetch weather for this location
                    intelligenceAPI.getWeather(loc[0], loc[1])
                        .then(res => setWeatherData(res.data))
                        .catch(() => {});
                },
                () => {
                    // Fallback to India center if location unavailable
                    setUserLocation([20.5937, 78.9629]);
                }
            );
        }

        // Listen for real-time disaster updates via Socket.io
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

        return () => {
            if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
            socketService.offDisasterEvents();
        };
    }, []);

    // ===== EVENT HANDLERS =====

    const handleNavigate = (lat, lng) => {
        if (!userLocation) {
            alert('Please enable location services');
            return;
        }
        setRouteTo([parseFloat(lat), parseFloat(lng)]);
    };

    // ===== FILTERING & PREDICTIVE GEOMETRY =====

    const combined = [...disasters, ...(showRealTime ? realTimeDisasters : [])];
    const filtered = combined.filter(d => {
        const statusOk = d.status !== 'resolved';
        const categoryOk = selectedCategory === 'all' || d.category === selectedCategory;
        return statusOk && categoryOk;
    });

    // Compute active dynamic polygons whenever filters or weather change
    const hazardPolygons = useMemo(() => {
        return getHazardPolygons(filtered, weatherData);
    }, [filtered, weatherData]);

    if (loading) return <div className="loading">📍 Loading map...</div>;

    const center = userLocation || [20, 0];

    return (
        <div className="map-dashboard">
            {/* ===== HEADER ===== */}
            <div className="content-header">
                <h2>🗺️ Real-Time Command Map</h2>
                <div className="map-stats">
                    <span className="map-stat critical">{stats.critical} Critical</span>
                    <span className="map-stat responding">{stats.responding} Responding</span>
                    <span className="map-stat total">{stats.total} Active</span>
                </div>
            </div>

            {/* ===== REAL-TIME CONTROLS ===== */}
            <RealTimeControls
                showRealTime={showRealTime}
                onToggleRealTime={setShowRealTime}
                realTimeLoading={realTimeLoading}
                lastUpdateTime={lastUpdateTime}
                onRefresh={fetchRealTimeDisasters}
                realTimeDisastersCount={realTimeDisasters.length}
                apiErrors={apiErrors}
            />

            {/* ===== WEATHER BAR ===== */}
            {weatherData && (
                <div className="map-weather-bar">
                    <span>🌡️ {Math.round(weatherData.main?.temp || 0)}°C</span>
                    <span>💧 {weatherData.main?.humidity || 0}%</span>
                    <span>💨 {(weatherData.wind?.speed || 0).toFixed(1)} m/s</span>
                    <span>☁️ {weatherData.weather?.[0]?.description || 'N/A'}</span>
                    <label className="proximity-toggle">
                        <input
                            type="checkbox"
                            checked={showProximityRadius}
                            onChange={e => setShowProximityRadius(e.target.checked)}
                        />
                        50 km Radius
                    </label>
                </div>
            )}

            {/* ===== CATEGORY FILTER ===== */}
            <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                showRealTime={showRealTime}
            />

            {/* ===== ROUTE ACTIVE BANNER ===== */}
            {routeTo && (
                <div className="route-banner">
                    <span>🧭 Navigation active — route displayed below</span>
                    <button
                        onClick={() => setRouteTo(null)}
                        className="btn btn-sm btn-secondary"
                    >
                        ✕ Clear Route
                    </button>
                </div>
            )}

            {/* ===== MAP CONTAINER ===== */}
            <div className="map-container">
                <MapContainer 
                    center={center} 
                    zoom={userLocation ? 5 : 2} 
                    minZoom={2}
                    maxBounds={[[-90, -200], [90, 200]]}
                    maxBoundsViscosity={1.0}
                    className="leaflet-map"
                >
                    {/* Base map tiles */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        noWrap={true}
                    />

                    {/* User location marker */}
                    {userLocation && (
                        <>
                            <Marker
                                position={userLocation}
                                icon={createUserLocationIcon()}
                            >
                                <Popup>📍 Your Location</Popup>
                            </Marker>

                            {/* Proximity circle */}
                            {showProximityRadius && (
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
                        </>
                    )}

                    {/* Disaster markers */}
                    {filtered.map(disaster => (
                        <Marker
                            key={disaster.id}
                            position={[parseFloat(disaster.latitude), parseFloat(disaster.longitude)]}
                            icon={createMarkerIcon(disaster.category, disaster.severity)}
                        >
                            <Popup>
                                <div className="map-popup">
                                    <h4>{disaster.title}</h4>
                                    <p>{disaster.description.substring(0, 100)}...</p>
                                    <div className="popup-meta">
                                        <span className={`popup-badge ${disaster.severity}`}>
                                            {disaster.severity.toUpperCase()}
                                        </span>
                                        <span className={`popup-status ${disaster.status}`}>
                                            {disaster.status}
                                        </span>
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

                    {/* Component 1: Dynamic Hazard Polygons */}
                    {hazardPolygons.map((poly, idx) => (
                        <GeoJSON 
                            key={`hazard_poly_${idx}`} 
                            data={poly} 
                            style={() => ({
                                color: poly.properties.severity === 'critical' ? '#e74c3c' : '#e67e22',
                                weight: 2,
                                opacity: 0.8,
                                fillColor: poly.properties.severity === 'critical' ? '#e74c3c' : '#e67e22',
                                fillOpacity: 0.3
                            })}
                        >
                            <Popup>
                                <strong>⚠️ Hazard Spread Zone</strong>
                                <p>Dynamic trajectory for {poly.properties.title}. Avoid this area.</p>
                            </Popup>
                        </GeoJSON>
                    ))}

                    {/* Route display safely bypassing geometry */}
                    {routeTo && userLocation && (
                        <RoutingDisplay 
                            from={userLocation} 
                            to={routeTo} 
                            onClear={() => setRouteTo(null)} 
                            hazardPolygons={hazardPolygons}
                        />
                    )}
                </MapContainer>
            </div>

            {/* ===== LEGEND ===== */}
            <MapLegend showRealTime={showRealTime} />
        </div>
    );
}

export default MapDashboard;
