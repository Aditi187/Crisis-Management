import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
            });

            this.socket.on('connect', () => {
                console.log('✅ Connected to WebSocket server');
            });

            this.socket.on('disconnect', () => {
                console.log('❌ Disconnected from WebSocket server');
            });

            this.socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
            });
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Alert events
    onAlertCreated(callback) {
        if (this.socket) {
            this.socket.on('alert:created', callback);
        }
    }

    onAlertUpdated(callback) {
        if (this.socket) {
            this.socket.on('alert:updated', callback);
        }
    }

    onAlertDeleted(callback) {
        if (this.socket) {
            this.socket.on('alert:deleted', callback);
        }
    }

    // Incident events
    onIncidentCreated(callback) {
        if (this.socket) {
            this.socket.on('incident:created', callback);
        }
    }

    onIncidentUpdated(callback) {
        if (this.socket) {
            this.socket.on('incident:updated', callback);
        }
    }

    onIncidentDeleted(callback) {
        if (this.socket) {
            this.socket.on('incident:deleted', callback);
        }
    }

    // Disaster events
    onDisasterCreated(callback) {
        if (this.socket) this.socket.on('disaster:created', callback);
    }

    onDisasterUpdated(callback) {
        if (this.socket) this.socket.on('disaster:updated', callback);
    }

    onDisasterDeleted(callback) {
        if (this.socket) this.socket.on('disaster:deleted', callback);
    }

    onDonationReceived(callback) {
        if (this.socket) this.socket.on('donation:received', callback);
    }

    // Remove listeners
    offAlertEvents() {
        if (this.socket) {
            this.socket.off('alert:created');
            this.socket.off('alert:updated');
            this.socket.off('alert:deleted');
        }
    }

    offIncidentEvents() {
        if (this.socket) {
            this.socket.off('incident:created');
            this.socket.off('incident:updated');
            this.socket.off('incident:deleted');
        }
    }

    offDisasterEvents() {
        if (this.socket) {
            this.socket.off('disaster:created');
            this.socket.off('disaster:updated');
            this.socket.off('disaster:deleted');
        }
    }
}

const socketService = new SocketService();
export default socketService;
