const request = require("supertest");
const app = require("../src/app"); // You may need to export app in app.js
const db = require("../src/db");

// 🔹 Before we can use app directly, make sure app.js exports it
// module.exports = app;

let studentToken;
let adminToken;
let groupId;
let assignmentId;

describe("Joineazy Backend API Tests", () => {
  beforeAll(async () => {
    // Clean DB before tests (careful with production!)
    await db.query("DELETE FROM submissions");
    await db.query("DELETE FROM assignments");
    await db.query("DELETE FROM group_members");
    await db.query("DELETE FROM groups");
    await db.query("DELETE FROM users");
  });

  afterAll(async () => {
    await db.pool.end();
  });

  // ===============================
  // 1️⃣ AUTH ROUTES
  // ===============================
  test("Register a student", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Student",
        email: "student@example.com",
        password: "123456",
        role: "student",
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe("student@example.com");
    expect(res.body.user.student_id).toMatch(/^STU\d{3}$/);
    studentToken = res.body.token;
  });

  test("Register an admin", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Professor",
        email: "admin@example.com",
        password: "admin123",
        role: "admin",
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe("admin");
    adminToken = res.body.token;
  });

  test("Login existing student", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "student@example.com",
        password: "123456",
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe("student@example.com");
  });

  // ===============================
  // 2️⃣ GROUP ROUTES
  // ===============================
  test("Student creates a group", async () => {
    const res = await request(app)
      .post("/api/groups")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        name: "AI Project Group",
        memberEmails: [],
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("AI Project Group");
    groupId = res.body.id;
  });

  test("Get groups for student", async () => {
    const res = await request(app)
      .get("/api/groups")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe("AI Project Group");
  });

  // ===============================
  // 3️⃣ ADMIN ROUTES (ASSIGNMENTS)
  // ===============================
  test("Admin creates assignment", async () => {
    const res = await request(app)
      .post("/api/admin/assignments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "AI Research Paper",
        description: "Write about Generative AI",
        due_date: "2025-12-31",
        onedrive_link: "https://onedrive.com/sample",
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("AI Research Paper");
    assignmentId = res.body.id;
  });

  test("Admin views analytics", async () => {
    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("totalAssignments");
    expect(res.body).toHaveProperty("totalGroups");
  });

  // ===============================
  // 4️⃣ STUDENT CONFIRM SUBMISSION
  // ===============================
  test("Student confirms submission", async () => {
    const res = await request(app)
      .post(`/api/assignments/${assignmentId}/confirm-submission`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ groupId });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("confirmed");
  });

  // ===============================
  // 5️⃣ FETCH ALL ASSIGNMENTS
  // ===============================
  test("Student gets all assignments", async () => {
    const res = await request(app)
      .get("/api/assignments")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe("AI Research Paper");
  });
});
