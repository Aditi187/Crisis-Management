const express = require('express');
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get volunteer stats (must be before /:id)
router.get('/stats/summary', auth, async (req, res) => {
    try {
        const [total] = await db.query('SELECT COUNT(*) as count FROM volunteers WHERE is_active = TRUE');
        const [available] = await db.query('SELECT COUNT(*) as count FROM volunteers WHERE is_active = TRUE AND availability = "available"');

        res.json({
            total: total[0].count,
            available: available[0].count
        });
    } catch (error) {
        console.error('Get volunteer stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all volunteers (public directory) with search & skill filter
router.get('/', auth, async (req, res) => {
    try {
        const { availability, skill, search } = req.query;
        let query = 'SELECT * FROM volunteers WHERE is_active = TRUE';
        const params = [];

        if (availability) {
            query += ' AND availability = ?';
            params.push(availability);
        }

        if (skill) {
            query += ' AND skills LIKE ?';
            params.push(`%${skill}%`);
        }

        if (search) {
            query += ' AND (name LIKE ? OR location LIKE ? OR skills LIKE ? OR email LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        query += ' ORDER BY created_at DESC';

        const [volunteers] = await db.query(query, params);
        res.json(volunteers);
    } catch (error) {
        console.error('Get volunteers error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single volunteer
router.get('/:id', auth, async (req, res) => {
    try {
        const [volunteers] = await db.query('SELECT * FROM volunteers WHERE id = ? AND is_active = TRUE', [req.params.id]);

        if (volunteers.length === 0) {
            return res.status(404).json({ error: 'Volunteer not found' });
        }

        res.json(volunteers[0]);
    } catch (error) {
        console.error('Get volunteer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Register volunteer (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
    try {
        const { name, email, phone, skills, location } = req.body;

        const [existing] = await db.query('SELECT id FROM volunteers WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Volunteer with this email already exists' });
        }

        const [result] = await db.query(
            'INSERT INTO volunteers (name, email, phone, skills, location) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, skills, location]
        );

        const [newVolunteer] = await db.query('SELECT * FROM volunteers WHERE id = ?', [result.insertId]);
        res.status(201).json(newVolunteer[0]);
    } catch (error) {
        console.error('Register volunteer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update volunteer (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
    try {
        const { name, phone, skills, location, availability, is_active } = req.body;

        const updates = [];
        const params = [];

        if (name) { updates.push('name = ?'); params.push(name); }
        if (phone) { updates.push('phone = ?'); params.push(phone); }
        if (skills) { updates.push('skills = ?'); params.push(skills); }
        if (location) { updates.push('location = ?'); params.push(location); }
        if (availability) { updates.push('availability = ?'); params.push(availability); }
        if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(req.params.id);

        await db.query(`UPDATE volunteers SET ${updates.join(', ')} WHERE id = ?`, params);

        const [updated] = await db.query('SELECT * FROM volunteers WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        console.error('Update volunteer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete volunteer (soft delete, admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        await db.query('UPDATE volunteers SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Volunteer removed successfully' });
    } catch (error) {
        console.error('Delete volunteer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
