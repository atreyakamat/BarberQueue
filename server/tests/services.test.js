/**
 * Services Routes Tests
 */
const request = require('supertest');
const express = require('express');
const { setupTestDb, teardownTestDb, destroyTestDb, createTestUser, createTestService } = require('./helpers');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.io = { to: () => ({ emit: () => {} }) };
    next();
  });
  const serviceRoutes = require('../routes/services');
  app.use('/api/services', serviceRoutes);
  return app;
}

let app;

beforeAll(async () => {
  await setupTestDb();
  app = buildApp();
});

afterEach(async () => {
  await teardownTestDb();
});

afterAll(async () => {
  await destroyTestDb();
});

describe('GET /api/services', () => {
  it('should list all active services', async () => {
    const { user: barber } = await createTestUser({ role: 'barber', phone: '9870010001' });
    await createTestService(barber.id, { name: 'Haircut A' });
    await createTestService(barber.id, { name: 'Beard Trim' });

    const res = await request(app).get('/api/services');

    expect(res.status).toBe(200);
    expect(res.body.services.length).toBe(2);
  });

  it('should support search query', async () => {
    const { user: barber } = await createTestUser({ role: 'barber', phone: '9870010002' });
    await createTestService(barber.id, { name: 'Premium Haircut' });
    await createTestService(barber.id, { name: 'Beard Trim' });

    const res = await request(app).get('/api/services?search=haircut');

    expect(res.status).toBe(200);
    expect(res.body.services.length).toBe(1);
    expect(res.body.services[0].name).toBe('Premium Haircut');
  });

  it('should filter by category', async () => {
    const { user: barber } = await createTestUser({ role: 'barber', phone: '9870010003' });
    await createTestService(barber.id, { name: 'Basic Cut', category: 'haircut' });
    await createTestService(barber.id, { name: 'Head Massage', category: 'massage' });

    const res = await request(app).get('/api/services?category=massage');

    expect(res.status).toBe(200);
    expect(res.body.services.length).toBe(1);
    expect(res.body.services[0].name).toBe('Head Massage');
  });
});

describe('GET /api/services/barber/:barberId', () => {
  it('should list services for a specific barber', async () => {
    const { user: barber1 } = await createTestUser({ role: 'barber', phone: '9870020001' });
    const { user: barber2 } = await createTestUser({ role: 'barber', phone: '9870020002' });
    await createTestService(barber1.id, { name: 'Cut A' });
    await createTestService(barber2.id, { name: 'Cut B' });

    const res = await request(app).get(`/api/services/barber/${barber1.id}`);

    expect(res.status).toBe(200);
    expect(res.body.services.length).toBe(1);
    expect(res.body.services[0].name).toBe('Cut A');
  });
});

describe('POST /api/services', () => {
  it('should create a service for a barber', async () => {
    const { token } = await createTestUser({ role: 'barber', phone: '9870030001' });

    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Super Cut',
        description: 'The best haircut',
        price: 250,
        duration: 45,
        category: 'haircut',
      });

    expect(res.status).toBe(201);
    expect(res.body.service.name).toBe('Super Cut');
    expect(res.body.service.price).toBe(250);
    expect(res.body.service.duration).toBe(45);
  });

  it('should reject duplicate service name for same barber', async () => {
    const { user: barber, token } = await createTestUser({ role: 'barber', phone: '9870030002' });
    await createTestService(barber.id, { name: 'haircut special' });

    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Haircut Special',
        price: 200,
        duration: 30,
        category: 'haircut',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('should reject if not a barber', async () => {
    const { token } = await createTestUser({ role: 'customer', phone: '9870030003' });

    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad', price: 100, duration: 10, category: 'haircut' });

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/services/:id', () => {
  it('should update a service', async () => {
    const { user: barber, token } = await createTestUser({ role: 'barber', phone: '9870040001' });
    const svc = await createTestService(barber.id, { name: 'Old Name', price: 100 });

    const res = await request(app)
      .put(`/api/services/${svc.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name', price: 150 });

    expect(res.status).toBe(200);
    expect(res.body.service.name).toBe('New Name');
    expect(res.body.service.price).toBe(150);
  });
});

describe('DELETE /api/services/:id', () => {
  it('should soft-delete a service', async () => {
    const { user: barber, token } = await createTestUser({ role: 'barber', phone: '9870050001' });
    const svc = await createTestService(barber.id, { name: 'To Delete' });

    const res = await request(app)
      .delete(`/api/services/${svc.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Should not appear in listings
    const listRes = await request(app).get(`/api/services/barber/${barber.id}`);
    expect(listRes.body.services.length).toBe(0);
  });
});
