import pool from "../config/db";

interface Assignment {
  id?: number;
  user_id: number;
  group_id: number;
  subject_id: number;
  is_active?: boolean;
}

// 🔹 Obtener asignaciones de un usuario
const getAssignmentsByUserId = async (userId: number): Promise<Assignment[]> => {
  const query = `
    SELECT 
      a.id, 
      a.user_id, 
      a.group_id, 
      g.name AS group_name, 
      a.subject_id, 
      s.name AS subject_name 
    FROM assignments a
    JOIN groups g ON a.group_id = g.id
    JOIN subjects s ON a.subject_id = s.id
    WHERE a.user_id = $1 AND a.is_active = true;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

// 🔹 Obtener una asignación por ID
const getAssignmentById = async (id: number): Promise<Assignment | undefined> => {
  const query = `SELECT * FROM assignments WHERE id = $1 AND is_active = true;`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// 🔹 Crear una nueva asignación
const createAssignment = async (assignment: Assignment): Promise<Assignment> => {
  const query = `
    INSERT INTO assignments (user_id, group_id, subject_id, is_active)
    VALUES ($1, $2, $3, true)
    RETURNING *;
  `;
  const values = [assignment.user_id, assignment.group_id, assignment.subject_id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// 🔹 Actualizar una asignación
const updateAssignment = async (id: number, assignment: Partial<Assignment>): Promise<Assignment | undefined> => {
  const query = `
    UPDATE assignments
    SET user_id = COALESCE($1, user_id),
        group_id = COALESCE($2, group_id),
        subject_id = COALESCE($3, subject_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $4 AND is_active = true
    RETURNING *;
  `;
  const values = [assignment.user_id, assignment.group_id, assignment.subject_id, id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// 🔹 Eliminar una asignación (eliminación lógica)
const deleteAssignment = async (id: number): Promise<void> => {
  const query = `UPDATE assignments SET is_active = false, deleted_at = CURRENT_TIMESTAMP WHERE id = $1;`;
  await pool.query(query, [id]);
};

export default {
  getAssignmentsByUserId,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};
