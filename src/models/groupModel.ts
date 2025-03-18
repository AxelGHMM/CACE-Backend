import pool from "../config/db";

interface Group {
  id?: number;
  name: string;
  is_active?: boolean;
}

// Obtener grupo por nombre con validación de datos
const getGroupByName = async (name: string): Promise<Omit<Group, "is_active"> | undefined> => {
  const query = `SELECT id, name FROM groups WHERE name = $1 AND is_active = true;`;
  const result = await pool.query(query, [name]);
  return result.rows[0];
};

// Obtener todos los grupos activos
const getAllGroups = async (): Promise<Omit<Group, "is_active">[]> => {
  const query = `SELECT id, name FROM groups WHERE is_active = true;`;
  const result = await pool.query(query);
  return result.rows;
};

// Crear un nuevo grupo con validación de duplicados
const createGroup = async (name: string): Promise<Omit<Group, "is_active">> => {
  const checkQuery = `SELECT id FROM groups WHERE name = $1;`;
  const existingGroup = await pool.query(checkQuery, [name]);

  if (existingGroup.rows.length > 0) {
    throw new Error("El grupo ya existe.");
  }

  const query = `INSERT INTO groups (name, is_active) VALUES ($1, true) RETURNING id, name;`;
  const result = await pool.query(query, [name]);
  return result.rows[0];
};

// Actualizar el nombre de un grupo (solo si está activo)
const updateGroup = async (id: number, name: string): Promise<Omit<Group, "is_active"> | undefined> => {
  const query = `UPDATE groups SET name = $1 WHERE id = $2 AND is_active = true RETURNING id, name;`;
  const result = await pool.query(query, [name, id]);
  return result.rows[0];
};

// Eliminar lógicamente un grupo (actualizando is_active a false)
const deleteGroup = async (id: number): Promise<boolean> => {
  const query = `UPDATE groups SET is_active = false WHERE id = $1 AND is_active = true;`;
  const result = await pool.query(query, [id]);
  return result.rowCount! > 0;
};

export default {
  getGroupByName,
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
};
