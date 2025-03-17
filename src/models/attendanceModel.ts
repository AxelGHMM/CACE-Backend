import pool from "../config/db";

interface Attendance {
  id?: number;
  student_id: number;
  user_id: number;
  subject_id: number;
  date: string;
  time?: string;
  status: "presente" | "ausente" | "retardo";
}

// 🔹 Registrar múltiples asistencias asegurando `is_active = true`
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

// 🔹 Obtener asistencias por estudiante
const getAttendanceByStudent = async (studentId: number) => {
  const query = `
    SELECT a.id, a.student_id, a.subject_id, a.date, a.time, a.status, 
           s.name AS student_name, sub.name AS subject_name
    FROM attendances a
    JOIN students s ON a.student_id = s.id
    JOIN subjects sub ON a.subject_id = sub.id
    WHERE a.student_id = $1 AND a.is_active = true AND a.deleted_at IS NULL
    ORDER BY a.date DESC, a.time ASC;
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows;
};

// 🔹 Obtener asistencias por fecha y materia
const getAttendanceByDateAndSubject = async (date: string, subjectId: number) => {
  const query = `
    SELECT a.id, a.student_id, a.subject_id, a.date, a.time, a.status, s.name AS student_name
    FROM attendances a
    JOIN students s ON a.student_id = s.id
    WHERE a.date = $1 AND a.subject_id = $2 AND a.is_active = true AND a.deleted_at IS NULL
    ORDER BY a.time ASC;
  `;

  const result = await pool.query(query, [date, subjectId]);
  return result.rows;
};

// 🔹 Obtener asistencias por fecha y separarlas por hora
const getAttendanceByDate = async (date: string) => {
  const query = `
    SELECT a.id, a.student_id, a.subject_id, a.date, a.time, a.status, 
           s.name AS student_name, sub.name AS subject_name
    FROM attendances a
    JOIN students s ON a.student_id = s.id
    JOIN subjects sub ON a.subject_id = sub.id
    WHERE a.date = $1 AND a.is_active = true AND a.deleted_at IS NULL
    ORDER BY a.time ASC;
  `;

  const result = await pool.query(query, [date]);

  // 🔹 Agrupar por hora
  const groupedByTime = result.rows.reduce((acc, attendance) => {
    const time = attendance.time;
    if (!acc[time]) {
      acc[time] = [];
    }
    acc[time].push(attendance);
    return acc;
  }, {});

  return groupedByTime;
};
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
  getAttendanceByGroupAndSubject,
  getAttendanceByStudent,
  getAttendanceByDateAndSubject,
  getAttendanceByDate
};
