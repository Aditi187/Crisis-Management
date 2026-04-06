import React, { useState, useCallback, useRef } from 'react';
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
    const [isListening, setIsListening] = useState(false);

    // -- Component 3: NLP Voice-to-Threat SOS Parser --
    const startListening = (e) => {
        e.preventDefault();
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech Recognition is not supported in your browser. Please use Chrome/Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            
            // NLP Keyword Extraction
            let detectedCategory = formData.category;
            let detectedSeverity = formData.severity;
            
            if (transcript.includes('fire') || transcript.includes('burn')) detectedCategory = 'fire';
            else if (transcript.includes('flood') || transcript.includes('water')) detectedCategory = 'flood';
            else if (transcript.includes('earthquake') || transcript.includes('shake')) detectedCategory = 'earthquake';
            else if (transcript.includes('landslide')) detectedCategory = 'landslide';
            else if (transcript.includes('cyclone') || transcript.includes('storm')) detectedCategory = 'cyclone';
            else if (transcript.includes('tsunami')) detectedCategory = 'tsunami';

            if (transcript.includes('critical') || transcript.includes('help') || transcript.includes('dying') || transcript.includes('trapped')) detectedSeverity = 'critical';
            else if (transcript.includes('high') || transcript.includes('bad') || transcript.includes('severe')) detectedSeverity = 'high';
            else if (transcript.includes('minor') || transcript.includes('low')) detectedSeverity = 'low';

            setFormData(prev => ({
                ...prev,
                title: prev.title ? prev.title : 'Voice: ' + transcript.split(' ').slice(0, 4).join(' ') + '...',
                description: (prev.description ? prev.description + '\n' : '') + '[Auto-Transcript]: ' + transcript,
                category: detectedCategory,
                severity: detectedSeverity
            }));
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            alert('Microphone error: ' + event.error);
        };
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

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
                    
                    {/* Component 3: SOS Voice Input Button */}
                    <div style={{ marginBottom: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e1e8ed' }}>
                        <button 
                            type="button" 
                            onClick={startListening} 
                            className={`btn ${isListening ? 'btn-danger' : 'btn-primary'}`}
                            style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold' }}
                        >
                            {isListening ? '🎙️ Listening... Speak Now' : '🎙️ Tap to Speak SOS (Auto-Fill)'}
                        </button>
                        <small style={{display: 'block', marginTop: '8px', color: '#7f8c8d'}}>
                            Describe the emergency using your microphone. We'll automatically transcribe it and extract the category and severity.
                        </small>
                    </div>

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
