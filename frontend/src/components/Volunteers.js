import React, { useState, useEffect } from 'react';
import { volunteersAPI } from '../services/api';
import VolunteerModal from './VolunteerModal';
import { useOutletContext } from 'react-router-dom';
import '../styles/Volunteers.css';

function Volunteers() {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filterAvailability, setFilterAvailability] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [skillFilter, setSkillFilter] = useState('');
    const [stats, setStats] = useState({ total: 0, available: 0 });
    const { user } = useOutletContext();
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchVolunteers();
        fetchStats();
    }, []);

    const fetchVolunteers = async () => {
        try {
            const res = await volunteersAPI.getAll();
            setVolunteers(res.data);
        } catch (err) {
            console.error('Error fetching volunteers:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await volunteersAPI.getStats();
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const handleRegister = async (data) => {
        try {
            await volunteersAPI.create(data);
            fetchVolunteers();
            fetchStats();
            setShowModal(false);
        } catch (err) {
            console.error('Error registering volunteer:', err);
            const msg = err.response?.data?.error || 'Failed to register volunteer';
            alert(msg);
        }
    };

    const handleStatusChange = async (id, availability) => {
        try {
            await volunteersAPI.update(id, { availability });
            fetchVolunteers();
            fetchStats();
        } catch (err) {
            console.error('Error updating volunteer:', err);
        }
    };

    const handleRemove = async (id) => {
        if (window.confirm('Are you sure you want to remove this volunteer?')) {
            try {
                await volunteersAPI.delete(id);
                fetchVolunteers();
                fetchStats();
            } catch (err) {
                console.error('Error removing volunteer:', err);
            }
        }
    };

    const filtered = volunteers.filter(v => {
        const matchAvail = filterAvailability === 'all' || v.availability === filterAvailability;
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || v.name.toLowerCase().includes(q) || (v.location || '').toLowerCase().includes(q) || (v.email || '').toLowerCase().includes(q) || (v.skills || '').toLowerCase().includes(q);
        const matchSkill = !skillFilter || (v.skills || '').toLowerCase().includes(skillFilter.toLowerCase());
        return matchAvail && matchSearch && matchSkill;
    });

    // Extract all unique skills for filter dropdown
    const allSkills = [...new Set(
        volunteers.flatMap(v => (v.skills || '').split(',').map(s => s.trim()).filter(Boolean))
    )].sort();

    const availabilityColors = { available: '#27ae60', busy: '#f39c12', offline: '#95a5a6' };

    if (loading) return <div className="loading">Loading volunteers...</div>;

    return (
        <div className="volunteers-page">
            <div className="content-header">
                <h2>🤝 Volunteer Network</h2>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Register Volunteer
                    </button>
                )}
            </div>

            <div className="volunteer-stats">
                <div className="vol-stat">
                    <span className="vol-stat-number">{stats.total}</span>
                    <span className="vol-stat-label">Total Volunteers</span>
                </div>
                <div className="vol-stat available">
                    <span className="vol-stat-number">{stats.available}</span>
                    <span className="vol-stat-label">Available Now</span>
                </div>
            </div>

            <div className="volunteer-filter">
                <div className="volunteer-search-bar">
                    <input
                        type="text"
                        placeholder="🔍 Search by name, location, skills, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={skillFilter}
                        onChange={(e) => setSkillFilter(e.target.value)}
                        className="skill-select"
                    >
                        <option value="">All Skills</option>
                        {allSkills.map(skill => (
                            <option key={skill} value={skill}>{skill}</option>
                        ))}
                    </select>
                </div>
                <div className="availability-filters">
                    <button className={`filter-btn ${filterAvailability === 'all' ? 'active' : ''}`} onClick={() => setFilterAvailability('all')}>All</button>
                    <button className={`filter-btn ${filterAvailability === 'available' ? 'active' : ''}`} onClick={() => setFilterAvailability('available')}>🟢 Available</button>
                    <button className={`filter-btn ${filterAvailability === 'busy' ? 'active' : ''}`} onClick={() => setFilterAvailability('busy')}>🟡 Busy</button>
                    <button className={`filter-btn ${filterAvailability === 'offline' ? 'active' : ''}`} onClick={() => setFilterAvailability('offline')}>⚫ Offline</button>
                </div>
            </div>

            <div className="volunteers-grid">
                {filtered.length === 0 ? (
                    <p className="no-data">No volunteers found</p>
                ) : (
                    filtered.map(volunteer => (
                        <div key={volunteer.id} className="volunteer-card">
                            <div className="volunteer-avatar" style={{ borderColor: availabilityColors[volunteer.availability] }}>
                                {volunteer.name.charAt(0)}
                            </div>
                            <div className="volunteer-status-dot" style={{ background: availabilityColors[volunteer.availability] }}></div>
                            <h3>{volunteer.name}</h3>
                            <span className={`availability-badge ${volunteer.availability}`}>
                                {volunteer.availability}
                            </span>

                            {volunteer.skills && (
                                <div className="volunteer-skills">
                                    {volunteer.skills.split(',').map((skill, i) => (
                                        <span key={i} className="skill-tag">{skill.trim()}</span>
                                    ))}
                                </div>
                            )}

                            <div className="volunteer-info">
                                <div className="info-item">
                                    <span>📍</span><span>{volunteer.location || 'Not specified'}</span>
                                </div>
                                <div className="info-item">
                                    <span>📞</span><span>{volunteer.phone}</span>
                                </div>
                                <div className="info-item">
                                    <span>✉️</span><span>{volunteer.email}</span>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="volunteer-actions">
                                    <select
                                        value={volunteer.availability}
                                        onChange={(e) => handleStatusChange(volunteer.id, e.target.value)}
                                        className="status-select"
                                    >
                                        <option value="available">Available</option>
                                        <option value="busy">Busy</option>
                                        <option value="offline">Offline</option>
                                    </select>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleRemove(volunteer.id)}>
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <VolunteerModal
                    onClose={() => setShowModal(false)}
                    onSubmit={handleRegister}
                />
            )}
        </div>
    );
}

export default Volunteers;
