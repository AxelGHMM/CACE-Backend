import pool from "../config/db";

interface Attendance {
  id?: number;
  student_id: number;
  user_id: number;
  subject_id: number;
  date: string;
  time?: string; // Opcional porque la base de datos lo asigna automáticamente
  status: "presente" | "ausente" | "retardo";
}

// 🔹 Registrar múltiples asistencias con `time` automático
const createAttendances = async (attendances: Attendance[]): Promise<Attendance[]> => {
  if (attendances.length === 0) {
    throw new Error("No hay asistencias para registrar");
  }

  const query = `
    INSERT INTO attendances (student_id, user_id, subject_id, date, time, status)
    VALUES ${attendances.map((_ : Attendance, i: number) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, DEFAULT, $${i * 5 + 5})`).join(", ")}
    ON CONFLICT (student_id, subject_id, date, time)
    DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
    RETURNING *;
  `;

  const values = attendances.flatMap((attendance: Attendance) => [
    attendance.student_id,
    attendance.user_id,
    attendance.subject_id,
    attendance.date,
    attendance.status.toLowerCase(),
  ]);

  const result = await pool.query(query, values);
  return result.rows;
};
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
export default {
  createAttendances,
  getAttendanceByGroupAndSubject
};
