import { Router, Request, Response } from "express";
import * as userController from "../controllers/userController";
import { verifyToken } from "../middleware/authMiddleware";
import db from "../config/db"; // Ajusta esto según tu conexión a la BD
import rateLimit from "express-rate-limit";

const router = Router();



const loginAttemptLimiter = (req: Request, res: Response, next: Function): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Debe proporcionar un correo electrónico." });
    return;
  }

  next(); // 🔹 Asegura que pase al siguiente middleware
};


router.post("/register", userController.createUser);

interface CustomRequest extends Request {
  user?: any; // Cambia 'any' por un tipo más específico si tienes uno
}

router.get("/me", verifyToken, (req: CustomRequest, res: Response) => {
  if (!req.user) {
    console.log("Usuario no encontrado en la solicitud.");
    res.status(404).json({ error: "Usuario no encontrado" }); // No uses `return` aquí
    return;
  }

  console.log("Usuario encontrado:", req.user);
  res.status(200).json(req.user);
});

// 🔹 Se aplica el limitador de intentos de login
router.post("/login", loginAttemptLimiter, userController.loginUser);

router.get("/homepage/stats", verifyToken, async (req: CustomRequest, res: Response) => {
  try {
    // 🔹 Asistencias mensuales (últimos 5 meses)
    const attendanceDataResult = await db.query(`
      SELECT EXTRACT(MONTH FROM date) AS month, COUNT(*) AS count
      FROM attendances WHERE is_active = true
      GROUP BY month ORDER BY month;
    `);
    let attendanceData = Array(5).fill(0); // Inicializar con ceros

    attendanceDataResult.rows.forEach((row: any) => {
      const monthIndex = row.month - 1;
      if (monthIndex >= 0 && monthIndex < 5) {
        attendanceData[monthIndex] = parseInt(row.count, 10); // Convertir a número
      }
    });

    // 🔹 Cantidad de estudiantes por grupo
    const gradesDataResult = await db.query(`
      SELECT g.id, COUNT(s.id) AS count
      FROM groups g
      LEFT JOIN students s ON s.group_id = g.id AND s.is_active = true
      GROUP BY g.id ORDER BY g.id;
    `);
    const gradesData = gradesDataResult.rows.map((row: any) => parseInt(row.count, 10));

    // 🔹 Respuesta con los datos de gráficas
    res.status(200).json({
      attendanceData,
      gradesData,
    });

  } catch (error) {
    console.error("Error en la carga de datos para gráficas:", error);
    res.status(500).json({ error: "Error en la carga de gráficas" });
  }
});

router.get("/homepage", verifyToken, (req: Request, res: Response) => {
  res.status(200).json({ message: "Bienvenido al HomePage", user: req.user });
});
router.get("/", verifyToken, userController.getUsers); // Obtener todos los usuarios
router.get("/:id", verifyToken, userController.getUserById); // Obtener usuario por ID
router.post("/", verifyToken, userController.createUser); // Crear usuario
router.put("/:id", verifyToken, userController.updateUser); // Actualizar usuario
router.delete("/:id", verifyToken, userController.deleteUser);
router.get("/role/:role", verifyToken, userController.getUsersByRole);

export default router;
