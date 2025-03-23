import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';
import morgan from "morgan";
import axios from "axios";
import logger from "./utils/logger"; // Importar Winston
import { Request, Response } from 'express';
// Importar rutas
import userRoutes from "./routes/userRoutes";
import gradeRoutes from "./routes/gradeRoutes";
import studentRoutes from "./routes/studentRoutes";
import groupRoutes from "./routes/groupRoutes";
import subjectRoutes from "./routes/subjectRoutes";
import assignmentRoutes from "./routes/assignmentRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import adminRoutes from "./routes/adminRoutes";
import uploadRoutes from "./routes/uploadRoutes"; // Nueva ruta para carga de archivos

dotenv.config(); // Cargar variables de entorno

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;
const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"];

// 🔹 Middleware de Morgan para registrar solicitudes HTTP en Winston
app.use(morgan(":method :url :status :res[content-length] - :response-time ms", {
  stream: { write: (message: string) => logger.http(message.trim()) }
}));

// 🔹 Configuración de CORS con logs para intentos bloqueados
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`❌ Bloqueo CORS para origen no autorizado: ${origin}`);
      callback(new Error("No autorizado por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 🔹 Middleware para procesar JSON
app.use(express.json());

// 🔹 Ruta de salud para monitoreo
app.get("/api/health", (req, res) => {
  logger.info(`✅ API activa - Health Check`, { label: "health" });
  res.status(200).send("✅ API activa");
});

// 🔹 Función de ping para mantener la API activa en Render
const PING_URL = process.env.RENDER_APP_URL;

const sendPing = async () => {
  if (!PING_URL) {
    console.warn("❌ No se enviará ping porque PING_URL no está definida.");
    return;
  }

  try {
    await axios.get(PING_URL);
    logger.info(`✅ Ping exitoso: ${PING_URL}`, { label: "health" });
  } catch (error) {
    console.error("⚠️ Error en el ping:", error);
  }
};


// 🔹 Registro al iniciar la API
logger.info(`🚀 API iniciada en http://0.0.0.0:${PORT}`, { label: "app" });

// 🔹 Hacer un ping al iniciar y cada 10 minutos
sendPing();
setInterval(sendPing, 10 * 60 * 1000); 

// 🔹 Rutas de la API
app.use("/api/users", userRoutes);
app.use("/api/grade", gradeRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/attendances", attendanceRoutes);
app.use("/api", uploadRoutes);
app.use("/api/admin", adminRoutes);

// 🔹 Middleware de manejo de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`❌ Error en ${req.method} ${req.url}: ${err.message}`, { label: "error" });
  res.status(500).json({ error: "Error interno del servidor" });
});

// 🔹 Iniciar el servidor
app.listen(PORT, () => {
  logger.info(`Servidor corriendo en http://0.0.0.0:${PORT}`, { label: "app" });
});
