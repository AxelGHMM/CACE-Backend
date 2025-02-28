import pool from "../config/db";

interface Attendance {
  id?: number;
  student_id: number;
  user_id: number;
  subject_id: number;
  date: string;
  status: "presente" | "ausente" | "retardo";
}

// 🔹 Obtener lista de alumnos por grupo y materia
const getAttendanceByGroupAndSubject = async (groupId: number, subjectId: number) => {
  const query = `
    SELECT s.id AS student_id, s.matricula, s.name
    FROM students s
    WHERE s.group_id = $1;
  `;
  const result = await pool.query(query, [groupId]);
  return result.rows.map((student) => ({
    ...student,
    status: "presente", // Todos inician como presentes por defecto
  }));
};

// 🔹 Registrar múltiples asistencias en una sola consulta
const createAttendances = async (attendances: Attendance[]) => {
  if (attendances.length === 0) {
    throw new Error("No hay asistencias para registrar");
  }

  const query = `
    INSERT INTO attendances (student_id, user_id, subject_id, date, status)
    VALUES ${attendances.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(", ")}
    ON CONFLICT (student_id, subject_id, date)
    DO UPDATE SET status = EXCLUDED.status
    RETURNING *;
  `;

  const values = attendances.flatMap(attendance => [
    attendance.student_id,
    attendance.user_id,
    attendance.subject_id,
    attendance.date,
    attendance.status.toLowerCase(),
  ]);

  const result = await pool.query(query, values);
  return result.rows;
};

export default {
  getAttendanceByGroupAndSubject,
  createAttendances,
};
