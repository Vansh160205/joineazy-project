const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/auth");
const { 
  createAssignment, 
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
} = require("../models/assignmentModel");
const { 
  getAllSubmissions,
  getSubmissionsByAssignment,
  countConfirmedSubmissions
} = require("../models/submissionModel");
const db = require("../db");

const router = express.Router();

// Create assignment with targets
router.post("/assignments", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const { title, description, due_date, onedrive_link, targets } = req.body;
    
    if (!title || !onedrive_link) {
      return res.status(400).json({ error: "Title and OneDrive link are required" });
    }
    
    // Validate targets format: [{ type: 'all' } or { type: 'group', groupId: 1 }]
    let validatedTargets = [];
    if (targets && Array.isArray(targets) && targets.length > 0) {
      validatedTargets = targets;
    } else {
      // Default to 'all' if no targets specified
      validatedTargets = [{ type: 'all' }];
    }
    
    const assignment = await createAssignment(
      title, 
      description, 
      due_date, 
      onedrive_link, 
      req.user.id,
      validatedTargets
    );
    
    res.status(201).json({ 
      message: "Assignment created successfully",
      assignment 
    });
  } catch (err) {
    console.error("Error creating assignment:", err);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// Get all assignments (admin view)
router.get("/assignments", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const assignments = await getAllAssignments();
    res.json(assignments);
  } catch (err) {
    console.error("Error fetching assignments:", err);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// Get specific assignment with submission details
router.get("/assignments/:id", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const assignment = await getAssignmentById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    const submissions = await getSubmissionsByAssignment(assignmentId);
    
    res.json({
      assignment,
      submissions
    });
  } catch (err) {
    console.error("Error fetching assignment details:", err);
    res.status(500).json({ error: "Failed to fetch assignment details" });
  }
});

// Update assignment
router.put("/assignments/:id", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const { title, description, due_date, onedrive_link } = req.body;
    
    if (!title || !onedrive_link) {
      return res.status(400).json({ error: "Title and OneDrive link are required" });
    }
    
    const assignment = await updateAssignment(
      assignmentId,
      title,
      description,
      due_date,
      onedrive_link
    );
    
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    res.json({ 
      message: "Assignment updated successfully",
      assignment 
    });
  } catch (err) {
    console.error("Error updating assignment:", err);
    res.status(500).json({ error: "Failed to update assignment" });
  }
});

// Delete assignment
router.delete("/assignments/:id", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const assignment = await deleteAssignment(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    res.json({ 
      message: "Assignment deleted successfully",
      assignment 
    });
  } catch (err) {
    console.error("Error deleting assignment:", err);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

// Get all submissions (for tracking)
router.get("/submissions", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const submissions = await getAllSubmissions();
    res.json(submissions);
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Analytics dashboard
router.get("/analytics", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const totalAssignments = (await db.query("SELECT COUNT(*) FROM assignments")).rows[0].count;
    const totalGroups = (await db.query("SELECT COUNT(*) FROM groups")).rows[0].count;
    const totalStudents = (await db.query("SELECT COUNT(*) FROM users WHERE role = 'student'")).rows[0].count;
    const totalConfirmed = await countConfirmedSubmissions();
    const totalSubmissions = (await db.query("SELECT COUNT(*) FROM submissions")).rows[0].count;
    
    // Group-wise completion rate
    const groupStats = await db.query(`
      SELECT 
        g.id,
        g.name,
        COUNT(DISTINCT s.assignment_id) FILTER (WHERE s.status = 'confirmed') as completed_assignments,
        COUNT(DISTINCT s.assignment_id) as total_assigned
      FROM groups g
      LEFT JOIN submissions s ON s.group_id = g.id
      GROUP BY g.id, g.name
      ORDER BY completed_assignments DESC
    `);
    
    // Assignment-wise completion
    const assignmentStats = await db.query(`
      SELECT 
        a.id,
        a.title,
        a.due_date,
        COUNT(s.id) FILTER (WHERE s.status = 'confirmed') as confirmed_count,
        COUNT(s.id) as total_submissions
      FROM assignments a
      LEFT JOIN submissions s ON s.assignment_id = a.id
      GROUP BY a.id, a.title, a.due_date
      ORDER BY a.due_date DESC NULLS LAST
    `);
    
    // Recent activity
    const recentSubmissions = await db.query(`
      SELECT 
        s.confirmed_at,
        g.name as group_name,
        a.title as assignment_title,
        u.name as confirmed_by
      FROM submissions s
      JOIN groups g ON s.group_id = g.id
      JOIN assignments a ON s.assignment_id = a.id
      LEFT JOIN users u ON s.confirmed_by_user_id = u.id
      WHERE s.status = 'confirmed'
      ORDER BY s.confirmed_at DESC
      LIMIT 10
    `);
    
    res.json({
      summary: {
        totalAssignments: parseInt(totalAssignments),
        totalGroups: parseInt(totalGroups),
        totalStudents: parseInt(totalStudents),
        totalSubmissions: parseInt(totalSubmissions),
        totalConfirmedSubmissions: totalConfirmed,
        completionRate: totalSubmissions > 0 
          ? ((totalConfirmed / totalSubmissions) * 100).toFixed(2) 
          : 0
      },
      groupPerformance: groupStats.rows,
      assignmentCompletion: assignmentStats.rows,
      recentActivity: recentSubmissions.rows
    });
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

module.exports = router;