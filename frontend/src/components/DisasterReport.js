import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { disastersAPI } from '../services/api';
import socketService from '../services/socket';
import DisasterReportModal from './DisasterReportModal';
import '../styles/DisasterReport.css';

function DisasterReport() {
    const { user } = useOutletContext();
    const isAdmin = user?.role === 'admin';
    const [disasters, setDisasters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchDisasters();

        socketService.onDisasterCreated((d) => setDisasters(prev => [d, ...prev]));
        socketService.onDisasterUpdated((d) => setDisasters(prev => prev.map(item => item.id === d.id ? d : item)));
        socketService.onDisasterDeleted(({ id }) => setDisasters(prev => prev.filter(item => item.id !== id)));

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

    const handleCreate = async (formData) => {
        try {
            await disastersAPI.create(formData);
            fetchDisasters();
            setShowModal(false);
        } catch (err) {
            console.error('Error creating report:', err);
            alert('Failed to create disaster report');
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await disastersAPI.update(id, { status });
            fetchDisasters();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                await disastersAPI.delete(id);
                fetchDisasters();
            } catch (err) {
                console.error('Error deleting report:', err);
            }
        }
    };

    const categoryEmojis = {
        flood: '🌊', fire: '🔥', earthquake: '🌍', cyclone: '🌀',
        landslide: '⛰️', tsunami: '🌊', drought: '☀️', other: '⚠️'
    };

    const filtered = disasters.filter(d => {
        if (filterCategory !== 'all' && d.category !== filterCategory) return false;
        if (filterStatus !== 'all' && d.status !== filterStatus) return false;
        return true;
    });

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    if (loading) return <div className="loading">Loading disaster reports...</div>;

    return (
        <div className="disaster-report-page">
            <div className="content-header">
                <h2>🚨 Disaster Reports</h2>
                {!isAdmin && (
                    <button className="btn btn-danger" onClick={() => setShowModal(true)}>
                        + Report Disaster
                    </button>
                )}
            </div>

            <div className="disaster-filters">
                <div className="filter-group">
                    <label>Category:</label>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option value="all">All Categories</option>
                        <option value="flood">🌊 Flood</option>
                        <option value="fire">🔥 Fire</option>
                        <option value="earthquake">🌍 Earthquake</option>
                        <option value="cyclone">🌀 Cyclone</option>
                        <option value="landslide">⛰️ Landslide</option>
                        <option value="tsunami">🌊 Tsunami</option>
                        <option value="drought">☀️ Drought</option>
                        <option value="other">⚠️ Other</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Status:</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">All Statuses</option>
                        <option value="reported">Reported</option>
                        <option value="verified">Verified</option>
                        <option value="responding">Responding</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
            </div>

            <div className="disaster-grid">
                {filtered.length === 0 ? (
                    <p className="no-data">No disaster reports found</p>
                ) : (
                    filtered.map(disaster => (
                        <div key={disaster.id} className={`disaster-card ${disaster.severity}`}>
                            {disaster.image_url && (
                                <div className="disaster-image">
                                    <img src={`http://localhost:5001${disaster.image_url}`} alt={disaster.title} />
                                </div>
                            )}
                            <div className="disaster-card-body">
                                <div className="disaster-card-header">
                                    <span className="disaster-category">
                                        {categoryEmojis[disaster.category]} {disaster.category}
                                    </span>
                                    <span className={`severity-badge ${disaster.severity}`}>
                                        {disaster.severity.toUpperCase()}
                                    </span>
                                </div>
                                <h3>{disaster.title}</h3>
                                <p className="disaster-desc">{disaster.description}</p>
                                <div className="disaster-meta">
                                    <span>📍 {disaster.location_name}</span>
                                    <span>🕐 {formatTime(disaster.created_at)}</span>
                                </div>
                                <div className="disaster-status-bar">
                                    <span className={`status-badge ${disaster.status}`}>{disaster.status.toUpperCase()}</span>
                                </div>
                                <div className="disaster-actions">
                                    {isAdmin && disaster.status === 'reported' && (
                                        <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(disaster.id, 'verified')}>
                                            ✓ Verify
                                        </button>
                                    )}
                                    {isAdmin && disaster.status === 'verified' && (
                                        <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(disaster.id, 'responding')}>
                                            🚑 Respond
                                        </button>
                                    )}
                                    {isAdmin && disaster.status !== 'resolved' && (
                                        <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(disaster.id, 'resolved')}>
                                            ✅ Resolve
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(disaster.id)}>
                                            🗑 Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <DisasterReportModal
                    onClose={() => setShowModal(false)}
                    onSubmit={handleCreate}
                />
            )}
        </div>
    );
}

export default DisasterReport;
