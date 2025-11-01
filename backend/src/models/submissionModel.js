const pool = require("../db");

// Create a new submission (when student initiates submission)
async function createSubmission(group_id, assignment_id) {
  const result = await pool.query(
    `INSERT INTO submissions (group_id, assignment_id, status, confirmation_step)
     VALUES ($1, $2, 'pending', 0)
     ON CONFLICT (assignment_id, group_id)
     DO UPDATE SET status = 'pending', confirmation_step = 0, 
                   confirmed_by_user_id = NULL, confirmed_at = NULL,
                   first_click_at = NULL, first_click_by_user_id = NULL
     RETURNING *`,
    [group_id, assignment_id]
  );
  return result.rows[0];
}

// Two-step submission confirmation
async function firstStepConfirmation(submission_id, user_id) {
  const result = await pool.query(
    `UPDATE submissions
     SET confirmation_step = 1,
         first_click_by_user_id = $2,
         first_click_at = NOW()
     WHERE id = $1 AND confirmation_step = 0
     RETURNING *`,
    [submission_id, user_id]
  );
  return result.rows[0];
}

async function finalStepConfirmation(submission_id, user_id) {
  const result = await pool.query(
    `UPDATE submissions
     SET confirmation_step = 2,
         status = 'confirmed',
         confirmed_by_user_id = $2,
         confirmed_at = NOW()
     WHERE id = $1 AND confirmation_step = 1
     RETURNING *`,
    [submission_id, user_id]
  );
  return result.rows[0];
}

// Get submission by assignment and group
async function getSubmissionByAssignmentAndGroup(assignment_id, group_id) {
  const result = await pool.query(
    `SELECT 
      s.*,
      u1.name AS first_click_by_name,
      u2.name AS confirmed_by_name
     FROM submissions s
     LEFT JOIN users u1 ON s.first_click_by_user_id = u1.id
     LEFT JOIN users u2 ON s.confirmed_by_user_id = u2.id
     WHERE s.assignment_id = $1 AND s.group_id = $2`,
    [assignment_id, group_id]
  );
  return result.rows[0];
}

// Get all submissions for a specific group (for students)
async function getSubmissionsByGroup(group_id) {
  const result = await pool.query(
    `SELECT 
      s.*, 
      a.title AS assignment_title, 
      a.description, 
      a.due_date,
      a.onedrive_link,
      u1.name AS first_click_by_name,
      u2.name AS confirmed_by_name
     FROM submissions s
     JOIN assignments a ON s.assignment_id = a.id
     LEFT JOIN users u1 ON s.first_click_by_user_id = u1.id
     LEFT JOIN users u2 ON s.confirmed_by_user_id = u2.id
     WHERE s.group_id = $1
     ORDER BY a.due_date DESC NULLS LAST`,
    [group_id]
  );
  return result.rows;
}

// Get all submissions (for admin/teacher view)
async function getAllSubmissions() {
  const result = await pool.query(
    `SELECT 
        s.id,
        s.status,
        s.confirmation_step,
        s.confirmed_at,
        s.first_click_at,
        g.name AS group_name,
        a.title AS assignment_title,
        a.due_date,
        u1.name AS first_click_by,
        u2.name AS confirmed_by
     FROM submissions s
     JOIN groups g ON s.group_id = g.id
     JOIN assignments a ON s.assignment_id = a.id
     LEFT JOIN users u1 ON s.first_click_by_user_id = u1.id
     LEFT JOIN users u2 ON s.confirmed_by_user_id = u2.id
     ORDER BY s.id DESC`
  );
  return result.rows;
}

// Get submissions by assignment (for admin to track specific assignment)
async function getSubmissionsByAssignment(assignment_id) {
  const result = await pool.query(
    `SELECT 
        s.*,
        g.name AS group_name,
        g.id AS group_id,
        u1.name AS first_click_by,
        u2.name AS confirmed_by,
        json_agg(
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email
          )
        ) AS group_members
     FROM submissions s
     JOIN groups g ON s.group_id = g.id
     LEFT JOIN users u1 ON s.first_click_by_user_id = u1.id
     LEFT JOIN users u2 ON s.confirmed_by_user_id = u2.id
     LEFT JOIN group_members gm ON gm.group_id = g.id
     LEFT JOIN users u ON u.id = gm.user_id
     WHERE s.assignment_id = $1
     GROUP BY s.id, g.name, g.id, u1.name, u2.name
     ORDER BY s.confirmed_at DESC NULLS LAST`,
    [assignment_id]
  );
  return result.rows;
}

// Count confirmed submissions
async function countConfirmedSubmissions() {
  const result = await pool.query(
    `SELECT COUNT(*) FROM submissions WHERE status = 'confirmed'`
  );
  return parseInt(result.rows[0].count);
}

module.exports = {
  createSubmission,
  firstStepConfirmation,
  finalStepConfirmation,
  getSubmissionByAssignmentAndGroup,
  getSubmissionsByGroup,
  getAllSubmissions,
  getSubmissionsByAssignment,
  countConfirmedSubmissions
};