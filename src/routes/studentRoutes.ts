import { Router } from "express";
import * as studentController from "../controllers/studentController";
import { verifyToken } from "../middleware/authMiddleware";
import { param } from "express-validator";

const router = Router();

// 🔹 Validaciones
const validateMatricula = [param("matricula").notEmpty().withMessage("La matrícula es requerida")];
const validateGroupId = [param("groupId").isInt().withMessage("El ID del grupo debe ser un número entero")];

// 🔹 Rutas protegidas con token y validaciones
router.get("/:matricula", verifyToken, validateMatricula, studentController.getStudentByMatricula);
router.get("/group/:groupId", verifyToken, validateGroupId, studentController.getStudentsByGroup);

export default router;
