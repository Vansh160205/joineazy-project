const db = require("../db");

async function generateStudentId() {
  const q = `
    SELECT student_id FROM users
    WHERE student_id IS NOT NULL AND student_id LIKE 'STU%'
    ORDER BY id DESC LIMIT 1
  `;
  const res = await db.query(q);

  if (res.rows.length === 0) return "STU001";

  const lastId = res.rows[0].student_id;
  const number = parseInt(lastId.replace("STU", "")) + 1;
  return `STU${String(number).padStart(3, "0")}`;
}

async function createUser(name, email, passwordHash, role) {
  let student_id = null;
  if (role === "student") {
    student_id = await generateStudentId();
  }

  const q = `
    INSERT INTO users (name, email, password_hash, role, student_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, role, student_id, created_at
  `;
  const res = await db.query(q, [name, email, passwordHash, role, student_id]);
  return res.rows[0];
}

async function findByEmail(email) {
  const q = "SELECT * FROM users WHERE email=$1";
  const res = await db.query(q, [email]);
  return res.rows[0];
}

// Find user by student_id or email (for invitations)
async function findByStudentIdOrEmail(identifier) {
  const q = `
    SELECT id, name, email, student_id, role 
    FROM users 
    WHERE email = $1 OR student_id = $1
  `;
  const res = await db.query(q, [identifier]);
  return res.rows[0];
}

// Get user by ID
async function findById(userId) {
  const q = "SELECT id, name, email, role, student_id FROM users WHERE id=$1";
  const res = await db.query(q, [userId]);
  return res.rows[0];
}

// ✅ ADD THIS FUNCTION
async function getAllStudents() {
  const q = `
    SELECT id, name, email, student_id 
    FROM users 
    WHERE role = 'student'
    ORDER BY name ASC`;
  const res = await db.query(q);
  return res.rows;
}

module.exports = { 
  createUser, 
  findByEmail, 
  findByStudentIdOrEmail,
  findById,
  getAllStudents  // ✅ EXPORT THIS
};