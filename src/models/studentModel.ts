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
const getAllStudentsGrouped = async (): Promise<Record<string, Omit<Student, "is_active">[]>> => {
  const query = `
    SELECT s.id,
           s.name,
           s.email,
           s.matricula,
           s.group_id,
           g.name AS group_name
    FROM students s
    JOIN groups g ON s.group_id = g.id
    WHERE s.is_active = true
    ORDER BY s.group_id, s.name;
  `;
  const result = await pool.query(query);

  const groupedStudents: Record<string, Omit<Student, "is_active">[]> = {};

  result.rows.forEach((row) => {
    // Usar el nombre real del grupo como clave
    const groupKey = row.group_name; // p. ej. "GRUPO E"

    // Inicializar el arreglo si no existe
    if (!groupedStudents[groupKey]) {
      groupedStudents[groupKey] = [];
    }

    // Agregar el estudiante al arreglo de su grupo
    // (Puedes conservar `group_name` en el objeto o eliminarlo según tu necesidad)
    groupedStudents[groupKey].push(row);
  });

  return groupedStudents;
};


// Obtener estudiantes por grupo con validación de datos
const getStudentsByGroup = async (groupId: number): Promise<Omit<Student, "is_active">[]> => {
  const query = `SELECT id, name, email, matricula, group_id FROM students WHERE group_id = $1 AND is_active = true;`;
  const result = await pool.query(query, [groupId]);
  return result.rows;
};
const updateStudent = async (matricula: string, data: Partial<Student>): Promise<Omit<Student, "is_active"> | undefined> => {
  const { name, email, group_id } = data;
  const query = `
    UPDATE students 
    SET 
      name = COALESCE($2, name),
      email = COALESCE($3, email),
      group_id = COALESCE($4, group_id)
    WHERE matricula = $1 AND is_active = true
    RETURNING id, name, email, matricula, group_id;
  `;
  const result = await pool.query(query, [matricula, name, email, group_id]);
  return result.rows[0];
};

// Método para eliminación lógica de estudiante
const deleteStudent = async (matricula: string): Promise<Omit<Student, "is_active"> | undefined> => {
  const query = `
    UPDATE students 
    SET is_active = false
    WHERE matricula = $1 AND is_active = true
    RETURNING id, name, email, matricula, group_id;
  `;
  const result = await pool.query(query, [matricula]);
  return result.rows[0];
};

export default {
  getStudentByMatricula,
  getStudentsByGroup,
  getAllStudentsGrouped,
  deleteStudent,
  updateStudent,
};
