import React, { useState, useEffect } from 'react';
import socketService from '../services/socket';
import '../styles/Notification.css';

function RealTimeNotification() {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const showNotification = (notification) => {
            setNotifications((prev) => [...prev, notification]);

            // Auto remove after 5 seconds
            setTimeout(() => {
                setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
            }, 5000);
        };

        // Listen for new alerts
        socketService.onAlertCreated((alert) => {
            showNotification({
                id: Date.now(),
                type: alert.type,
                title: 'New Alert Created',
                message: alert.title,
            });
        });

        // Listen for new incidents
        socketService.onIncidentCreated((incident) => {
            showNotification({
                id: Date.now(),
                type: 'incident',
                title: 'New Incident Reported',
                message: incident.title,
            });
        });

        // Listen for resolved alerts
        socketService.onAlertUpdated((alert) => {
            if (alert.status === 'resolved') {
                showNotification({
                    id: Date.now(),
                    type: 'success',
                    title: 'Alert Resolved',
                    message: alert.title,
                });
            }
        });

        return () => {
            socketService.offAlertEvents();
            socketService.offIncidentEvents();
        };
    }, []);

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const getIcon = (type) => {
        switch (type) {
            case 'critical':
                return '🚨';
            case 'warning':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            case 'incident':
                return '🔥';
            case 'success':
                return '✅';
            default:
                return '🔔';
        }
    };

    const getTypeClass = (type) => {
        switch (type) {
            case 'critical':
                return 'notification-critical';
            case 'warning':
                return 'notification-warning';
            case 'info':
                return 'notification-info';
            case 'incident':
                return 'notification-incident';
            case 'success':
                return 'notification-success';
            default:
                return 'notification-default';
        }
    };

    return (
        <div className="notification-container">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`notification ${getTypeClass(notification.type)}`}
                >
                    <div className="notification-icon">{getIcon(notification.type)}</div>
                    <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-message">{notification.message}</div>
                    </div>
                    <button
                        className="notification-close"
                        onClick={() => removeNotification(notification.id)}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}

export default RealTimeNotification;
