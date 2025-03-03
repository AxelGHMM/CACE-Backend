import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import gradeRoutes from "./routes/gradeRoutes";
import studentRoutes from "./routes/studentRoutes";
import groupRoutes from "./routes/groupRoutes";
import subjectRoutes from "./routes/subjectRoutes";
import assignmentRoutes from "./routes/assignmentRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import adminRoutes from "./routes/adminRoutes"
import axios from "axios";
import uploadRoutes from "./routes/uploadRoutes"; // Importar las rutas de upload

dotenv.config(); // Carga las variables de entorno desde el archivo .env

const app = express();
app.get("/api/health", (req, res) => {
  res.status(200).send("✅ API activa");
});

// Configuración de puertos y CORS
const PORT = process.env.BACKEND_PORT || 5000;

const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No autorizado por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const PING_URL = process.env.RENDER_APP_URL +  "/api/health" || `http://localhost:${PORT}`;

const sendPing = async () => {
  try {
    const response = await axios.get(PING_URL);
    console.log(`✅ Ping exitoso a ${PING_URL} - Status: ${response.status}`);
  } catch (error: any) {
    console.error("⚠️ Error en el ping:", error.message);
  }
};

// 🔹 Hacer un ping al iniciar para confirmar que funciona
sendPing();

// 🔹 Luego, seguir enviando pings cada 10 minutos
setInterval(sendPing, 60 * 1000);

app.use(express.json()); // Middleware para procesar JSON

// Rutas
app.use("/api/users", userRoutes);
app.use("/api/grade", gradeRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/attendances", attendanceRoutes);
app.use("/api", uploadRoutes); // Nueva ruta para la carga de archivos
app.use("/api/admin", adminRoutes);

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Algo salió mal.");
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
