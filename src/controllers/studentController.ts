import { Request, Response } from "express";
import studentModel from "../models/studentModel";
import { validationResult } from "express-validator";
import logger from "../utils/logger"; // Importar Winston

// Obtener estudiante por matrícula
export const getStudentByMatricula = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Errores de validación al obtener estudiante por matrícula", { errors: errors.array() });
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const student = await studentModel.getStudentByMatricula(req.params.matricula);
    if (!student) {
      logger.warn(`Estudiante con matrícula ${req.params.matricula} no encontrado`);
      res.status(404).json({ message: "Estudiante no encontrado" });
      return;
    }
    logger.info(`Estudiante con matrícula ${req.params.matricula} obtenido correctamente`);
    res.status(200).json(student);
  } catch (error) {
    logger.error(`Error al obtener estudiante con matrícula ${req.params.matricula}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener estudiantes por grupo
export const getStudentsByGroup = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Errores de validación al obtener estudiantes por grupo", { errors: errors.array() });
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const students = await studentModel.getStudentsByGroup(parseInt(req.params.groupId));
    if (students.length === 0) {
      logger.warn(`No se encontraron estudiantes en el grupo ${req.params.groupId}`);
      res.status(404).json({ message: "No se encontraron estudiantes para este grupo" });
      return;
    }
    logger.info(`Se obtuvieron ${students.length} estudiantes del grupo ${req.params.groupId}`);
    res.status(200).json(students);
  } catch (error) {
    logger.error(`Error al obtener estudiantes del grupo ${req.params.groupId}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
