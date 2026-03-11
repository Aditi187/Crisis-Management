import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
};

// Alerts API
export const alertsAPI = {
    getAll: (params) => api.get('/alerts', { params }),
    getById: (id) => api.get(`/alerts/${id}`),
    create: (data) => api.post('/alerts', data),
    update: (id, data) => api.put(`/alerts/${id}`, data),
    delete: (id) => api.delete(`/alerts/${id}`),
    getStats: () => api.get('/alerts/stats/summary'),
};

// Incidents API
export const incidentsAPI = {
    getAll: (params) => api.get('/incidents', { params }),
    getById: (id) => api.get(`/incidents/${id}`),
    create: (data) => api.post('/incidents', data),
    update: (id, data) => api.put(`/incidents/${id}`, data),
    delete: (id) => api.delete(`/incidents/${id}`),
};

// Contacts API
export const contactsAPI = {
    getAll: () => api.get('/contacts'),
    getById: (id) => api.get(`/contacts/${id}`),
    create: (data) => api.post('/contacts', data),
    update: (id, data) => api.put(`/contacts/${id}`, data),
    delete: (id) => api.delete(`/contacts/${id}`),
};

// Disasters API
export const disastersAPI = {
    getAll: (params) => api.get('/disasters', { params }),
    getById: (id) => api.get(`/disasters/${id}`),
    create: (data) => api.post('/disasters', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, data) => api.put(`/disasters/${id}`, data),
    delete: (id) => api.delete(`/disasters/${id}`),
    getStats: () => api.get('/disasters/stats/summary'),
};

// Volunteers API
export const volunteersAPI = {
    getAll: (params) => api.get('/volunteers', { params }),
    getById: (id) => api.get(`/volunteers/${id}`),
    create: (data) => api.post('/volunteers', data),
    update: (id, data) => api.put(`/volunteers/${id}`, data),
    delete: (id) => api.delete(`/volunteers/${id}`),
    getStats: () => api.get('/volunteers/stats/summary'),
};

// Donations API
export const donationsAPI = {
    getAll: () => api.get('/donations'),
    getStats: () => api.get('/donations/stats/summary'),
    getConfig: () => api.get('/donations/config'),
    createOrder: (data) => api.post('/donations/create-order', data),
    verify: (data) => api.post('/donations/verify', data),
};

// Intelligence / AI API
export const intelligenceAPI = {
    getProximityAlerts: (lat, lng, radius = 50) =>
        api.get('/intelligence/proximity', { params: { lat, lng, radius } }),
    getWeather: (lat, lng) =>
        api.get('/intelligence/weather', { params: { lat, lng } }),
    getRisk: (lat, lng) =>
        api.get('/intelligence/risk', { params: { lat, lng } }),
    getOfficialFeeds: () => api.get('/intelligence/official-feeds'),
};

export default api;
