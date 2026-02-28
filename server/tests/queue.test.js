/**
 * Queue Routes Tests
 */
const request = require('supertest');
const express = require('express');
const {
  setupTestDb,
  teardownTestDb,
  destroyTestDb,
  getDb,
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
  const queueRoutes = require('../routes/queue');
  app.use('/api/queue', queueRoutes);
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

// Helper: create a walk-in booking + queue entry via the queue join API
async function joinQueue(app, customerToken, barberId, serviceIds) {
  return request(app)
    .post('/api/queue/join')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      barberId,
      services: serviceIds,
    });
}

describe('POST /api/queue/join', () => {
  it('should add customer to a barber queue', async () => {
    const { user: barber } = await createTestUser({
      role: 'barber',
      phone: '9872010001',
      is_available: true,
    });
    const { token: custToken } = await createTestUser({ role: 'customer', phone: '9872010002' });
    const svc = await createTestService(barber.id);

    const res = await joinQueue(app, custToken, barber.id, [svc.id]);

    expect(res.status).toBe(201);
    expect(res.body.queueEntry).toBeDefined();
    expect(res.body.queueEntry.position).toBe(1);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.isWalkIn).toBe(true);
  });

  it('should assign sequential positions', async () => {
    const { user: barber } = await createTestUser({
      role: 'barber',
      phone: '9872010003',
      is_available: true,
    });
    const { token: c1Token } = await createTestUser({ role: 'customer', phone: '9872010004' });
    const { token: c2Token } = await createTestUser({ role: 'customer', phone: '9872010005' });
    const { token: c3Token } = await createTestUser({ role: 'customer', phone: '9872010006' });
    const svc = await createTestService(barber.id);

    const r1 = await joinQueue(app, c1Token, barber.id, [svc.id]);
    const r2 = await joinQueue(app, c2Token, barber.id, [svc.id]);
    const r3 = await joinQueue(app, c3Token, barber.id, [svc.id]);

    expect(r1.body.queueEntry.position).toBe(1);
    expect(r2.body.queueEntry.position).toBe(2);
    expect(r3.body.queueEntry.position).toBe(3);
  });

  it('should reject unauthenticated join', async () => {
    const res = await request(app)
      .post('/api/queue/join')
      .send({ barberId: '550e8400-e29b-41d4-a716-446655440000', services: [] });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/queue/:barberId', () => {
  it('should return the barber queue', async () => {
    const { user: barber } = await createTestUser({
      role: 'barber',
      phone: '9872020001',
      is_available: true,
    });
    const { token: custToken } = await createTestUser({ role: 'customer', phone: '9872020002' });
    const svc = await createTestService(barber.id);

    await joinQueue(app, custToken, barber.id, [svc.id]);

    const res = await request(app).get(`/api/queue/${barber.id}`);

    expect(res.status).toBe(200);
    expect(res.body.queue).toBeDefined();
    expect(res.body.queue.entries.length).toBe(1);
  });
});

describe('GET /api/queue/position/:bookingId', () => {
  it('should return position for a customer booking', async () => {
    const { user: barber } = await createTestUser({
      role: 'barber',
      phone: '9872030001',
      is_available: true,
    });
    const { token: c1Token } = await createTestUser({ role: 'customer', phone: '9872030002' });
    const { token: c2Token } = await createTestUser({ role: 'customer', phone: '9872030003' });
    const svc = await createTestService(barber.id, { duration: 20 });

    await joinQueue(app, c1Token, barber.id, [svc.id]);
    const r2 = await joinQueue(app, c2Token, barber.id, [svc.id]);

    const bookingId = r2.body.booking._id;
    const res = await request(app)
      .get(`/api/queue/position/${bookingId}`)
      .set('Authorization', `Bearer ${c2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.queue.position).toBe(2);
    expect(res.body.queue.estimatedWaitTime).toBeGreaterThanOrEqual(0);
  });
});

describe('DELETE /api/queue/remove/:bookingId', () => {
  it('should remove a customer from the queue', async () => {
    const { user: barber, token: barberToken } = await createTestUser({
      role: 'barber',
      phone: '9872040001',
      is_available: true,
    });
    const { token: custToken } = await createTestUser({ role: 'customer', phone: '9872040002' });
    const svc = await createTestService(barber.id);

    const joinRes = await joinQueue(app, custToken, barber.id, [svc.id]);
    const bookingId = joinRes.body.booking._id;

    const res = await request(app)
      .delete(`/api/queue/remove/${bookingId}`)
      .set('Authorization', `Bearer ${barberToken}`);

    expect(res.status).toBe(200);

    // Queue should be empty
    const qRes = await request(app).get(`/api/queue/${barber.id}`);
    expect(qRes.body.queue.entries.length).toBe(0);
  });
});

describe('POST /api/queue/:queueId/next', () => {
  it('should advance queue to next customer', async () => {
    const { user: barber, token: barberToken } = await createTestUser({
      role: 'barber',
      phone: '9872050001',
      is_available: true,
    });
    const { token: c1Token } = await createTestUser({ role: 'customer', phone: '9872050002' });
    const { token: c2Token } = await createTestUser({ role: 'customer', phone: '9872050003' });
    const svc = await createTestService(barber.id, { duration: 20 });

    await joinQueue(app, c1Token, barber.id, [svc.id]);
    await joinQueue(app, c2Token, barber.id, [svc.id]);

    // Get queue id
    const db = getDb();
    const queue = await db('queues').where({ barber_id: barber.id }).first();

    // Call next  — should start serving first customer
    const res = await request(app)
      .post(`/api/queue/${queue.id}/next`)
      .set('Authorization', `Bearer ${barberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.current).toBeDefined();
    expect(res.body.current.position).toBe(1);
  });
});

describe('Concurrency — parallel queue joins', () => {
  it('should handle concurrent joins without duplicate positions', async () => {
    const { user: barber } = await createTestUser({
      role: 'barber',
      phone: '9872060001',
      is_available: true,
    });
    const svc = await createTestService(barber.id);

    // Create 5 customers
    const customers = await Promise.all(
      [1, 2, 3, 4, 5].map((i) =>
        createTestUser({ role: 'customer', phone: `987206000${i + 1}` })
      )
    );

    // Join concurrently
    const results = await Promise.all(
      customers.map((c) => joinQueue(app, c.token, barber.id, [svc.id]))
    );

    const positions = results.map((r) => r.body.queueEntry?.position).filter(Boolean).sort((a, b) => a - b);

    // All should have succeeded with unique positions 1-5
    expect(positions).toEqual([1, 2, 3, 4, 5]);
  });
});
