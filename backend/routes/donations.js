const express = require('express');
const crypto = require('crypto');
const db = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Lazy-init Razorpay only when keys are configured
let razorpay = null;
function getRazorpay() {
    if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        const Razorpay = require('razorpay');
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
    return razorpay;
}

// Get donation stats (must be before /:id)
router.get('/stats/summary', auth, async (req, res) => {
    try {
        const [total] = await db.query('SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM donations WHERE status = "paid"');
        res.json({
            totalAmount: total[0].total,
            totalDonations: total[0].count
        });
    } catch (error) {
        console.error('Get donation stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Razorpay public key
router.get('/config', auth, (req, res) => {
    res.json({
        key_id: process.env.RAZORPAY_KEY_ID || '',
        configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    });
});

// Create donation order
router.post('/create-order', auth, async (req, res) => {
    try {
        const { amount, donor_name, donor_email, disaster_report_id, message } = req.body;

        const rz = getRazorpay();
        if (!rz) {
            // If Razorpay not configured, create a mock donation record
            const [result] = await db.query(
                'INSERT INTO donations (donor_name, donor_email, amount, razorpay_order_id, disaster_report_id, message, status) VALUES (?, ?, ?, ?, ?, ?, "paid")',
                [donor_name, donor_email, amount, 'mock_' + Date.now(), disaster_report_id || null, message || null]
            );

            const io = req.app.get('io');
            io.emit('donation:received', { amount, donor_name });

            return res.json({
                success: true,
                mock: true,
                message: 'Donation recorded (Razorpay not configured - test mode)',
                donationId: result.insertId
            });
        }

        const options = {
            amount: Math.round(amount * 100), // paise
            currency: 'INR',
            receipt: `donation_${Date.now()}`
        };

        const order = await rz.orders.create(options);

        const [result] = await db.query(
            'INSERT INTO donations (donor_name, donor_email, amount, razorpay_order_id, disaster_report_id, message) VALUES (?, ?, ?, ?, ?, ?)',
            [donor_name, donor_email, amount, order.id, disaster_report_id || null, message || null]
        );

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            donationId: result.insertId
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create donation order' });
    }
});

// Verify Razorpay payment
router.post('/verify', auth, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            await db.query(
                'UPDATE donations SET razorpay_payment_id = ?, razorpay_signature = ?, status = "paid" WHERE razorpay_order_id = ?',
                [razorpay_payment_id, razorpay_signature, razorpay_order_id]
            );

            const io = req.app.get('io');
            io.emit('donation:received', { orderId: razorpay_order_id });

            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            await db.query(
                'UPDATE donations SET status = "failed" WHERE razorpay_order_id = ?',
                [razorpay_order_id]
            );
            res.status(400).json({ error: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

// Get all donations
router.get('/', auth, async (req, res) => {
    try {
        const [donations] = await db.query(
            'SELECT d.*, dr.title as disaster_title FROM donations d LEFT JOIN disaster_reports dr ON d.disaster_report_id = dr.id ORDER BY d.created_at DESC'
        );
        res.json(donations);
    } catch (error) {
        console.error('Get donations error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
