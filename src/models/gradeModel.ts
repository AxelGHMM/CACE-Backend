import pool from "../config/db";

interface Grade {
  id?: number;
  student_id: number;
  professor_id: number;
  subject_id: number;
  partial: number;
  activity_1?: number;
  activity_2?: number;
  attendance?: number;
  project?: number;
  exam?: number;
  is_active?: boolean;
}

// 🔹 Crear registros en la tabla grades cuando se inscribe un estudiante
const createGradesForStudent = async (studentId: number, groupId: number): Promise<void> => {
  try {
    const queryCheck = `
      SELECT COUNT(*) as count FROM grades g
      JOIN assignments a ON g.professor_id = a.user_id AND g.subject_id = a.subject_id
      WHERE g.student_id = $1 AND a.group_id = $2;
    `;

    const checkResult = await pool.query(queryCheck, [studentId, groupId]);
    const existingCount = parseInt(checkResult.rows[0].count);

    if (existingCount >= 3) return;

    const queryInsert = `
      INSERT INTO grades (student_id, professor_id, subject_id, partial, activity_1, activity_2, attendance, project, exam, is_active)
      SELECT $1, a.user_id, a.subject_id, p.partial, 0, 0, 0, 0, 0, true
      FROM assignments a
      CROSS JOIN generate_series(1, 3) AS p(partial)
      WHERE a.group_id = $2
      ON CONFLICT DO NOTHING;
    `;

    await pool.query(queryInsert, [studentId, groupId]);
  } catch (error) {
    console.error(`Error al crear registros en grades para estudiante ${studentId}:`, error);
  }
};

// 🔹 Obtener calificaciones por grupo y materia
const getGradesByGroupAndSubject = async (groupId: number, subjectId: number, partial: number | null): Promise<Grade[]> => {
  const query = `
    SELECT g.id, s.matricula, s.name, g.partial, g.activity_1, g.activity_2, g.attendance, g.project, g.exam
    FROM grades g
    JOIN students s ON g.student_id = s.id
    WHERE s.group_id = $1 AND g.subject_id = $2
    ${partial ? "AND g.partial = $3" : ""}
    AND g.is_active = true
    ORDER BY s.name;
  `;

  const values = partial ? [groupId, subjectId, partial] : [groupId, subjectId];
  const result = await pool.query(query, values);
  return result.rows;
};

// 🔹 Obtener calificaciones de todos los grupos y materias de un profesor
const getGradesByProfessor = async (professorId: number): Promise<Grade[]> => {
  const query = `
    SELECT g.id, s.matricula, s.name, g.partial, g.activity_1, g.activity_2, g.attendance, g.project, g.exam, a.group_id, a.subject_id
    FROM grades g
    JOIN students s ON g.student_id = s.id
    JOIN assignments a ON g.professor_id = a.user_id AND g.subject_id = a.subject_id
    WHERE g.professor_id = $1 AND g.is_active = true
    ORDER BY a.group_id, a.subject_id, s.name, g.partial;
  `;
  const result = await pool.query(query, [professorId]);
  return result.rows;
};

// 🔹 Actualizar una calificación específica
const updateGrade = async (id: number, updatedFields: Partial<Grade>): Promise<Grade | undefined> => {
  const query = `
    UPDATE grades
    SET 
      activity_1 = COALESCE($1, activity_1),
      activity_2 = COALESCE($2, activity_2),
      attendance = COALESCE($3, attendance),
      project = COALESCE($4, project),
      exam = COALESCE($5, exam),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $6 AND is_active = true
    RETURNING *;
  `;
  const values = [updatedFields.activity_1, updatedFields.activity_2, updatedFields.attendance, updatedFields.project, updatedFields.exam, id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export default {
  createGradesForStudent,
  getGradesByGroupAndSubject,
  getGradesByProfessor,
  updateGrade,
};
