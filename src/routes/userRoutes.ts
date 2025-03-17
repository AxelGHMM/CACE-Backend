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
    const teacherId = req.user.id; // ID del profesor autenticado

    // 🔹 1) Obtener asistencias por grupo y materia
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

    // 🔹 2) Obtener el total de asistencias
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

    // 🔹 3) Obtener el total de estudiantes registrados
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

    // 🔹 4) Calcular el promedio de asistencias (porcentaje) con dos decimales
    const attendanceAverage =
      totalStudents > 0
        ? ((totalAttendance / totalStudents) * 100).toFixed(2) + "%"
        : "0%";

    // 🔹 5) Obtener datos de calificaciones para la PieChart
    //     - Supongamos que "partial" indica el número de parcial (1, 2, 3).
    //     - Contamos cuántos registros hay por cada parcial.
    const gradesResult = await db.query(
      `
      SELECT gr.partial, COUNT(*) AS count
      FROM grades gr
      JOIN students s ON gr.student_id = s.id
      WHERE s.group_id IN (
          SELECT DISTINCT a.group_id
          FROM assignments a
          WHERE a.user_id = $1
      )
      GROUP BY gr.partial
      ORDER BY gr.partial;
      `,
      [teacherId]
    );

    // Calculamos el total de calificaciones registradas
    let totalGradesCount = 0;
    gradesResult.rows.forEach((row: any) => {
      totalGradesCount += parseInt(row.count, 10);
    });

    // Mapeamos la data para la PieChart, incluyendo porcentaje
    const gradesData = gradesResult.rows.map((row: any) => {
      const count = parseInt(row.count, 10);
      const partialNumber = parseInt(row.partial, 10);
      let partialLabel = "";

      switch (partialNumber) {
        case 1:
          partialLabel = "Parcial 1";
          break;
        case 2:
          partialLabel = "Parcial 2";
          break;
        case 3:
          partialLabel = "Parcial 3";
          break;
        default:
          partialLabel = `Parcial ${partialNumber}`;
          break;
      }

      const percentage =
        totalGradesCount > 0
          ? ((count / totalGradesCount) * 100).toFixed(2)
          : "0";

      return {
        partial: partialLabel,
        count,
        percentage: percentage + "%",
      };
    });

    // 🔹 Respuesta JSON con todos los datos
    res.status(200).json({
      attendanceData,
      totalAttendance,
      totalStudents,
      attendanceAverage, // Promedio de asistencias
      gradesData,        // Datos para la PieChart de calificaciones
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

export default router;
