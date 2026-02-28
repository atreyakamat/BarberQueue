/**
 * Test helpers — shared setup / teardown for all backend tests.
 *
 * These tests run against a REAL PostgreSQL "barberqueue_test" database.
 * Before running: CREATE DATABASE barberqueue_test;
 *
 * Alternatively the tests will work with the main db if PG_TEST_DATABASE
 * is not set, but that is discouraged.
 */
const knexLib = require('knex');
const knexConfig = require('../knexfile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Force test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-barberqueue';

let db;

function getDb() {
  if (!db) {
    db = knexLib(knexConfig.test || knexConfig.development);
  }
  return db;
}

async function setupTestDb() {
  const conn = getDb();
  await conn.migrate.latest();
  return conn;
}

async function teardownTestDb() {
  const conn = getDb();
  // Truncate all tables in reverse FK order
  await conn.raw(`
    TRUNCATE TABLE queue_entries, queues, booking_services, bookings, services, users
    CASCADE
  `);
}

async function destroyTestDb() {
  if (db) {
    await db.destroy();
    db = null;
  }
}

// Create a test user and return { user, token }
async function createTestUser(overrides = {}) {
  const conn = getDb();
  const salt = await bcrypt.genSalt(10);
  const password = overrides.password || 'testpass123';
  const hash = await bcrypt.hash(password, salt);

  const defaults = {
    name: 'Test User',
    phone: `98${Date.now().toString().slice(-8)}`, // unique phone
    email: null,
    password: hash,
    role: 'customer',
  };

  const data = { ...defaults, ...overrides, password: hash };
  const [user] = await conn('users').insert(data).returning('*');

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { user, token, plainPassword: password };
}

// Create a test service for a barber
async function createTestService(barberId, overrides = {}) {
  const conn = getDb();
  const defaults = {
    name: `Test Service ${Date.now()}`,
    description: 'A test service',
    price: 100,
    duration: 30,
    category: 'haircut',
    barber_id: barberId,
    is_active: true,
  };
  const [svc] = await conn('services').insert({ ...defaults, ...overrides }).returning('*');
  return svc;
}

module.exports = {
  getDb,
  setupTestDb,
  teardownTestDb,
  destroyTestDb,
  createTestUser,
  createTestService,
};
