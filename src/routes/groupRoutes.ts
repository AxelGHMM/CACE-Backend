import { Router } from "express";
import * as groupController from "../controllers/groupController";
import { verifyToken } from "../middleware/authMiddleware";
import { param, body } from "express-validator";

const router = Router();

// 🔹 Validaciones
const validateGroupName = [param("name").notEmpty().withMessage("El nombre del grupo es requerido")];
const validateNewGroup = [body("name").notEmpty().withMessage("El nombre del grupo es requerido")];

// 🔹 Rutas protegidas con token y validaciones
router.get("/:name", verifyToken, validateGroupName, groupController.getGroupByName);
router.get("/", verifyToken, groupController.getAllGroups);
router.post("/", verifyToken, validateNewGroup, groupController.createGroup);

export default router;
