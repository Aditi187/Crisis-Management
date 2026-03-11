import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { incidentsAPI } from '../services/api';
import socketService from '../services/socket';
import IncidentModal from './IncidentModal';
import '../styles/Incidents.css';

function Incidents() {
    const { user } = useOutletContext();
    const isAdmin = user?.role === 'admin';
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchIncidents();

        // Setup real-time listeners
        socketService.onIncidentCreated((newIncident) => {
            console.log('🔔 New incident received:', newIncident);
            setIncidents((prev) => [newIncident, ...prev]);
        });

        socketService.onIncidentUpdated((updatedIncident) => {
            console.log('🔄 Incident updated:', updatedIncident);
            setIncidents((prev) =>
                prev.map((incident) =>
                    incident.id === updatedIncident.id ? updatedIncident : incident
                )
            );
        });

        socketService.onIncidentDeleted(({ id }) => {
            console.log('🗑️ Incident deleted:', id);
            setIncidents((prev) => prev.filter((incident) => incident.id !== id));
        });

        // Cleanup listeners
        return () => {
            socketService.offIncidentEvents();
        };
    }, []);

    const fetchIncidents = async () => {
        try {
            const response = await incidentsAPI.getAll();
            setIncidents(response.data);
        } catch (error) {
            console.error('Error fetching incidents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateIncident = async (incidentData) => {
        try {
            await incidentsAPI.create(incidentData);
            fetchIncidents();
            setShowModal(false);
        } catch (error) {
            console.error('Error creating incident:', error);
            alert('Failed to create incident');
        }
    };

    const handleResolveIncident = async (id) => {
        try {
            await incidentsAPI.update(id, { status: 'resolved' });
            fetchIncidents();
        } catch (error) {
            console.error('Error resolving incident:', error);
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    if (loading) {
        return <div className="loading">Loading incidents...</div>;
    }

    return (
        <div className="incidents-page">
            <div className="content-header">
                <h2>Incident Reports</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + Report Incident
                </button>
            </div>

            <div className="incidents-container">
                {incidents.length === 0 ? (
                    <p className="no-data">No incidents to display</p>
                ) : (
                    incidents.map((incident) => (
                        <div key={incident.id} className={`incident-card ${incident.severity}`}>
                            <div className="incident-header">
                                <div>
                                    <h3>{incident.title}</h3>
                                    <span className={`badge ${incident.status}`}>
                                        {incident.status.toUpperCase()}
                                    </span>
                                </div>
                                <span className={`severity-badge ${incident.severity}`}>
                                    {incident.severity.toUpperCase()}
                                </span>
                            </div>
                            <p className="incident-description">{incident.description}</p>
                            <div className="incident-meta">
                                <span>📍 {incident.location}</span>
                                <span>🕐 {formatTime(incident.created_at)}</span>
                            </div>
                            {incident.status === 'active' && isAdmin && (
                                <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleResolveIncident(incident.id)}
                                >
                                    ✓ Mark as Resolved
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <IncidentModal
                    onClose={() => setShowModal(false)}
                    onSubmit={handleCreateIncident}
                />
            )}
        </div>
    );
}

export default Incidents;
