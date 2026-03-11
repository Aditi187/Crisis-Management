const express = require('express');
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all alerts
router.get('/', auth, async (req, res) => {
    try {
        const { type, status } = req.query;
        let query = 'SELECT * FROM alerts';
        const params = [];

        if (type || status) {
            query += ' WHERE';
            if (type) {
                query += ' type = ?';
                params.push(type);
            }
            if (status) {
                query += type ? ' AND status = ?' : ' status = ?';
                params.push(status);
            }
        }

        query += ' ORDER BY created_at DESC';

        const [alerts] = await db.query(query, params);
        res.json(alerts);
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single alert
router.get('/:id', auth, async (req, res) => {
    try {
        const [alerts] = await db.query('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
        
        if (alerts.length === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        res.json(alerts[0]);
    } catch (error) {
        console.error('Get alert error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create alert (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
    try {
        const { title, description, type, location, latitude, longitude } = req.body;

        const [result] = await db.query(
            'INSERT INTO alerts (title, description, type, location, latitude, longitude, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, type, location, latitude, longitude, req.user.id]
        );

        const [newAlert] = await db.query('SELECT * FROM alerts WHERE id = ?', [result.insertId]);
        
        // Log activity
        await db.query(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'create_alert', 'alert', result.insertId]
        );

        // Emit real-time event
        const io = req.app.get('io');
        io.emit('alert:created', newAlert[0]);

        res.status(201).json(newAlert[0]);
    } catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update alert (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
    try {
        const { title, description, type, location, latitude, longitude, status } = req.body;

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
        if (type) {
            updates.push('type = ?');
            params.push(type);
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

        params.push(req.params.id);

        await db.query(
            `UPDATE alerts SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        const [updatedAlert] = await db.query('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
        
        // Emit real-time event
        const io = req.app.get('io');
        io.emit('alert:updated', updatedAlert[0]);

        res.json(updatedAlert[0]);
    } catch (error) {
        console.error('Update alert error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete alert (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM alerts WHERE id = ?', [req.params.id]);
        
        // Emit real-time event
        const io = req.app.get('io');
        io.emit('alert:deleted', { id: req.params.id });

        res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
        console.error('Delete alert error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get alert statistics
router.get('/stats/summary', auth, async (req, res) => {
    try {
        const [critical] = await db.query('SELECT COUNT(*) as count FROM alerts WHERE type = "critical" AND status = "active"');
        const [warning] = await db.query('SELECT COUNT(*) as count FROM alerts WHERE type = "warning" AND status = "active"');
        const [total] = await db.query('SELECT COUNT(*) as count FROM alerts WHERE status = "active"');
        const [resolvedToday] = await db.query('SELECT COUNT(*) as count FROM alerts WHERE status = "resolved" AND DATE(resolved_at) = CURDATE()');

        res.json({
            critical: critical[0].count,
            warning: warning[0].count,
            total: total[0].count,
            resolvedToday: resolvedToday[0].count
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
