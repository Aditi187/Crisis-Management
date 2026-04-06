const request = require('supertest');
const { app } = require('../server');

describe('White Box Testing: Server Endpoints', () => {
    it('Should return 200 OK for the Health Check endpoint', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'OK');
    });

    it('Should return 404 for an unknown endpoint', async () => {
        const res = await request(app).get('/api/unknown-route');
        expect(res.statusCode).toEqual(404);
    });
});
