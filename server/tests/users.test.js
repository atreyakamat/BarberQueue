/**
 * Users Routes Tests
 */
const request = require('supertest');
const express = require('express');
const {
  setupTestDb,
  teardownTestDb,
  destroyTestDb,
  createTestUser,
  createTestService,
} = require('./helpers');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.io = { to: () => ({ emit: () => {} }) };
    next();
  });
  const userRoutes = require('../routes/users');
  app.use('/api/users', userRoutes);
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

describe('GET /api/users/barbers', () => {
  it('should list active, available barbers', async () => {
    await createTestUser({
      role: 'barber',
      phone: '9873010001',
      name: 'Available Barber',
      is_available: true,
      is_active: true,
      shop_name: 'Good Shop',
    });
    await createTestUser({
      role: 'barber',
      phone: '9873010002',
      name: 'Unavailable Barber',
      is_available: false,
      is_active: true,
    });
    await createTestUser({ role: 'customer', phone: '9873010003' });

    const res = await request(app).get('/api/users/barbers');

    expect(res.status).toBe(200);
    expect(res.body.barbers.length).toBe(1);
    expect(res.body.barbers[0].name).toBe('Available Barber');
  });

  it('should support search', async () => {
    await createTestUser({
      role: 'barber',
      phone: '9873010004',
      name: 'Rajesh Barber',
      is_available: true,
      is_active: true,
      shop_name: 'Raj Cuts',
    });
    await createTestUser({
      role: 'barber',
      phone: '9873010005',
      name: 'Vikram Salon',
      is_available: true,
      is_active: true,
      shop_name: 'Vikram Salon',
    });

    const res = await request(app).get('/api/users/barbers?search=rajesh');

    expect(res.status).toBe(200);
    expect(res.body.barbers.length).toBe(1);
    expect(res.body.barbers[0].name).toBe('Rajesh Barber');
  });
});

describe('GET /api/users/barber/:id', () => {
  it('should return barber details with services', async () => {
    const { user: barber } = await createTestUser({
      role: 'barber',
      phone: '9873020001',
      name: 'Detail Barber',
      is_available: true,
      is_active: true,
      shop_name: 'Detail Shop',
    });
    await createTestService(barber.id, { name: 'Premium Cut', price: 300 });
    await createTestService(barber.id, { name: 'Shave', price: 100 });

    const res = await request(app).get(`/api/users/barber/${barber.id}`);

    expect(res.status).toBe(200);
    expect(res.body.barber.name).toBe('Detail Barber');
    expect(res.body.services.length).toBe(2);
  });

  it('should 404 for non-existent barber', async () => {
    const res = await request(app).get(
      '/api/users/barber/00000000-0000-0000-0000-000000000099'
    );
    expect(res.status).toBe(404);
  });
});

describe('GET /api/users/search', () => {
  it('should search barbers by name, shop, or address', async () => {
    await createTestUser({
      role: 'barber',
      phone: '9873030001',
      name: 'Mumbai Barber',
      is_available: true,
      is_active: true,
      shop_name: 'Mumbai Cuts',
      shop_address: 'Andheri West',
    });

    const res = await request(app).get('/api/users/search?q=andheri');

    expect(res.status).toBe(200);
    expect(res.body.barbers.length).toBe(1);
  });
});

describe('GET /api/users/dashboard', () => {
  it('should return customer dashboard data', async () => {
    const { token } = await createTestUser({ role: 'customer', phone: '9873040001' });

    const res = await request(app)
      .get('/api/users/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
  });

  it('should return barber dashboard data', async () => {
    const { token } = await createTestUser({
      role: 'barber',
      phone: '9873040002',
      is_available: true,
      is_active: true,
    });

    const res = await request(app)
      .get('/api/users/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
  });

  it('should reject unauthenticated dashboard', async () => {
    const res = await request(app).get('/api/users/dashboard');
    expect(res.status).toBe(401);
  });
});
