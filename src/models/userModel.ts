import pool from "../config/db";

interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: string;
  is_active?: boolean;
}

// Obtener todos los usuarios (sin exponer contraseñas)
const getUsers = async (): Promise<Omit<User, "password">[]> => {
  const query = `SELECT id, name, email, role FROM users WHERE is_active = true;`;
  const result = await pool.query(query);
  return result.rows;
};

// Obtener usuarios por rol (sin exponer contraseñas)
const getUsersByRole = async (role: string): Promise<Omit<User, "password">[]> => {
  const query = `SELECT id, name, email, role FROM users WHERE role = $1 AND is_active = true;`;
  const result = await pool.query(query, [role]);
  return result.rows;
};

// Obtener usuario por ID (sin exponer contraseña)
const getUserById = async (id: number): Promise<Omit<User, "password"> | undefined> => {
  const query = `SELECT id, name, email, role FROM users WHERE id = $1 AND is_active = true;`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Obtener usuario por email (incluye contraseña para validación de login)
const getUserByEmail = async (email: string): Promise<User | undefined> => {
  const query = `SELECT id, name, email, password, role FROM users WHERE email = $1;`;
  const result = await pool.query(query, [email]);
  return result.rows[0];
};

// Crear usuario con validación de duplicados y protección contra inyección SQL
const createUser = async (user: User): Promise<Omit<User, "password">> => {
  const checkQuery = `SELECT id FROM users WHERE email = $1;`;
  const existingUser = await pool.query(checkQuery, [user.email]);

  if (existingUser.rows.length > 0) {
    throw new Error("El correo ya está registrado.");
  }

  const query = `
    INSERT INTO users (name, email, password, role, is_active)
    VALUES ($1, $2, $3, $4, true)
    RETURNING id, name, email, role;
  `;
  const result = await pool.query(query, [user.name, user.email, user.password, user.role]);
  return result.rows[0];
};

// Actualizar usuario con validación segura
const updateUser = async (id: number, user: Partial<User>): Promise<Omit<User, "password"> | undefined> => {
  const query = `
    UPDATE users
    SET 
      name = COALESCE($1, name),
      email = COALESCE($2, email),
      password = COALESCE($3, password),
      role = COALESCE($4, role),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5 AND is_active = true
    RETURNING id, name, email, role;
  `;
  const values = [user.name, user.email, user.password, user.role, id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Eliminación lógica (mantiene registro sin exponer datos sensibles)
const deleteUser = async (id: number): Promise<void> => {
  const query = `UPDATE users SET is_active = false, deleted_at = CURRENT_TIMESTAMP WHERE id = $1;`;
  await pool.query(query, [id]);
};

export default {
  getUsers,
  getUsersByRole,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
};
