import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel";
import { body, validationResult } from "express-validator";

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

    if (!email || !password) {
      res.status(400).json({ error: "Email y contraseña son obligatorios." });
      return;
    }

    // 🔹 Verificar si el usuario está bloqueado
    if (isBlocked(email, ip)) {
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

    // 🔹 Si el login es exitoso, resetear intentos fallidos
    const key = `${email}:${ip}`;
    delete failedAttempts[key];

    // Generar el token con una clave secreta segura
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Inicio de sesión exitoso.",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

// Obtener todos los usuarios (sin exponer contraseñas)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await userModel.getUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener usuario por ID con validación
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID de usuario inválido" });
    return;
  }

  try {
    const user = await userModel.getUserById(id);
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear un nuevo usuario con validación y protección contra duplicados
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
      res.status(400).json({ error: "El correo ya está registrado." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.createUser({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar usuario con validaciones
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
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


// Eliminar usuario de forma lógica
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID de usuario inválido" });
    return;
  }

  try {
    await userModel.deleteUser(id);
    res.status(200).json({ message: "Usuario eliminado lógicamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener usuarios por rol con validación
export const getUsersByRole = async (req: Request, res: Response): Promise<void> => {
  const { role } = req.params;
  if (!role) {
    res.status(400).json({ error: "El rol es obligatorio" });
    return;
  }

  try {
    const users = await userModel.getUsersByRole(role);
    res.status(200).json(users);
  } catch (error) {
    console.error(`Error al obtener usuarios con rol ${role}:`, error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
