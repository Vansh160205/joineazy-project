const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { 
  getAssignmentsForStudent,
  getAssignmentById 
} = require("../models/assignmentModel");
const { 
  createSubmission,
  firstStepConfirmation,
  finalStepConfirmation,
  getSubmissionByAssignmentAndGroup
} = require("../models/submissionModel");
const { getGroupsForUser } = require("../models/groupModel");

const router = express.Router();

// Get all assignments for logged-in student
router.get("/", authMiddleware, async (req, res) => {
  try {
    // If admin, they should use admin routes
    if (req.user.role === 'admin') {
      return res.status(403).json({ 
        error: "Admins should use /api/admin/assignments endpoint" 
      });
    }
    
    // Get assignments for student
    const assignments = await getAssignmentsForStudent(req.user.id);
    
    // If no assignments, return empty array
    if (!assignments || assignments.length === 0) {
      return res.json([]);
    }
    
    // Get user's groups to attach submission status
    const userGroups = await getGroupsForUser(req.user.id);
    
    // If user has no groups, just return assignments without submission statuses
    if (!userGroups || userGroups.length === 0) {
      return res.json(assignments.map(a => ({
        ...a,
        submission_statuses: []
      })));
    }
    
    // Enhance assignments with submission status for each group
    const enhancedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        try {
          const submissionStatuses = await Promise.all(
            userGroups.map(async (group) => {
              try {
                const submission = await getSubmissionByAssignmentAndGroup(
                  assignment.id,
                  group.id
                );
                return {
                  group_id: group.id,
                  group_name: group.name,
                  submission: submission || null
                };
              } catch (err) {
                console.error(`Error fetching submission for assignment ${assignment.id}, group ${group.id}:`, err);
                return {
                  group_id: group.id,
                  group_name: group.name,
                  submission: null
                };
              }
            })
          );
          
          return {
            ...assignment,
            submission_statuses: submissionStatuses
          };
        } catch (err) {
          console.error(`Error processing assignment ${assignment.id}:`, err);
          return {
            ...assignment,
            submission_statuses: []
          };
        }
      })
    );
    
    res.json(enhancedAssignments);
  } catch (err) {
    console.error("Error fetching assignments:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: "Failed to fetch assignments",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get specific assignment details
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    
    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: "Invalid assignment ID" });
    }
    
    const assignment = await getAssignmentById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    // If student, check if assignment is assigned to them
    if (req.user.role === 'student') {
      const userGroups = await getGroupsForUser(req.user.id);
      const userGroupIds = userGroups.map(g => g.id);
      
      // Check if assignment is assigned to student
      const targets = assignment.targets || [];
      const isAssignedToUser = targets.some(target => 
        target.target_type === 'all' || 
        (target.target_type === 'group' && userGroupIds.includes(target.group_id))
      );
      
      if (!isAssignedToUser) {
        return res.status(403).json({ 
          error: "This assignment is not assigned to you" 
        });
      }
      
      // Add submission status for user's groups
      if (userGroups.length > 0) {
        const submissionStatuses = await Promise.all(
          userGroups.map(async (group) => {
            try {
              const submission = await getSubmissionByAssignmentAndGroup(
                assignment.id,
                group.id
              );
              return {
                group_id: group.id,
                group_name: group.name,
                submission: submission || null
              };
            } catch (err) {
              console.error(`Error fetching submission for group ${group.id}:`, err);
              return {
                group_id: group.id,
                group_name: group.name,
                submission: null
              };
            }
          })
        );
        
        assignment.submission_statuses = submissionStatuses;
      } else {
        assignment.submission_statuses = [];
      }
    }
    
    res.json(assignment);
  } catch (err) {
    console.error("Error fetching assignment:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: "Failed to fetch assignment details",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Step 1: First click confirmation ("I have submitted")
router.post("/:id/confirm-step1", authMiddleware, async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const { group_id } = req.body;
    
    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: "Invalid assignment ID" });
    }
    
    if (!group_id) {
      return res.status(400).json({ error: "Group ID is required" });
    }
    
    // Verify user is member of the group
    const userGroups = await getGroupsForUser(req.user.id);
    const isMember = userGroups.some(g => g.id === group_id);
    
    if (!isMember) {
      return res.status(403).json({ 
        error: "You are not a member of this group" 
      });
    }
    
    // Check if submission exists, if not create it
    let submission = await getSubmissionByAssignmentAndGroup(assignmentId, group_id);
    
    if (!submission) {
      submission = await createSubmission(group_id, assignmentId);
    }
    
    // Check if already at step 1 or 2
    if (submission.confirmation_step >= 1) {
      return res.status(400).json({ 
        error: "First step already completed. Proceed to final confirmation." 
      });
    }
    
    // Update to step 1
    const updated = await firstStepConfirmation(submission.id, req.user.id);
    
    res.json({ 
      message: "First confirmation step completed. Please confirm again to finalize.",
      submission: updated 
    });
  } catch (err) {
    console.error("Error in step 1 confirmation:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: "Failed to process first confirmation step",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Step 2: Final confirmation
router.post("/:id/confirm-step2", authMiddleware, async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const { group_id } = req.body;
    
    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: "Invalid assignment ID" });
    }
    
    if (!group_id) {
      return res.status(400).json({ error: "Group ID is required" });
    }
    
    // Verify user is member of the group
    const userGroups = await getGroupsForUser(req.user.id);
    const isMember = userGroups.some(g => g.id === group_id);
    
    if (!isMember) {
      return res.status(403).json({ 
        error: "You are not a member of this group" 
      });
    }
    
    // Get submission
    const submission = await getSubmissionByAssignmentAndGroup(assignmentId, group_id);
    
    if (!submission) {
      return res.status(400).json({ 
        error: "No submission found. Please complete step 1 first." 
      });
    }
    
    if (submission.confirmation_step !== 1) {
      return res.status(400).json({ 
        error: "Please complete step 1 first before final confirmation" 
      });
    }
    
    if (submission.confirmation_step === 2) {
      return res.status(400).json({ 
        error: "Submission already confirmed" 
      });
    }
    
    // Final confirmation
    const updated = await finalStepConfirmation(submission.id, req.user.id);
    
    res.json({ 
      message: "Submission confirmed successfully! ✅",
      submission: updated 
    });
  } catch (err) {
    console.error("Error in step 2 confirmation:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: "Failed to process final confirmation",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;