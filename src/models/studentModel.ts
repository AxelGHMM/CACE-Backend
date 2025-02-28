import pool from "../config/db";

interface Student {
  id?: number;
  name: string;
  email?: string;
  matricula: string;
  group_id: number;
  is_active?: boolean;
}

// Obtener estudiante por matrícula (sin exponer datos innecesarios)
const getStudentByMatricula = async (matricula: string): Promise<Omit<Student, "is_active"> | undefined> => {
  const query = `SELECT id, name, email, matricula, group_id FROM students WHERE matricula = $1 AND is_active = true;`;
  const result = await pool.query(query, [matricula]);
  return result.rows[0];
};

// Obtener estudiantes por grupo con validación de datos
const getStudentsByGroup = async (groupId: number): Promise<Omit<Student, "is_active">[]> => {
  const query = `SELECT id, name, email, matricula, group_id FROM students WHERE group_id = $1 AND is_active = true;`;
  const result = await pool.query(query, [groupId]);
  return result.rows;
};

export default {
  getStudentByMatricula,
  getStudentsByGroup,
};
