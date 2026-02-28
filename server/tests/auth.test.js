/**
 * Auth Routes Tests
 */
const request = require('supertest');
const express = require('express');
const { setupTestDb, teardownTestDb, destroyTestDb, getDb, createTestUser } = require('./helpers');

// Build a minimal Express app with auth routes
function buildApp() {
  const app = express();
  app.use(express.json());

  // Mock io
  app.use((req, res, next) => {
    req.io = { to: () => ({ emit: () => {} }) };
    next();
  });

  // Override db module to use test db
  const authRoutes = require('../routes/auth');
  app.use('/api/auth', authRoutes);
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

describe('POST /api/auth/register', () => {
  it('should register a new customer', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Customer',
        phone: '9876500001',
        password: 'password123',
        role: 'customer',
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('New Customer');
    expect(res.body.user.role).toBe('customer');
    expect(res.body.user._id).toBeDefined();
  });

  it('should register a barber with shop info', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Barber',
        phone: '9876500002',
        password: 'password123',
        role: 'barber',
        shopName: 'Test Shop',
        shopAddress: '123 Test St',
        workingHours: { start: '10:00', end: '20:00' },
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('barber');
    expect(res.body.user.shopName).toBe('Test Shop');
  });

  it('should reject duplicate phone', async () => {
    await createTestUser({ phone: '9876500003' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dup',
        phone: '9876500003',
        password: 'password123',
        role: 'customer',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it('should reject short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Short Pass',
        phone: '9876500004',
        password: '123',
        role: 'customer',
      });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const { user } = await createTestUser({ phone: '9876500010', password: 'mypassword' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '9876500010', password: 'mypassword' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.phone).toBe('9876500010');
  });

  it('should reject wrong password', async () => {
    await createTestUser({ phone: '9876500011', password: 'correctpass' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '9876500011', password: 'wrongpass' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('should reject non-existent phone', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '0000000000', password: 'password' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/profile', () => {
  it('should return profile for authenticated user', async () => {
    const { token } = await createTestUser({ phone: '9876500020', name: 'Profile Test' });

    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Profile Test');
  });

  it('should reject without token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/auth/profile', () => {
  it('should update profile', async () => {
    const { token } = await createTestUser({ phone: '9876500030', name: 'Old Name' });

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('New Name');
  });
});
