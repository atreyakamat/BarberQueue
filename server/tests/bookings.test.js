/**
 * Bookings Routes Tests
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
  const bookingRoutes = require('../routes/bookings');
  app.use('/api/bookings', bookingRoutes);
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

// Helper to create a booking via the API
async function createBookingViaApi(customerToken, barberId, serviceIds, scheduledTime) {
  return request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      barberId,
      services: serviceIds,
      scheduledTime: scheduledTime || new Date(Date.now() + 86400000).toISOString(),
      paymentMethod: 'cash',
    });
}

describe('POST /api/bookings', () => {
  it('should create a booking', async () => {
    const { user: barber } = await createTestUser({ role: 'barber', phone: '9871010001' });
    const { token: custToken } = await createTestUser({ role: 'customer', phone: '9871010002' });
    const svc = await createTestService(barber.id, { price: 200, duration: 30 });

    const scheduledTime = new Date(Date.now() + 86400000).toISOString(); // tomorrow
    const res = await createBookingViaApi(custToken, barber.id, [svc.id], scheduledTime);

    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.status).toBe('confirmed');
    expect(res.body.booking.totalAmount).toBe(200);
    expect(res.body.booking.totalDuration).toBe(30);
  });

  it('should reject booking without services', async () => {
    const { user: barber } = await createTestUser({ role: 'barber', phone: '9871010003' });
    const { token: custToken } = await createTestUser({ role: 'customer', phone: '9871010004' });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${custToken}`)
      .send({
        barberId: barber.id,
        services: [],
        scheduledTime: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(400);
  });

  it('should reject unauthenticated booking', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({
        barberId: '00000000-0000-0000-0000-000000000001',
        services: [{ serviceId: '00000000-0000-0000-0000-000000000001' }],
        scheduledTime: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/bookings/my-bookings', () => {
  it('should return bookings for authenticated customer', async () => {
    const { user: barber } = await createTestUser({ role: 'barber', phone: '9871020001' });
    const { token: custToken } = await createTestUser({ role: 'customer', phone: '9871020002' });
    const svc = await createTestService(barber.id);

    await createBookingViaApi(custToken, barber.id, [svc.id]);

    const res = await request(app)
      .get('/api/bookings/my-bookings')
      .set('Authorization', `Bearer ${custToken}`);

    expect(res.status).toBe(200);
    expect(res.body.bookings.length).toBe(1);
  });

  it('should not return other customers bookings', async () => {
    const { user: barber } = await createTestUser({ role: 'barber', phone: '9871020003' });
    const { token: cust1Token } = await createTestUser({ role: 'customer', phone: '9871020004' });
    const { token: cust2Token } = await createTestUser({ role: 'customer', phone: '9871020005' });
    const svc = await createTestService(barber.id);

    await createBookingViaApi(cust1Token, barber.id, [svc.id]);

    const res = await request(app)
      .get('/api/bookings/my-bookings')
      .set('Authorization', `Bearer ${cust2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.bookings.length).toBe(0);
  });
});

describe('PUT /api/bookings/:id/status', () => {
  it('should update booking status (barber confirms)', async () => {
    const { user: barber, token: barberToken } = await createTestUser({
      role: 'barber',
      phone: '9871030001',
    });
    const { token: custToken } = await createTestUser({ role: 'customer', phone: '9871030002' });
    const svc = await createTestService(barber.id);

    const bookRes = await createBookingViaApi(custToken, barber.id, [svc.id]);
    const bookingId = bookRes.body.booking._id;

    const res = await request(app)
      .put(`/api/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${barberToken}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('confirmed');
  });
});

describe('PUT /api/bookings/:id/cancel', () => {
  it('should cancel a pending booking', async () => {
    const { user: barber } = await createTestUser({ role: 'barber', phone: '9871040001' });
    const { token: custToken } = await createTestUser({ role: 'customer', phone: '9871040002' });
    const svc = await createTestService(barber.id);

    const bookRes = await createBookingViaApi(custToken, barber.id, [svc.id]);
    const bookingId = bookRes.body.booking._id;

    const res = await request(app)
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${custToken}`)
      .send({ reason: 'Changed my mind' });

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('cancelled');
  });
});

describe('PUT /api/bookings/:id/review', () => {
  it('should add a review for a completed booking', async () => {
    const { user: barber, token: barberToken } = await createTestUser({
      role: 'barber',
      phone: '9871050001',
    });
    const { token: custToken } = await createTestUser({ role: 'customer', phone: '9871050002' });
    const svc = await createTestService(barber.id);

    // Create and complete the booking
    const bookRes = await createBookingViaApi(custToken, barber.id, [svc.id]);
    const bookingId = bookRes.body.booking._id;

    // Move to completed (barber updates)
    await request(app)
      .put(`/api/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${barberToken}`)
      .send({ status: 'confirmed' });
    await request(app)
      .put(`/api/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${barberToken}`)
      .send({ status: 'completed' });

    // Customer reviews
    const res = await request(app)
      .put(`/api/bookings/${bookingId}/review`)
      .set('Authorization', `Bearer ${custToken}`)
      .send({ rating: 5, review: 'Excellent service!' });

    expect(res.status).toBe(200);
    expect(res.body.booking.rating).toBe(5);
    expect(res.body.booking.review).toBe('Excellent service!');
  });

  it('should reject review on non-completed booking', async () => {
    const { user: barber } = await createTestUser({ role: 'barber', phone: '9871050003' });
    const { token: custToken } = await createTestUser({ role: 'customer', phone: '9871050004' });
    const svc = await createTestService(barber.id);

    const bookRes = await createBookingViaApi(custToken, barber.id, [svc.id]);
    const bookingId = bookRes.body.booking._id;

    const res = await request(app)
      .put(`/api/bookings/${bookingId}/review`)
      .set('Authorization', `Bearer ${custToken}`)
      .send({ rating: 5, review: 'Trying early' });

    expect(res.status).toBe(400);
  });
});

describe('Concurrency — double-booking prevention', () => {
  it('should not allow overlapping time slots', async () => {
    const { user: barber } = await createTestUser({ role: 'barber', phone: '9871060001' });
    const { token: c1Token } = await createTestUser({ role: 'customer', phone: '9871060002' });
    const { token: c2Token } = await createTestUser({ role: 'customer', phone: '9871060003' });
    const svc = await createTestService(barber.id, { duration: 60 }); // 60 min service

    const time = new Date(Date.now() + 86400000); // tomorrow
    time.setHours(14, 0, 0, 0);

    // First booking succeeds
    const res1 = await createBookingViaApi(c1Token, barber.id, [svc.id], time.toISOString());
    expect(res1.status).toBe(201);

    // Second booking at same time should fail
    const res2 = await createBookingViaApi(c2Token, barber.id, [svc.id], time.toISOString());
    expect(res2.status).toBe(409);
    expect(res2.body.message).toMatch(/conflict/i);
  });
});

describe('GET /api/bookings/:id', () => {
  it('should fetch a single booking', async () => {
    const { user: barber } = await createTestUser({ role: 'barber', phone: '9871070001' });
    const { token: custToken } = await createTestUser({ role: 'customer', phone: '9871070002' });
    const svc = await createTestService(barber.id);

    const bookRes = await createBookingViaApi(custToken, barber.id, [svc.id]);
    const bookingId = bookRes.body.booking._id;

    const res = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${custToken}`);

    expect(res.status).toBe(200);
    expect(res.body.booking._id).toBe(bookingId);
  });
});
