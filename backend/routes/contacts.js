const express = require('express');
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all contacts
router.get('/', auth, async (req, res) => {
    try {
        const [contacts] = await db.query('SELECT * FROM emergency_contacts WHERE is_active = TRUE ORDER BY name');
        res.json(contacts);
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single contact
router.get('/:id', auth, async (req, res) => {
    try {
        const [contacts] = await db.query('SELECT * FROM emergency_contacts WHERE id = ?', [req.params.id]);
        
        if (contacts.length === 0) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json(contacts[0]);
    } catch (error) {
        console.error('Get contact error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create contact (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
    try {
        const { name, role, phone, email, department } = req.body;

        const [result] = await db.query(
            'INSERT INTO emergency_contacts (name, role, phone, email, department) VALUES (?, ?, ?, ?, ?)',
            [name, role, phone, email, department]
        );

        const [newContact] = await db.query('SELECT * FROM emergency_contacts WHERE id = ?', [result.insertId]);
        
        res.status(201).json(newContact[0]);
    } catch (error) {
        console.error('Create contact error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update contact (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
    try {
        const { name, role, phone, email, department, is_active } = req.body;

        const updates = [];
        const params = [];

        if (name) {
            updates.push('name = ?');
            params.push(name);
        }
        if (role) {
            updates.push('role = ?');
            params.push(role);
        }
        if (phone) {
            updates.push('phone = ?');
            params.push(phone);
        }
        if (email) {
            updates.push('email = ?');
            params.push(email);
        }
        if (department) {
            updates.push('department = ?');
            params.push(department);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active);
        }

        params.push(req.params.id);

        await db.query(
            `UPDATE emergency_contacts SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        const [updatedContact] = await db.query('SELECT * FROM emergency_contacts WHERE id = ?', [req.params.id]);
        
        res.json(updatedContact[0]);
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete contact (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        // Soft delete
        await db.query('UPDATE emergency_contacts SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
