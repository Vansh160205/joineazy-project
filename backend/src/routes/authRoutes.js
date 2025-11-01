const express = require("express");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");
const { createUser, findByEmail } = require("../models/userModel");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password, role = "student" } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields: name, email, password" });
  }

  // Validate role
  if (!['student', 'admin'].includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be 'student' or 'admin'" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser(name, email, hashed, role);
    const token = generateToken(user);
    
    // Remove sensitive data
    delete user.password_hash;
    
    res.status(201).json({ 
      message: "User registered successfully",
      user, 
      token 
    });
  } catch (err) {
    console.error("Registration error:", err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Server error during registration" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user);
    delete user.password_hash;
    
    res.json({ 
      message: "Login successful",
      user, 
      token 
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

module.exports = router;