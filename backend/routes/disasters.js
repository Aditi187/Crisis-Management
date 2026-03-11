const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Get disaster stats (must be before /:id route)
router.get('/stats/summary', auth, async (req, res) => {
    try {
        const [total] = await db.query('SELECT COUNT(*) as count FROM disaster_reports WHERE status != "resolved"');
        const [critical] = await db.query('SELECT COUNT(*) as count FROM disaster_reports WHERE severity = "critical" AND status != "resolved"');
        const [responding] = await db.query('SELECT COUNT(*) as count FROM disaster_reports WHERE status = "responding"');
        const [resolved] = await db.query('SELECT COUNT(*) as count FROM disaster_reports WHERE status = "resolved"');

        res.json({
            total: total[0].count,
            critical: critical[0].count,
            responding: responding[0].count,
            resolved: resolved[0].count
        });
    } catch (error) {
        console.error('Get disaster stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all disaster reports
router.get('/', auth, async (req, res) => {
    try {
        const { category, status } = req.query;
        let query = 'SELECT * FROM disaster_reports';
        const params = [];

        if (category || status) {
            query += ' WHERE';
            if (category) {
                query += ' category = ?';
                params.push(category);
            }
            if (status) {
                query += category ? ' AND status = ?' : ' status = ?';
                params.push(status);
            }
        }

        query += ' ORDER BY created_at DESC';

        const [reports] = await db.query(query, params);
        res.json(reports);
    } catch (error) {
        console.error('Get disaster reports error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single disaster report
router.get('/:id', auth, async (req, res) => {
    try {
        const [reports] = await db.query('SELECT * FROM disaster_reports WHERE id = ?', [req.params.id]);

        if (reports.length === 0) {
            return res.status(404).json({ error: 'Disaster report not found' });
        }

        res.json(reports[0]);
    } catch (error) {
        console.error('Get disaster report error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create disaster report with optional image (users only, not admin)
router.post('/', auth, (req, res, next) => {
    if (req.user.role === 'admin') {
        return res.status(403).json({ error: 'Admins cannot report disasters. Only users can report.' });
    }
    next();
}, upload.single('image'), async (req, res) => {
    try {
        const { title, description, category, latitude, longitude, location_name, severity } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const [result] = await db.query(
            'INSERT INTO disaster_reports (title, description, category, latitude, longitude, location_name, severity, image_url, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, category, latitude, longitude, location_name, severity || 'medium', image_url, req.user.id]
        );

        const [newReport] = await db.query('SELECT * FROM disaster_reports WHERE id = ?', [result.insertId]);

        await db.query(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'create_disaster_report', 'disaster_report', result.insertId]
        );

        const io = req.app.get('io');
        io.emit('disaster:created', newReport[0]);

        res.status(201).json(newReport[0]);
    } catch (error) {
        console.error('Create disaster report error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update disaster report (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
    try {
        const { title, description, category, latitude, longitude, location_name, status, severity } = req.body;

        const updates = [];
        const params = [];

        if (title) { updates.push('title = ?'); params.push(title); }
        if (description) { updates.push('description = ?'); params.push(description); }
        if (category) { updates.push('category = ?'); params.push(category); }
        if (latitude !== undefined) { updates.push('latitude = ?'); params.push(latitude); }
        if (longitude !== undefined) { updates.push('longitude = ?'); params.push(longitude); }
        if (location_name) { updates.push('location_name = ?'); params.push(location_name); }
        if (status) {
            updates.push('status = ?');
            params.push(status);
            if (status === 'resolved') {
                updates.push('resolved_at = NOW()');
            }
        }
        if (severity) { updates.push('severity = ?'); params.push(severity); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(req.params.id);

        await db.query(`UPDATE disaster_reports SET ${updates.join(', ')} WHERE id = ?`, params);

        const [updated] = await db.query('SELECT * FROM disaster_reports WHERE id = ?', [req.params.id]);

        const io = req.app.get('io');
        io.emit('disaster:updated', updated[0]);

        res.json(updated[0]);
    } catch (error) {
        console.error('Update disaster report error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete disaster report (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM disaster_reports WHERE id = ?', [req.params.id]);

        const io = req.app.get('io');
        io.emit('disaster:deleted', { id: req.params.id });

        res.json({ message: 'Disaster report deleted successfully' });
    } catch (error) {
        console.error('Delete disaster report error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
