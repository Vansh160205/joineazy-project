const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  getSubmissionsByGroup,
  getSubmissionByAssignmentAndGroup
} = require("../models/submissionModel");
const { isUserInGroup } = require("../models/groupModel");

const router = express.Router();

// Get submissions for a specific group (student view)
router.get("/group/:group_id", authMiddleware, async (req, res) => {
  try {
    const group_id = parseInt(req.params.group_id);
    
    // Verify user is member of the group
    const isMember = await isUserInGroup(req.user.id, group_id);
    if (!isMember) {
      return res.status(403).json({ 
        error: "You are not a member of this group" 
      });
    }
    
    const submissions = await getSubmissionsByGroup(group_id);
    res.json(submissions);
  } catch (err) {
    console.error("Error fetching group submissions:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Get specific submission status
router.get("/assignment/:assignment_id/group/:group_id", authMiddleware, async (req, res) => {
  try {
    const assignment_id = parseInt(req.params.assignment_id);
    const group_id = parseInt(req.params.group_id);
    
    // Verify user is member of the group
    const isMember = await isUserInGroup(req.user.id, group_id);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: "You are not authorized to view this submission" 
      });
    }
    
    const submission = await getSubmissionByAssignmentAndGroup(assignment_id, group_id);
    
    if (!submission) {
      return res.status(404).json({ 
        message: "No submission found",
        submission: null 
      });
    }
    
    res.json(submission);
  } catch (err) {
    console.error("Error fetching submission:", err);
    res.status(500).json({ error: "Failed to fetch submission" });
  }
});

module.exports = router;