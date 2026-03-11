const express = require('express');
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all incidents
router.get('/', auth, async (req, res) => {
    try {
        const { severity, status } = req.query;
        let query = 'SELECT * FROM incidents';
        const params = [];

        if (severity || status) {
            query += ' WHERE';
            if (severity) {
                query += ' severity = ?';
                params.push(severity);
            }
            if (status) {
                query += severity ? ' AND status = ?' : ' status = ?';
                params.push(status);
            }
        }

        query += ' ORDER BY created_at DESC';

        const [incidents] = await db.query(query, params);
        res.json(incidents);
    } catch (error) {
        console.error('Get incidents error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single incident
router.get('/:id', auth, async (req, res) => {
    try {
        const [incidents] = await db.query('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
        
        if (incidents.length === 0) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        res.json(incidents[0]);
    } catch (error) {
        console.error('Get incident error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create incident
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, severity, location, latitude, longitude } = req.body;

        const [result] = await db.query(
            'INSERT INTO incidents (title, description, severity, location, latitude, longitude, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, severity, location, latitude, longitude, req.user.id]
        );

        const [newIncident] = await db.query('SELECT * FROM incidents WHERE id = ?', [result.insertId]);
        
        // Log activity
        await db.query(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'create_incident', 'incident', result.insertId]
        );

        // Emit real-time event
        const io = req.app.get('io');
        io.emit('incident:created', newIncident[0]);

        res.status(201).json(newIncident[0]);
    } catch (error) {
        console.error('Create incident error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update incident (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
    try {
        const { title, description, severity, location, latitude, longitude, status, assigned_to } = req.body;

        const updates = [];
        const params = [];

        if (title) {
            updates.push('title = ?');
            params.push(title);
        }
        if (description) {
            updates.push('description = ?');
            params.push(description);
        }
        if (severity) {
            updates.push('severity = ?');
            params.push(severity);
        }
        if (location) {
            updates.push('location = ?');
            params.push(location);
        }
        if (latitude !== undefined) {
            updates.push('latitude = ?');
            params.push(latitude);
        }
        if (longitude !== undefined) {
            updates.push('longitude = ?');
            params.push(longitude);
        }
        if (status) {
            updates.push('status = ?');
            params.push(status);
            if (status === 'resolved') {
                updates.push('resolved_at = NOW()');
            }
        }
        if (assigned_to !== undefined) {
            updates.push('assigned_to = ?');
            params.push(assigned_to);
        }

        params.push(req.params.id);

        await db.query(
            `UPDATE incidents SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        const [updatedIncident] = await db.query('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
        
        // Emit real-time event
        const io = req.app.get('io');
        io.emit('incident:updated', updatedIncident[0]);

        res.json(updatedIncident[0]);
    } catch (error) {
        console.error('Update incident error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete incident (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM incidents WHERE id = ?', [req.params.id]);
        
        // Emit real-time event
        const io = req.app.get('io');
        io.emit('incident:deleted', { id: req.params.id });

        res.json({ message: 'Incident deleted successfully' });
    } catch (error) {
        console.error('Delete incident error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
