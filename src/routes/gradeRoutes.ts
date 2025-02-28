import { Router } from "express";
import * as gradeController from "../controllers/gradeController";
import { verifyToken } from "../middleware/authMiddleware";
import { param, body } from "express-validator";

const router = Router();

// 🔹 Validaciones
const validateGradeId = [param("id").isInt().withMessage("El ID de la calificación debe ser un número entero")];
const validateGroupAndSubject = [
  param("groupId").isInt().withMessage("El ID del grupo debe ser un número entero"),
  param("subjectId").isInt().withMessage("El ID de la materia debe ser un número entero"),
];
const validateProfessorId = [param("professorId").isInt().withMessage("El ID del profesor debe ser un número entero")];
const validatePartial = [param("partial").optional().isInt().withMessage("El número de parcial debe ser un número entero")];
const validateGrades = [
  body("activity_1").optional().isFloat({ min: 0, max: 100 }).withMessage("Actividad 1 debe ser un número entre 0 y 100"),
  body("activity_2").optional().isFloat({ min: 0, max: 100 }).withMessage("Actividad 2 debe ser un número entre 0 y 100"),
  body("attendance").optional().isFloat({ min: 0, max: 100 }).withMessage("Asistencia debe ser un número entre 0 y 100"),
  body("project").optional().isFloat({ min: 0, max: 100 }).withMessage("Proyecto debe ser un número entre 0 y 100"),
  body("exam").optional().isFloat({ min: 0, max: 100 }).withMessage("Examen debe ser un número entre 0 y 100"),
];

// 🔹 Rutas protegidas con token y validaciones
router.get("/group/:groupId/subject/:subjectId/:partial?", verifyToken, validateGroupAndSubject, validatePartial, gradeController.getGradesByGroupAndSubject);
router.get("/professor/:professorId", verifyToken, validateProfessorId, gradeController.getGradesByProfessor);
router.put("/:id", verifyToken, validateGradeId, validateGrades, gradeController.updateGrade);

export default router;
