import { Router } from "express";
import { uploadStudents } from "../controllers/uploadController";
import { verifyToken } from "../middleware/authMiddleware";
import { body } from "express-validator";

const router = Router();

// 🔹 Validaciones para la carga de estudiantes
const validateUpload = [
  body("groupId").isInt().withMessage("El ID del grupo debe ser un número entero"),
  body("data").isArray().withMessage("El archivo debe contener un array de estudiantes"),
];

// 🔹 Ruta protegida con validaciones y token
router.post("/upload", verifyToken, validateUpload, uploadStudents);

export default router;
