import React, { useState, useEffect, useCallback } from 'react';
import { alertsAPI, disastersAPI, volunteersAPI, donationsAPI, intelligenceAPI } from '../services/api';
import socketService from '../services/socket';
import '../styles/Dashboard.css';

function Dashboard() {
    const [stats, setStats] = useState({
        critical: 0,
        warning: 0,
        total: 0,
        resolvedToday: 0,
    });
    const [disasterStats, setDisasterStats] = useState({ total: 0, critical: 0, responding: 0, resolved: 0 });
    const [volunteerStats, setVolunteerStats] = useState({ total: 0, available: 0 });
    const [donationStats, setDonationStats] = useState({ totalAmount: 0, totalDonations: 0 });
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [riskData, setRiskData] = useState(null);
    const [weatherData, setWeatherData] = useState(null);
    const [proximityAlerts, setProximityAlerts] = useState([]);
    const [officialFeeds, setOfficialFeeds] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchIntelligence = useCallback(async (lat, lng) => {
        try {
            const [riskRes, weatherRes, proxRes, feedsRes] = await Promise.all([
                intelligenceAPI.getRisk(lat, lng),
                intelligenceAPI.getWeather(lat, lng),
                intelligenceAPI.getProximityAlerts(lat, lng, 50),
                intelligenceAPI.getOfficialFeeds(),
            ]);
            setRiskData(riskRes.data);
            setWeatherData(weatherRes.data);
            setProximityAlerts(proxRes.data.alerts || []);
            setOfficialFeeds(feedsRes.data.feeds || []);
        } catch (error) {
            console.error('Error fetching intelligence:', error);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();

        // Get user location for AI intelligence
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    fetchIntelligence(loc.lat, loc.lng);
                },
                () => {
                    fetchIntelligence(28.6139, 77.2090);
                }
            );
        }

        socketService.onAlertCreated((newAlert) => {
            setRecentAlerts((prev) => [newAlert, ...prev].slice(0, 5));
            fetchDashboardData();
        });

        socketService.onAlertUpdated((updatedAlert) => {
            setRecentAlerts((prev) =>
                prev.map((alert) => (alert.id === updatedAlert.id ? updatedAlert : alert))
            );
            fetchDashboardData();
        });

        socketService.onAlertDeleted(({ id }) => {
            setRecentAlerts((prev) => prev.filter((alert) => alert.id !== id));
            fetchDashboardData();
        });

        return () => {
            socketService.offAlertEvents();
        };
    }, [fetchIntelligence]);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, alertsRes, dStatsRes, vStatsRes, donStatsRes] = await Promise.all([
                alertsAPI.getStats(),
                alertsAPI.getAll({ status: 'active' }),
                disastersAPI.getStats(),
                volunteersAPI.getStats(),
                donationsAPI.getStats(),
            ]);
            setStats(statsRes.data);
            setRecentAlerts(alertsRes.data.slice(0, 5));
            setDisasterStats(dStatsRes.data);
            setVolunteerStats(vStatsRes.data);
            setDonationStats(donStatsRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <div className="content-header">
                <h2>🚀 Disaster Management System</h2>
                <span className="live-pulse">● LIVE</span>
            </div>

            {/* AI Risk Assessment Banner */}
            {riskData && (
                <div className="risk-banner" style={{ borderLeftColor: riskData.threat.color }}>
                    <div className="risk-level" style={{ background: riskData.threat.color }}>
                        <span className="risk-label">AI THREAT LEVEL</span>
                        <span className="risk-score">{riskData.threat.level}</span>
                        <span className="risk-number">{riskData.threat.score}/100</span>
                    </div>
                    <div className="risk-details">
                        <div className="risk-factors">
                            <h4>Risk Factors</h4>
                            {riskData.threat.factors.length > 0 ? (
                                riskData.threat.factors.map((f, i) => (
                                    <span key={i} className="risk-factor-tag">⚠️ {f}</span>
                                ))
                            ) : (
                                <span className="risk-factor-tag safe">✅ No active threats</span>
                            )}
                        </div>
                        <div className="risk-recommendations">
                            <h4>AI Recommendations</h4>
                            {riskData.recommendations.map((r, i) => (
                                <p key={i}>→ {r}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Weather + Proximity Row */}
            <div className="intel-row">
                {weatherData && (
                    <div className="weather-card">
                        <div className="weather-main">
                            <span className="weather-temp">{Math.round(weatherData.main?.temp || 0)}°C</span>
                            <span className="weather-desc">{weatherData.weather?.[0]?.main || 'N/A'}</span>
                        </div>
                        <div className="weather-details">
                            <span>💧 {weatherData.main?.humidity || 0}%</span>
                            <span>💨 {(weatherData.wind?.speed || 0).toFixed(1)} m/s</span>
                            <span>📍 {weatherData.name || 'Your Area'}</span>
                        </div>
                        {weatherData._mock && <small className="mock-badge">Demo Data</small>}
                    </div>
                )}

                <div className="proximity-card">
                    <h4>🔔 Proximity Alerts (50 km)</h4>
                    {proximityAlerts.length === 0 ? (
                        <p className="safe-text">✅ No disasters within 50 km of your location</p>
                    ) : (
                        <div className="proximity-list">
                            {proximityAlerts.slice(0, 3).map(alert => (
                                <div key={alert.id} className={`proximity-item ${alert.severity}`}>
                                    <span className="proximity-dist">{alert.distance_km} km</span>
                                    <span className="proximity-title">{alert.title}</span>
                                    <span className={`proximity-severity ${alert.severity}`}>{alert.severity}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Stats */}
            <div className="stats-grid">
                <div className="stat-card critical">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <h3>{stats.critical}</h3>
                        <p>Critical Alerts</p>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-content">
                        <h3>{stats.warning}</h3>
                        <p>Warnings</p>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon">📌</div>
                    <div className="stat-content">
                        <h3>{stats.total}</h3>
                        <p>Active Alerts</p>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{stats.resolvedToday}</h3>
                        <p>Resolved Today</p>
                    </div>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: '30px' }}>
                <div className="stat-card critical">
                    <div className="stat-icon">🚨</div>
                    <div className="stat-content">
                        <h3>{disasterStats.total}</h3>
                        <p>Active Disasters</p>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon">🚑</div>
                    <div className="stat-content">
                        <h3>{disasterStats.responding}</h3>
                        <p>Responding</p>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon">🤝</div>
                    <div className="stat-content">
                        <h3>{volunteerStats.available}/{volunteerStats.total}</h3>
                        <p>Volunteers Available</p>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>₹{Number(donationStats.totalAmount).toLocaleString()}</h3>
                        <p>Funds Raised</p>
                    </div>
                </div>
            </div>

            {/* Official Feeds */}
            {officialFeeds.length > 0 && (
                <div className="card official-feeds-card">
                    <div className="card-header">
                        <h3>📡 Official Agency Feeds (IMD / NDMA / NDRF)</h3>
                    </div>
                    <div className="card-body">
                        <div className="feeds-grid">
                            {officialFeeds.map(feed => (
                                <div key={feed.source} className="feed-source">
                                    <div className="feed-source-header">
                                        <h4>{feed.source}</h4>
                                        <span className="feed-source-name">{feed.name}</span>
                                    </div>
                                    {feed.alerts.map((alert, i) => (
                                        <div key={i} className={`feed-alert ${alert.severity}`}>
                                            <strong>{alert.title}</strong>
                                            <p>{alert.description}</p>
                                            <div className="feed-alert-meta">
                                                <span>📍 {alert.region}</span>
                                                <span>🕐 {new Date(alert.issued).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <a href={feed.url} target="_blank" rel="noopener noreferrer" className="feed-link">
                                        Visit {feed.source} Portal →
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Alerts */}
            <div className="card">
                <div className="card-header">
                    <h3>Recent Alerts</h3>
                </div>
                <div className="card-body">
                    {recentAlerts.length === 0 ? (
                        <p className="no-data">No recent alerts</p>
                    ) : (
                        <div className="alerts-list">
                            {recentAlerts.map((alert) => (
                                <div key={alert.id} className={`alert-item ${alert.type}`}>
                                    <div className="alert-content">
                                        <h4>{alert.title}</h4>
                                        <p>{alert.description}</p>
                                        <div className="alert-meta">
                                            <span>📍 {alert.location}</span>
                                            <span>🕐 {formatTime(alert.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
