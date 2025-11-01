const db = require("../db");

async function createGroup(name, ownerId) {
  const q = `INSERT INTO groups (name, owner_id)
             VALUES ($1, $2)
             RETURNING id, name, owner_id, created_at`;
  const res = await db.query(q, [name, ownerId]);
  return res.rows[0];
}

async function addMember(groupId, userId, role = "member") {
  const q = `INSERT INTO group_members (group_id, user_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING
             RETURNING *`;
  const res = await db.query(q, [groupId, userId, role]);
  return res.rows[0];
}

async function getGroupsForUser(userId) {
  const q = `
    SELECT 
      g.id, 
      g.name, 
      g.owner_id, 
      g.created_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'student_id', u.student_id,
            'role', gm.role
          ) ORDER BY gm.role DESC, u.name
        ) FILTER (WHERE u.id IS NOT NULL),
        '[]'::json
      ) AS members
    FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    LEFT JOIN users u ON u.id = gm.user_id
    WHERE g.id IN (
      SELECT group_id FROM group_members WHERE user_id = $1
    )
    GROUP BY g.id
    ORDER BY g.created_at DESC`;
  const res = await db.query(q, [userId]);
  return res.rows;
}

// Get group by ID with members
async function getGroupById(groupId) {
  const q = `
    SELECT 
      g.id, 
      g.name, 
      g.owner_id, 
      g.created_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'student_id', u.student_id,
            'role', gm.role
          ) ORDER BY gm.role DESC, u.name
        ) FILTER (WHERE u.id IS NOT NULL),
        '[]'::json
      ) AS members
    FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    LEFT JOIN users u ON u.id = gm.user_id
    WHERE g.id = $1
    GROUP BY g.id`;
  const res = await db.query(q, [groupId]);
  return res.rows[0];
}

// Check if user is member of group
async function isUserInGroup(userId, groupId) {
  const q = `SELECT 1 FROM group_members WHERE user_id = $1 AND group_id = $2`;
  const res = await db.query(q, [userId, groupId]);
  return res.rows.length > 0;
}

// Create group invitation
async function createInvitation(groupId, invitedUserId, invitedByUserId) {
  const q = `
    INSERT INTO group_invitations (group_id, invited_user_id, invited_by_user_id, status)
    VALUES ($1, $2, $3, 'pending')
    RETURNING *`;
  const res = await db.query(q, [groupId, invitedUserId, invitedByUserId]);
  return res.rows[0];
}

// Get pending invitations for a user
async function getPendingInvitationsForUser(userId) {
  const q = `
    SELECT 
      gi.*,
      g.name AS group_name,
      u.name AS invited_by_name
    FROM group_invitations gi
    JOIN groups g ON gi.group_id = g.id
    JOIN users u ON gi.invited_by_user_id = u.id
    WHERE gi.invited_user_id = $1 AND gi.status = 'pending'
    ORDER BY gi.invited_at DESC`;
  const res = await db.query(q, [userId]);
  return res.rows;
}

// Get invitation by ID
async function getInvitationById(invitationId) {
  const q = `SELECT * FROM group_invitations WHERE id = $1`;
  const res = await db.query(q, [invitationId]);
  return res.rows[0];
}

// Update invitation status
async function updateInvitationStatus(invitationId, status) {
  const q = `
    UPDATE group_invitations 
    SET status = $2, responded_at = NOW()
    WHERE id = $1
    RETURNING *`;
  const res = await db.query(q, [invitationId, status]);
  return res.rows[0];
}

// Check if invitation already exists
async function checkExistingInvitation(groupId, userId) {
  const q = `
    SELECT * FROM group_invitations 
    WHERE group_id = $1 AND invited_user_id = $2 AND status = 'pending'`;
  const res = await db.query(q, [groupId, userId]);
  return res.rows[0];
}

module.exports = { 
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
};