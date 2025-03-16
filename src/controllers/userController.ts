import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel";
import { body, validationResult } from "express-validator";
import logger from "../utils/logger"; // Importar el logger

const failedAttempts: Record<string, { count: number; timestamp: number }> = {};
const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 15 * 60 * 1000; // 15 minutos

const trackFailedLogin = (email: string, ip: string) => {
  const key = `${email}:${ip}`;

  if (!failedAttempts[key]) {
    failedAttempts[key] = { count: 1, timestamp: Date.now() };
  } else {
    failedAttempts[key].count++;
    failedAttempts[key].timestamp = Date.now();
  }

  logger.warn(`Intento fallido de login para ${email} desde ${ip}. Intentos: ${failedAttempts[key].count}`);
};

const isBlocked = (email: string, ip: string): boolean => {
  const key = `${email}:${ip}`;
  if (failedAttempts[key] && failedAttempts[key].count >= MAX_ATTEMPTS) {
    const timeElapsed = Date.now() - failedAttempts[key].timestamp;
    return timeElapsed < BLOCK_TIME;
  }
  return false;
};

// Middleware para validar datos de entrada
export const validateUser = [
  body("email").isEmail().withMessage("Debe ser un email válido"),
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
];

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const ip = (req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "") as string;

    if (!email || !password) {
      logger.warn(`Intento de login con datos incompletos desde ${ip}`);
      res.status(400).json({ error: "Email y contraseña son obligatorios." });
      return;
    }

    if (isBlocked(email, ip)) {
      logger.warn(`Usuario bloqueado: ${email} desde ${ip}`);
      res.status(429).json({ error: "Demasiados intentos. Intente nuevamente en 15 minutos." });
      return;
    }

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      trackFailedLogin(email, ip);
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      trackFailedLogin(email, ip);
      res.status(401).json({ error: "Contraseña incorrecta." });
      return;
    }

    delete failedAttempts[`${email}:${ip}`];

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "1h" }
    );

    logger.info(`Usuario autenticado: ${email} desde ${ip}`);

    res.status(200).json({
      message: "Inicio de sesión exitoso.",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    logger.error(`Error en login: ${error}`);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

// Obtener todos los usuarios
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await userModel.getUsers();
    logger.info("Se obtuvo la lista de usuarios.");
    res.status(200).json(users);
  } catch (error) {
    logger.error(`Error al obtener usuarios: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener usuario por ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID de usuario inválido" });
    return;
  }

  try {
    const user = await userModel.getUserById(id);
    if (!user) {
      logger.warn(`Usuario con ID ${id} no encontrado`);
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    logger.info(`Usuario obtenido: ${id}`);
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Error al obtener usuario ${id}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear usuario
export const createUser = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { name, email, password, role } = req.body;

  try {
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      logger.warn(`Intento de registro con correo existente: ${email}`);
      res.status(400).json({ error: "El correo ya está registrado." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.createUser({ name, email, password: hashedPassword, role });

    logger.info(`Usuario creado: ${email}`);
    res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
  } catch (error) {
    logger.error(`Error al crear usuario: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar usuario
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID de usuario inválido" });
    return;
  }

  const { name, email, password, role } = req.body;

  try {
    let hashedPassword = password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await userModel.updateUser(id, { name, email, password: hashedPassword, role });
    if (!updatedUser) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    logger.info(`Usuario actualizado: ${id}`);
    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error(`Error al actualizar usuario ${id}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar usuario
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID de usuario inválido" });
    return;
  }

  try {
    await userModel.deleteUser(id);
    logger.info(`Usuario eliminado: ${id}`);
    res.status(200).json({ message: "Usuario eliminado lógicamente" });
  } catch (error) {
    logger.error(`Error al eliminar usuario ${id}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
// Obtener usuarios por rol con validación y logging
export const getUsersByRole = async (req: Request, res: Response): Promise<void> => {
  const { role } = req.params;

  if (!role) {
    logger.warn("Intento de consulta de usuarios sin especificar rol");
    res.status(400).json({ error: "El rol es obligatorio" });
    return;
  }

  try {
    const users = await userModel.getUsersByRole(role);

    if (users.length === 0) {
      logger.info(`No se encontraron usuarios con el rol: ${role}`);
      res.status(404).json({ error: "No se encontraron usuarios con ese rol" });
      return;
    }

    logger.info(`Usuarios con rol ${role} obtenidos correctamente`);
    res.status(200).json(users);
  } catch (error) {
    logger.error(`Error al obtener usuarios con rol ${role}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
