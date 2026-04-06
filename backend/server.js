const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const path = require('path');
const authRoutes = require('./routes/auth');
const alertRoutes = require('./routes/alerts');
const incidentRoutes = require('./routes/incidents');
const contactRoutes = require('./routes/contacts');
const disasterRoutes = require('./routes/disasters');
const volunteerRoutes = require('./routes/volunteers');
const donationRoutes = require('./routes/donations');
const intelligenceRoutes = require('./routes/intelligence');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});
const PORT = process.env.PORT || 5000;

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/intelligence', intelligenceRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Disaster Management System API is running' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
        console.log(`🔌 WebSocket ready for real-time updates`);
    });
}

module.exports = { app, io };
