import { Router } from "express";
import * as attendanceController from "../controllers/attendanceController";
import { verifyToken } from "../middleware/authMiddleware";
import { param, body } from "express-validator";

const router = Router();

// 🔹 Validaciones
const validateGroupAndSubject = [
  param("groupId").isInt().withMessage("El ID del grupo debe ser un número entero"),
  param("subjectId").isInt().withMessage("El ID de la materia debe ser un número entero"),
];

const validateAttendances = [
  body("group_id").isInt().withMessage("El ID del grupo es obligatorio y debe ser un número entero"),
  body("subject_id").isInt().withMessage("El ID de la materia es obligatorio y debe ser un número entero"),
  body("date").isISO8601().withMessage("La fecha debe estar en formato ISO 8601"),
  body("attendances").isArray().withMessage("Debe proporcionar una lista de asistencias"),
  body("attendances.*.student_id").isInt().withMessage("Cada asistencia debe tener un ID de estudiante válido"),
  body("attendances.*.status").isIn(["presente", "ausente", "retardo"]).withMessage("El estado de asistencia no es válido"),
];

// 🔹 Rutas protegidas con token y validaciones
router.get("/group/:groupId/subject/:subjectId", verifyToken, validateGroupAndSubject, attendanceController.getAttendanceByGroupAndSubject);
router.post("/submit", verifyToken, validateAttendances, attendanceController.createAttendances);

export default router;
