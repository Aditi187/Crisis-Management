import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const pinIcon = L.divIcon({
    html: '<div style="background:#e74c3c;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">📍</div>',
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

function LocationPicker({ position, onSelect }) {
    useMapEvents({
        click(e) {
            onSelect([e.latlng.lat, e.latlng.lng]);
        }
    });
    return position ? <Marker position={position} icon={pinIcon} /> : null;
}

function DisasterReportModal({ onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'flood',
        severity: 'medium',
        location_name: '',
        latitude: '',
        longitude: '',
    });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [mapPosition, setMapPosition] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be less than 5MB');
                return;
            }
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleMapClick = useCallback((pos) => {
        setMapPosition(pos);
        setFormData(prev => ({
            ...prev,
            latitude: pos[0].toFixed(6),
            longitude: pos[1].toFixed(6)
        }));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        data.append('severity', formData.severity);
        data.append('location_name', formData.location_name);
        data.append('latitude', formData.latitude);
        data.append('longitude', formData.longitude);
        if (image) {
            data.append('image', image);
        }
        onSubmit(data);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>🚨 Report Disaster</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Disaster Title</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., Flooding in River Area" />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} required>
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
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Severity</label>
                            <select name="severity" value={formData.severity} onChange={handleChange}>
                                <option value="critical">🔴 Critical</option>
                                <option value="high">🟠 High</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="low">🔵 Low</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Location Name</label>
                            <input type="text" name="location_name" value={formData.location_name} onChange={handleChange} required placeholder="e.g., Mumbai, Maharashtra" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} required rows="3" placeholder="Describe the disaster situation..." />
                    </div>

                    <div className="form-group">
                        <label>📍 Pin Location on Map (click to select)</label>
                        <div className="modal-map">
                            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '250px', borderRadius: '8px' }}>
                                <TileLayer
                                    attribution='&copy; OpenStreetMap'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <LocationPicker position={mapPosition} onSelect={handleMapClick} />
                            </MapContainer>
                        </div>
                        <div className="coords-display">
                            {formData.latitude && formData.longitude ? (
                                <span>📌 Lat: {formData.latitude}, Lng: {formData.longitude}</span>
                            ) : (
                                <span className="hint">Click on the map to pin the disaster location</span>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>📷 Upload Image (optional)</label>
                        <input type="file" accept="image/*" onChange={handleImageChange} />
                        {imagePreview && (
                            <div className="image-preview">
                                <img src={imagePreview} alt="Preview" />
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-danger" disabled={!formData.latitude || !formData.longitude}>
                            🚨 Submit Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DisasterReportModal;
