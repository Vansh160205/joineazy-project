const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  createGroup,
  addMember,
  getGroupsForUser,
  getGroupById,
  isUserInGroup,
  createInvitation,
  getPendingInvitationsForUser,
  getInvitationById,
  updateInvitationStatus,
  checkExistingInvitation
} = require("../models/groupModel");
const { findByStudentIdOrEmail, getAllStudents } = require("../models/userModel"); // ✅ Import getAllStudents

const router = express.Router();

// ✅ IMPORTANT: This route MUST come BEFORE /:id route
// Get all students (for dropdown in invite/add member)
router.get("/available-students", authMiddleware, async (req, res) => {
  try {
    const students = await getAllStudents();
    res.json(students || []);
  } catch (err) {
    console.error("Error fetching students:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: "Failed to fetch students",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get pending invitations for logged-in user
router.get("/invitations/pending", authMiddleware, async (req, res) => {
  try {
    const invitations = await getPendingInvitationsForUser(req.user.id);
    res.json(invitations || []);
  } catch (err) {
    console.error("Error fetching invitations:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: "Failed to fetch invitations",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Create new group
router.post("/", authMiddleware, async (req, res) => {
  const { name } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Group name is required" });
  }

  try {
    const group = await createGroup(name.trim(), req.user.id);
    // Add creator as owner
    await addMember(group.id, req.user.id, "owner");
    
    res.status(201).json({ 
      message: "Group created successfully",
      group 
    });
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Get all groups for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const groups = await getGroupsForUser(req.user.id);
    res.json(groups || []);
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// Invite members to group (by email or student_id)
router.post("/:id/invite", authMiddleware, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { identifier } = req.body;
    
    if (isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }
    
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: "Email or student ID is required" });
    }
    
    // Check if user is owner or member of the group
    const isMember = await isUserInGroup(req.user.id, groupId);
    if (!isMember) {
      return res.status(403).json({ error: "You are not authorized to invite members to this group" });
    }
    
    // Find the user to invite
    const userToInvite = await findByStudentIdOrEmail(identifier.trim());
    if (!userToInvite) {
      return res.status(404).json({ error: "User not found with provided email or student ID" });
    }
    
    if (userToInvite.role !== 'student') {
      return res.status(400).json({ error: "Only students can be added to groups" });
    }
    
    // Check if user is already a member
    const alreadyMember = await isUserInGroup(userToInvite.id, groupId);
    if (alreadyMember) {
      return res.status(400).json({ error: "User is already a member of this group" });
    }
    
    // Check for existing pending invitation
    const existingInvitation = await checkExistingInvitation(groupId, userToInvite.id);
    if (existingInvitation) {
      return res.status(400).json({ error: "Invitation already sent to this user" });
    }
    
    // Create invitation
    const invitation = await createInvitation(groupId, userToInvite.id, req.user.id);
    
    res.status(201).json({ 
      message: "Invitation sent successfully",
      invitation 
    });
  } catch (err) {
    console.error("Error sending invitation:", err);
    res.status(500).json({ error: "Failed to send invitation" });
  }
});

// ✅ NEW: Directly add member (owner only, no invitation needed)
router.post("/:id/add-member", authMiddleware, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { identifier } = req.body;
    
    if (isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }
    
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: "Email or student ID is required" });
    }
    
    // Check if user is OWNER of the group
    const group = await getGroupById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    if (group.owner_id !== req.user.id) {
      return res.status(403).json({ error: "Only group owner can directly add members" });
    }
    
    // Find the user to add
    const userToAdd = await findByStudentIdOrEmail(identifier.trim());
    if (!userToAdd) {
      return res.status(404).json({ error: "User not found with provided email or student ID" });
    }
    
    if (userToAdd.role !== 'student') {
      return res.status(400).json({ error: "Only students can be added to groups" });
    }
    
    // Check if user is already a member
    const alreadyMember = await isUserInGroup(userToAdd.id, groupId);
    if (alreadyMember) {
      return res.status(400).json({ error: "User is already a member of this group" });
    }
    
    // Directly add user to group
    await addMember(groupId, userToAdd.id, 'member');
    
    res.status(201).json({ 
      message: `${userToAdd.name} has been added to the group`,
      user: {
        id: userToAdd.id,
        name: userToAdd.name,
        email: userToAdd.email,
        student_id: userToAdd.student_id
      }
    });
  } catch (err) {
    console.error("Error adding member:", err);
    res.status(500).json({ error: "Failed to add member" });
  }
});

// Accept or reject invitation
router.post("/invitations/:id/respond", authMiddleware, async (req, res) => {
  try {
    const invitationId = parseInt(req.params.id);
    const { action } = req.body;
    
    if (isNaN(invitationId)) {
      return res.status(400).json({ error: "Invalid invitation ID" });
    }
    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: "Action must be 'accept' or 'reject'" });
    }
    
    const invitation = await getInvitationById(invitationId);
    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }
    
    if (invitation.invited_user_id !== req.user.id) {
      return res.status(403).json({ error: "This invitation is not for you" });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: "This invitation has already been responded to" });
    }
    
    const status = action === 'accept' ? 'accepted' : 'rejected';
    await updateInvitationStatus(invitationId, status);
    
    // If accepted, add user to group
    if (action === 'accept') {
      await addMember(invitation.group_id, req.user.id, 'member');
    }
    
    res.json({ 
      message: `Invitation ${action}ed successfully`,
      status 
    });
  } catch (err) {
    console.error("Error responding to invitation:", err);
    res.status(500).json({ error: "Failed to respond to invitation" });
  }
});

// Get specific group details (MUST come after all specific routes)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    
    if (isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }
    
    // Check if user is member of this group
    const isMember = await isUserInGroup(req.user.id, groupId);
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }
    
    const group = await getGroupById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    res.json(group);
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({ error: "Failed to fetch group details" });
  }
});

module.exports = router;