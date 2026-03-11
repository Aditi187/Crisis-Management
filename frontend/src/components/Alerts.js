import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { alertsAPI } from '../services/api';
import socketService from '../services/socket';
import AlertModal from './AlertModal';
import '../styles/Alerts.css';

function Alerts() {
    const { user } = useOutletContext();
    const isAdmin = user?.role === 'admin';
    const [alerts, setAlerts] = useState([]);
    const [filteredAlerts, setFilteredAlerts] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchAlerts();

        // Setup real-time listeners
        socketService.onAlertCreated((newAlert) => {
            console.log('🔔 New alert received in Alerts page:', newAlert);
            setAlerts((prev) => [newAlert, ...prev]);
        });

        socketService.onAlertUpdated((updatedAlert) => {
            console.log('🔄 Alert updated in Alerts page:', updatedAlert);
            setAlerts((prev) =>
                prev.map((alert) => (alert.id === updatedAlert.id ? updatedAlert : alert))
            );
        });

        socketService.onAlertDeleted(({ id }) => {
            console.log('🗑️ Alert deleted in Alerts page:', id);
            setAlerts((prev) => prev.filter((alert) => alert.id !== id));
        });

        // Cleanup listeners
        return () => {
            socketService.offAlertEvents();
        };
    }, []);

    useEffect(() => {
        if (filter === 'all') {
            setFilteredAlerts(alerts);
        } else {
            setFilteredAlerts(alerts.filter((alert) => alert.type === filter));
        }
    }, [filter, alerts]);

    const fetchAlerts = async () => {
        try {
            const response = await alertsAPI.getAll();
            setAlerts(response.data);
            setFilteredAlerts(response.data);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAlert = async (alertData) => {
        try {
            await alertsAPI.create(alertData);
            fetchAlerts();
            setShowModal(false);
        } catch (error) {
            console.error('Error creating alert:', error);
            alert('Failed to create alert');
        }
    };

    const handleResolveAlert = async (id) => {
        try {
            await alertsAPI.update(id, { status: 'resolved' });
            fetchAlerts();
        } catch (error) {
            console.error('Error resolving alert:', error);
        }
    };

    const handleDeleteAlert = async (id) => {
        if (window.confirm('Are you sure you want to delete this alert?')) {
            try {
                await alertsAPI.delete(id);
                fetchAlerts();
            } catch (error) {
                console.error('Error deleting alert:', error);
            }
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
        return <div className="loading">Loading alerts...</div>;
    }

    return (
        <div className="alerts-page">
            <div className="content-header">
                <h2>Alert Management</h2>
                <div className="header-actions">
                    <div className="filter-buttons">
                        <button
                            className={`btn btn-sm ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button
                            className={`btn btn-sm ${filter === 'critical' ? 'active' : ''}`}
                            onClick={() => setFilter('critical')}
                        >
                            Critical
                        </button>
                        <button
                            className={`btn btn-sm ${filter === 'warning' ? 'active' : ''}`}
                            onClick={() => setFilter('warning')}
                        >
                            Warning
                        </button>
                        <button
                            className={`btn btn-sm ${filter === 'info' ? 'active' : ''}`}
                            onClick={() => setFilter('info')}
                        >
                            Info
                        </button>
                    </div>
                    {isAdmin && (
                        <button className="btn btn-danger" onClick={() => setShowModal(true)}>
                            + Create Alert
                        </button>
                    )}
                </div>
            </div>

            <div className="alerts-grid">
                {filteredAlerts.length === 0 ? (
                    <p className="no-data">No alerts to display</p>
                ) : (
                    filteredAlerts.map((alert) => (
                        <div key={alert.id} className={`alert-card ${alert.type}`}>
                            <div className="alert-card-header">
                                <span className={`badge ${alert.type}`}>
                                    {alert.type.toUpperCase()}
                                </span>
                                <span className={`status ${alert.status}`}>
                                    {alert.status}
                                </span>
                            </div>
                            <h3>{alert.title}</h3>
                            <p>{alert.description}</p>
                            <div className="alert-meta">
                                <span>📍 {alert.location}</span>
                                <span>🕐 {formatTime(alert.created_at)}</span>
                            </div>
                            {alert.status === 'active' && isAdmin && (
                                <div className="alert-actions">
                                    <button
                                        className="btn btn-sm btn-success"
                                        onClick={() => handleResolveAlert(alert.id)}
                                    >
                                        ✓ Resolve
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDeleteAlert(alert.id)}
                                    >
                                        🗑 Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <AlertModal
                    onClose={() => setShowModal(false)}
                    onSubmit={handleCreateAlert}
                />
            )}
        </div>
    );
}

export default Alerts;
