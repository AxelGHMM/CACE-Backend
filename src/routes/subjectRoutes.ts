import { Router } from "express";
import * as subjectController from "../controllers/subjectController";
import { verifyToken } from "../middleware/authMiddleware";
import { param, body } from "express-validator";

const router = Router();

// 🔹 Validaciones
const validateSubjectId = [param("id").isInt().withMessage("El ID debe ser un número entero")];
const validateSubjectName = [body("name").notEmpty().withMessage("El nombre de la materia es requerido")];

// 🔹 Rutas protegidas con token y validaciones
router.get("/:id", verifyToken, validateSubjectId, subjectController.getSubjectById);
router.get("/name/:name", verifyToken, subjectController.getSubjectByName);
router.get("/", verifyToken, subjectController.getAllSubjects);
router.post("/", verifyToken, validateSubjectName, subjectController.createSubject);
router.put("/:id", verifyToken, validateSubjectId, validateSubjectName, subjectController.updateSubject);
router.delete("/:id", verifyToken, validateSubjectId, subjectController.deleteSubject);

export default router;
