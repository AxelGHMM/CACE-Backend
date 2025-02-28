import pool from "../config/db";

interface Subject {
  id?: number;
  name: string;
  is_active?: boolean;
}

// Obtener materia por ID con validación de datos
const getSubjectById = async (id: number): Promise<Omit<Subject, "is_active"> | undefined> => {
  const query = `SELECT id, name FROM subjects WHERE id = $1 AND is_active = true;`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Obtener materia por nombre (sin exponer datos innecesarios)
const getSubjectByName = async (name: string): Promise<Omit<Subject, "is_active"> | undefined> => {
  const query = `SELECT id, name FROM subjects WHERE name = $1 AND is_active = true;`;
  const result = await pool.query(query, [name]);
  return result.rows[0];
};

// Obtener todas las materias activas
const getAllSubjects = async (): Promise<Omit<Subject, "is_active">[]> => {
  const query = `SELECT id, name FROM subjects WHERE is_active = true;`;
  const result = await pool.query(query);
  return result.rows;
};

// Crear una nueva materia con validación de duplicados
const createSubject = async (subject: Subject): Promise<Omit<Subject, "is_active">> => {
  const checkQuery = `SELECT id FROM subjects WHERE name = $1;`;
  const existingSubject = await pool.query(checkQuery, [subject.name]);

  if (existingSubject.rows.length > 0) {
    throw new Error("La materia ya existe.");
  }

  const query = `INSERT INTO subjects (name, is_active) VALUES ($1, true) RETURNING id, name;`;
  const result = await pool.query(query, [subject.name]);
  return result.rows[0];
};

// Actualizar materia con validación de existencia
const updateSubject = async (id: number, name: string): Promise<Omit<Subject, "is_active"> | undefined> => {
  const query = `
    UPDATE subjects
    SET name = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND is_active = true
    RETURNING id, name;
  `;
  const result = await pool.query(query, [name, id]);
  return result.rows[0];
};

// Eliminación lógica de materia
const deleteSubject = async (id: number): Promise<void> => {
  const query = `UPDATE subjects SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1;`;
  await pool.query(query, [id]);
};

export default {
  getSubjectById,
  getSubjectByName,
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
};
