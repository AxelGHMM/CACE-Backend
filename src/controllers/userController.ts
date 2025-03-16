import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel";
import { body, validationResult } from "express-validator";
import logger from "../utils/logger.js"; // 🔹 Importar Winston

const failedAttempts: Record<string, { count: number; timestamp: number }> = {};
const MAX_ATTEMPTS = 5; // Intentos fallidos permitidos
const BLOCK_TIME = 15 * 60 * 1000; // 15 minutos

const trackFailedLogin = (email: string, ip: string) => {
  const key = `${email}:${ip}`;

  if (!failedAttempts[key]) {
    failedAttempts[key] = { count: 1, timestamp: Date.now() };
  } else {
    failedAttempts[key].count++;
    failedAttempts[key].timestamp = Date.now();
  }
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

    logger.info(`Intento de login con usuario: ${email} desde IP: ${ip}`);

    if (!email || !password) {
      logger.warn("Intento de login fallido: Falta email o contraseña");
      res.status(400).json({ error: "Email y contraseña son obligatorios." });
      return;
    }

    if (isBlocked(email, ip)) {
      logger.warn(`Usuario bloqueado por intentos fallidos: ${email} desde IP: ${ip}`);
      res.status(429).json({ error: "Demasiados intentos. Intente nuevamente en 15 minutos." });
      return;
    }

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      trackFailedLogin(email, ip);
      logger.warn(`Intento de login con usuario no registrado: ${email}`);
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      trackFailedLogin(email, ip);
      logger.warn(`Contraseña incorrecta para usuario: ${email}`);
      res.status(401).json({ error: "Contraseña incorrecta." });
      return;
    }

    // 🔹 Si el login es exitoso, resetear intentos fallidos
    const key = `${email}:${ip}`;
    delete failedAttempts[key];

    // Generar el token con una clave secreta segura
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "1h" }
    );

    logger.info(`Inicio de sesión exitoso para usuario: ${email}`);
    res.status(200).json({
      message: "Inicio de sesión exitoso.",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error: unknown) {
    logger.error(`Error al iniciar sesión: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

// Obtener todos los usuarios (sin exponer contraseñas)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info("Obteniendo todos los usuarios");

    const users = await userModel.getUsers();
    res.status(200).json(users);

    logger.info(`Usuarios obtenidos exitosamente (${users.length} registros)`);
  } catch (error: unknown) {
    logger.error(`Error al obtener usuarios: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar usuario con validaciones
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    logger.warn(`Intento de actualización fallido: ID inválido (${req.params.id})`);
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
      logger.warn(`Intento de actualización fallido: Usuario con ID ${id} no encontrado`);
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    
    logger.info(`Usuario con ID ${id} actualizado correctamente`);
    res.status(200).json(updatedUser);
  } catch (error: unknown) {
    logger.error(`Error al actualizar usuario: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar usuario de forma lógica
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    logger.warn(`Intento de eliminación fallido: ID inválido (${req.params.id})`);
    res.status(400).json({ error: "ID de usuario inválido" });
    return;
  }

  try {
    await userModel.deleteUser(id);
    logger.info(`Usuario con ID ${id} eliminado lógicamente`);
    res.status(200).json({ message: "Usuario eliminado lógicamente" });
  } catch (error: unknown) {
    logger.error(`Error al eliminar usuario: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener usuarios por rol con validación
export const getUsersByRole = async (req: Request, res: Response): Promise<void> => {
  const { role } = req.params;
  if (!role) {
    logger.warn("Intento de consulta de usuarios fallido: Falta el rol");
    res.status(400).json({ error: "El rol es obligatorio" });
    return;
  }

  try {
    logger.info(`Obteniendo usuarios con rol: ${role}`);

    const users = await userModel.getUsersByRole(role);
    res.status(200).json(users);

    logger.info(`Usuarios con rol ${role} obtenidos exitosamente (${users.length} registros)`);
  } catch (error: unknown) {
    logger.error(`Error al obtener usuarios con rol ${role}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
