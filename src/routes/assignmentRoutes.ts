import { Router } from "express";
import * as assignmentController from "../controllers/assignmentController";
import { verifyToken } from "../middleware/authMiddleware";
import { param, body } from "express-validator";

const router = Router();

// 🔹 Validaciones
const validateAssignmentId = [param("id").isInt().withMessage("El ID de la asignación debe ser un número entero")];
const validateUserId = [param("userId").isInt().withMessage("El ID del usuario debe ser un número entero")];
const validateNewAssignment = [
  body("user_id").isInt().withMessage("El ID del usuario es obligatorio y debe ser un número entero"),
  body("group_id").isInt().withMessage("El ID del grupo es obligatorio y debe ser un número entero"),
  body("subject_id").isInt().withMessage("El ID de la materia es obligatorio y debe ser un número entero"),
];

// 🔹 Rutas protegidas con token y validaciones
router.get("/user/:userId", verifyToken, validateUserId, assignmentController.getAssignmentsByUserId);
router.get("/:id", verifyToken, validateAssignmentId, assignmentController.getAssignmentById);
router.post("/", verifyToken, validateNewAssignment, assignmentController.createAssignment);
router.put("/:id", verifyToken, validateAssignmentId, validateNewAssignment, assignmentController.updateAssignment);
router.delete("/:id", verifyToken, validateAssignmentId, assignmentController.deleteAssignment);

export default router;
