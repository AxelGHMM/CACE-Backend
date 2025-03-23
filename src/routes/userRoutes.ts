import { Router, Request, Response } from "express";
import * as userController from "../controllers/userController";
import { verifyToken } from "../middleware/authMiddleware";
import db from "../config/db"; // Ajusta esto según tu conexión a la BD
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";


const router = Router();



const loginAttemptLimiter = (req: Request, res: Response, next: Function): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Debe proporcionar un correo electrónico." });
    return;
  }

  next(); // 🔹 Asegura que pase al npsiguiente middleware
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
    const teacherId = req.user.id;

    // 🔹 1) Obtener asistencias por grupo y materia (sin cambios)
    const attendanceResult = await db.query(
      `
      WITH AssignedGroups AS (
          SELECT DISTINCT a.group_id, g.name AS group_name, sb.name AS subject_name
          FROM assignments a
          JOIN groups g ON a.group_id = g.id
          JOIN subjects sb ON a.subject_id = sb.id
          WHERE a.user_id = $1
      )
      SELECT ag.group_name, ag.subject_name, COUNT(a.id) AS attendance_count
      FROM attendances a
      JOIN students s ON a.student_id = s.id
      JOIN AssignedGroups ag ON s.group_id = ag.group_id
      WHERE a.is_active = true 
        AND a.date >= CURRENT_DATE - INTERVAL '5 months'
      GROUP BY ag.group_name, ag.subject_name
      ORDER BY ag.group_name;
      `,
      [teacherId]
    );

    const attendanceData = attendanceResult.rows.map((row: any) => ({
      group: row.group_name,
      subject: row.subject_name,
      count: parseInt(row.attendance_count, 10),
    }));

    // 🔹 2) Obtener el total de asistencias y estudiantes (sin cambios)
    const totalAttendanceResult = await db.query(
      `
      SELECT COUNT(*) AS total_attendance
      FROM attendances a
      JOIN students s ON a.student_id = s.id
      WHERE s.group_id IN (
          SELECT DISTINCT a.group_id
          FROM assignments a
          WHERE a.user_id = $1
      )
      AND a.is_active = true;
      `,
      [teacherId]
    );
    const totalAttendance = parseInt(totalAttendanceResult.rows[0]?.total_attendance || "0", 10);

    const totalStudentsResult = await db.query(
      `
      SELECT COUNT(DISTINCT s.id) AS total_students
      FROM students s
      WHERE s.group_id IN (
          SELECT DISTINCT a.group_id
          FROM assignments a
          WHERE a.user_id = $1
      );
      `,
      [teacherId]
    );
    const totalStudents = parseInt(totalStudentsResult.rows[0]?.total_students || "0", 10);

    // 🔹 3) Calcular el promedio de asistencias
    const attendanceAverage =
      totalStudents > 0 ? ((totalAttendance / totalStudents) * 100).toFixed(2) + "%" : "0%";

    // 🔹 4) Obtener el promedio de calificaciones por parcial
    const gradesResult = await db.query(
      `
      WITH StudentAverages AS (
        SELECT 
          gr.partial, 
          gr.student_id, 
          AVG(
            (COALESCE(gr.activity_1, 0) + COALESCE(gr.activity_2, 0) + 
             COALESCE(gr.attendance, 0) + COALESCE(gr.project, 0) + 
             COALESCE(gr.exam, 0)) / 5.0
          ) AS student_avg
        FROM grades gr
        JOIN students s ON gr.student_id = s.id
        WHERE s.group_id IN (
            SELECT DISTINCT a.group_id
            FROM assignments a
            WHERE a.user_id = $1
        )
        GROUP BY gr.partial, gr.student_id
      )
      SELECT partial, ROUND(AVG(student_avg), 2) AS average_grade
      FROM StudentAverages
      GROUP BY partial
      ORDER BY partial;
      `,
      [teacherId]
    );
    
    

    // 🔹 Procesar los datos para la PieChart
    const gradesData = gradesResult.rows.map((row: any) => ({
      partial: `Parcial ${row.partial}`,
      average: parseFloat(row.average_grade),
    }));

    // 🔹 Respuesta JSON
    res.status(200).json({
      attendanceData,
      totalAttendance,
      totalStudents,
      attendanceAverage,
      gradesData, // Promedio de calificaciones por parcial
    });
  } catch (error) {
    console.error("Error al obtener los datos:", error);
    res.status(500).json({ error: "Error en la carga de datos" });
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

router.get(
  "/logs/:filename",
  verifyToken,
  async (req: Request<{ filename: string }>, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      if (user?.role !== "admin") {
        res.status(403).json({ error: "Acceso denegado: solo administradores" });
        return;
      }

      const allowedFiles = ["app.log", "combined.log", "error.log", "health.log", "http.log"];
      const filename = req.params.filename;

      if (!allowedFiles.includes(filename)) {
        res.status(403).json({ error: "Archivo no permitido" });
        return;
      }

      const filePath = path.join(__dirname, "..", "logs", filename);

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: `Archivo no encontrado: ${filename}` });
        return;
      }

      const content = fs.readFileSync(filePath, "utf8");
      res.json({ filename, content });
    } catch (error) {
      console.error("Error al obtener el log:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

export default router;
