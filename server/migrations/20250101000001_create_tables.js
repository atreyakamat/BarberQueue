/**
 * Migration: Create all tables for BarberQueue
 * PostgreSQL migration replacing MongoDB/Mongoose schemas
 */
exports.up = async function (knex) {
  // ── 1. Users table ──────────────────────────────────────────────
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 100).notNullable();
    t.string('phone', 20).notNullable().unique();
    t.string('email', 255).unique(); // sparse → nullable unique
    t.string('password', 255).notNullable();
    t.enu('role', ['customer', 'barber', 'admin']).notNullable().defaultTo('customer');

    // Barber-specific fields
    t.string('shop_name', 200);
    t.text('shop_address');
    t.string('working_hours_start', 5).defaultTo('09:00');
    t.string('working_hours_end', 5).defaultTo('21:00');
    t.boolean('is_available').defaultTo(true);
    t.string('avatar', 500);

    // Rating (computed, denormalized for perf)
    t.decimal('rating', 3, 2).defaultTo(0);
    t.integer('total_ratings').defaultTo(0);

    t.boolean('is_active').defaultTo(true);

    // Optimistic-lock version for concurrent rating updates
    t.integer('version').defaultTo(1);

    t.timestamps(true, true); // created_at, updated_at
  });

  // Indexes
  await knex.schema.raw(`
    CREATE INDEX idx_users_role_active ON users (role, is_active);
    CREATE INDEX idx_users_phone ON users (phone);
    CREATE INDEX idx_users_rating ON users (rating DESC) WHERE role = 'barber';
  `);

  // ── 2. Services table ───────────────────────────────────────────
  await knex.schema.createTable('services', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 200).notNullable();
    t.text('description');
    t.decimal('price', 10, 2).notNullable();
    t.integer('duration').notNullable(); // minutes
    t.enu('category', [
      'haircut', 'beard', 'massage', 'color', 'cleanup', 'wash', 'styling',
    ]).notNullable();
    t.boolean('is_active').defaultTo(true);
    t.uuid('barber_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    t.string('image', 500);
    t.integer('popularity').defaultTo(0);

    t.timestamps(true, true);
  });

  await knex.schema.raw(`
    CREATE INDEX idx_services_barber ON services (barber_id, is_active);
    CREATE INDEX idx_services_category ON services (category);
    CREATE INDEX idx_services_popularity ON services (popularity DESC);
  `);

  // ── 3. Bookings table ──────────────────────────────────────────
  await knex.schema.createTable('bookings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('customer_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    t.uuid('barber_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE');

    t.timestamp('scheduled_time').notNullable();

    t.enu('status', [
      'pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show',
    ]).notNullable().defaultTo('pending');

    t.decimal('total_amount', 10, 2).defaultTo(0);
    t.integer('total_duration').defaultTo(0); // minutes

    t.enu('payment_status', ['pending', 'paid', 'refunded']).defaultTo('pending');
    t.enu('payment_method', ['cash', 'upi', 'card', 'wallet']).defaultTo('cash');

    t.text('notes');
    t.integer('queue_position');
    t.integer('estimated_wait_time'); // minutes

    t.timestamp('actual_start_time');
    t.timestamp('actual_end_time');

    t.integer('rating').checkBetween([1, 5]);
    t.text('review');

    t.boolean('is_walk_in').defaultTo(false);

    // Row-level version for optimistic locking
    t.integer('version').defaultTo(1);

    t.timestamps(true, true);
  });

  await knex.schema.raw(`
    CREATE INDEX idx_bookings_customer ON bookings (customer_id, created_at DESC);
    CREATE INDEX idx_bookings_barber_scheduled ON bookings (barber_id, scheduled_time);
    CREATE INDEX idx_bookings_status ON bookings (status);
    CREATE INDEX idx_bookings_scheduled ON bookings (scheduled_time);
  `);

  // ── 4. Booking–Services join table ──────────────────────────────
  await knex.schema.createTable('booking_services', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('booking_id').notNullable()
      .references('id').inTable('bookings').onDelete('CASCADE');
    t.uuid('service_id').notNullable()
      .references('id').inTable('services').onDelete('CASCADE');
    t.decimal('price', 10, 2).notNullable();
  });

  await knex.schema.raw(`
    CREATE INDEX idx_bs_booking ON booking_services (booking_id);
    CREATE INDEX idx_bs_service ON booking_services (service_id);
  `);

  // ── 5. Queues table (one row per barber) ────────────────────────
  await knex.schema.createTable('queues', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('barber_id').notNullable().unique()
      .references('id').inTable('users').onDelete('CASCADE');
    t.uuid('currently_serving')
      .references('id').inTable('bookings').onDelete('SET NULL');
    t.integer('average_service_time').defaultTo(30); // minutes
    t.integer('total_served_today').defaultTo(0);
    t.date('last_reset_date').defaultTo(knex.fn.now());
    t.boolean('is_active').defaultTo(true);

    t.timestamps(true, true);
  });

  // ── 6. Queue entries table (replaces embedded sub-docs) ─────────
  await knex.schema.createTable('queue_entries', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('queue_id').notNullable()
      .references('id').inTable('queues').onDelete('CASCADE');
    t.uuid('booking_id').notNullable()
      .references('id').inTable('bookings').onDelete('CASCADE');
    t.integer('position').notNullable();
    t.enu('status', [
      'waiting', 'notified', 'in-progress', 'completed', 'no-show',
    ]).notNullable().defaultTo('waiting');
    t.timestamp('estimated_time');
    t.timestamp('joined_at').defaultTo(knex.fn.now());
    t.timestamp('notified_at');
    t.timestamp('started_at');
    t.timestamp('completed_at');

    t.timestamps(true, true);
  });

  await knex.schema.raw(`
    CREATE INDEX idx_qe_queue ON queue_entries (queue_id, position);
    CREATE INDEX idx_qe_status ON queue_entries (status);
    CREATE INDEX idx_qe_booking ON queue_entries (booking_id);
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('queue_entries');
  await knex.schema.dropTableIfExists('queues');
  await knex.schema.dropTableIfExists('booking_services');
  await knex.schema.dropTableIfExists('bookings');
  await knex.schema.dropTableIfExists('services');
  await knex.schema.dropTableIfExists('users');
};
