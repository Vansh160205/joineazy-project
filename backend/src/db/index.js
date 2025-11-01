const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => console.log("Connected to PostgreSQL ✅"));

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Initialize database tables
async function initDb() {
  const client = await pool.connect();
  try {
    console.log("Initializing database tables...");

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        student_id TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Groups table
    await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        owner_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Group members
    await client.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member',
        PRIMARY KEY (group_id, user_id)
      )
    `);

    // Assignments
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        due_date TIMESTAMP,
        onedrive_link TEXT,
        assigned_to_group_id INTEGER REFERENCES groups(id),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Submissions
    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        confirmed_by_user_id INTEGER REFERENCES users(id),
        confirmed_at TIMESTAMP,
        status TEXT DEFAULT 'pending',
        confirmation_step INTEGER DEFAULT 0,
        first_click_at TIMESTAMP,
        first_click_by_user_id INTEGER REFERENCES users(id),
        UNIQUE (assignment_id, group_id)
      )
    `);

    // Group invitations
    await client.query(`
      CREATE TABLE IF NOT EXISTS group_invitations (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        invited_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        invited_by_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending',
        invited_at TIMESTAMP DEFAULT NOW(),
        responded_at TIMESTAMP,
        UNIQUE (group_id, invited_user_id)
      )
    `);

    // Assignment targets
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignment_targets (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
        target_type TEXT NOT NULL,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("Database tables initialized ✅");
  } catch (err) {
    console.error("Error initializing database:", err);
    throw err;
  } finally {
    client.release();
  }
}

// ✅ Export all necessary methods
module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),  // ✅ ADD THIS
  pool,
  initDb,  // ✅ ADD THIS
};