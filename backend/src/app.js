require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { initDb } = require("./db");  // ✅ Import initDb

const authRoutes = require("./routes/authRoutes");
const groupRoutes = require("./routes/groupRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const submissionRoutes = require("./routes/submissionRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Initialize database on startup
initDb().catch(err => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/submissions", submissionRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Joineazy API is running" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});