const db = require("../db");

// Create assignment with targets (all students or specific groups)
async function createAssignment(title, desc, due, link, creator, targets = []) {
  const client = await db.connect(); // ✅ Now this will work
  
  try {
    await client.query('BEGIN');
    
    // Create the assignment
    const assignmentQuery = `
      INSERT INTO assignments (title, description, due_date, onedrive_link, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`;
    const assignmentRes = await client.query(assignmentQuery, [title, desc, due, link, creator]);
    const assignment = assignmentRes.rows[0];
    
    // Create assignment targets
    if (targets && targets.length > 0) {
      for (const target of targets) {
        const targetQuery = `
          INSERT INTO assignment_targets (assignment_id, target_type, group_id)
          VALUES ($1, $2, $3)`;
        await client.query(targetQuery, [
          assignment.id, 
          target.type, 
          target.type === 'group' ? target.groupId : null
        ]);
      }
    } else {
      // Default to 'all' if no targets specified
      const targetQuery = `
        INSERT INTO assignment_targets (assignment_id, target_type)
        VALUES ($1, 'all')`;
      await client.query(targetQuery, [assignment.id]);
    }
    
    await client.query('COMMIT');
    return assignment;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Get all assignments (admin view)
async function getAllAssignments() {
  const q = `
    SELECT 
      a.id,
      a.title,
      a.description,
      a.due_date,
      a.onedrive_link,
      a.created_by,
      a.created_at,
      u.name AS created_by_name,
      COALESCE(
        json_agg(
          jsonb_build_object(
            'target_type', at.target_type,
            'group_id', at.group_id,
            'group_name', g.name
          )
        ) FILTER (WHERE at.id IS NOT NULL),
        '[]'::json
      ) AS targets
    FROM assignments a
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN assignment_targets at ON at.assignment_id = a.id
    LEFT JOIN groups g ON at.group_id = g.id
    GROUP BY a.id, u.name
    ORDER BY a.due_date DESC NULLS LAST, a.created_at DESC`;
  const res = await db.query(q);
  return res.rows;
}

// Get assignments for a specific student (based on their groups)
async function getAssignmentsForStudent(userId) {
  const q = `
    WITH student_groups AS (
      SELECT group_id 
      FROM group_members 
      WHERE user_id = $1
    ),
    relevant_assignments AS (
      SELECT DISTINCT assignment_id
      FROM assignment_targets at
      WHERE at.target_type = 'all'
         OR (at.target_type = 'group' AND at.group_id IN (SELECT group_id FROM student_groups))
    )
    SELECT 
      a.id,
      a.title,
      a.description,
      a.due_date,
      a.onedrive_link,
      a.created_by,
      a.created_at,
      u.name AS created_by_name,
      (
        SELECT json_agg(
          jsonb_build_object(
            'target_type', at2.target_type,
            'group_id', at2.group_id,
            'group_name', g2.name
          )
        )
        FROM assignment_targets at2
        LEFT JOIN groups g2 ON at2.group_id = g2.id
        WHERE at2.assignment_id = a.id
      ) AS targets
    FROM assignments a
    JOIN relevant_assignments ra ON ra.assignment_id = a.id
    LEFT JOIN users u ON a.created_by = u.id
    ORDER BY a.due_date DESC NULLS LAST, a.created_at DESC`;
  
  const res = await db.query(q, [userId]);
  
  // Handle null targets
  return res.rows.map(row => ({
    ...row,
    targets: row.targets || []
  }));
}

// Get assignment by ID with targets
async function getAssignmentById(assignmentId) {
  const q = `
    SELECT 
      a.id,
      a.title,
      a.description,
      a.due_date,
      a.onedrive_link,
      a.created_by,
      a.created_at,
      u.name AS created_by_name,
      COALESCE(
        json_agg(
          jsonb_build_object(
            'target_type', at.target_type,
            'group_id', at.group_id,
            'group_name', g.name
          )
        ) FILTER (WHERE at.id IS NOT NULL),
        '[]'::json
      ) AS targets
    FROM assignments a
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN assignment_targets at ON at.assignment_id = a.id
    LEFT JOIN groups g ON at.group_id = g.id
    WHERE a.id = $1
    GROUP BY a.id, u.name`;
  const res = await db.query(q, [assignmentId]);
  return res.rows[0];
}

// Update assignment
async function updateAssignment(assignmentId, title, desc, due, link) {
  const q = `
    UPDATE assignments 
    SET title = $2, description = $3, due_date = $4, onedrive_link = $5
    WHERE id = $1
    RETURNING *`;
  const res = await db.query(q, [assignmentId, title, desc, due, link]);
  return res.rows[0];
}

// Delete assignment
async function deleteAssignment(assignmentId) {
  const q = `DELETE FROM assignments WHERE id = $1 RETURNING *`;
  const res = await db.query(q, [assignmentId]);
  return res.rows[0];
}

module.exports = { 
  createAssignment, 
  getAllAssignments,
  getAssignmentsForStudent,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
};