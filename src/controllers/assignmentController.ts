import { Request, Response } from "express";
import assignmentModel from "../models/assignmentModel";
import { validationResult } from "express-validator";
import logger from "../utils/logger"; // Importar Winston

// 🔹 Obtener asignaciones por usuario
export const getAssignmentsByUserId = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Errores de validación al obtener asignaciones por usuario", { errors: errors.array() });
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const assignments = await assignmentModel.getAssignmentsByUserId(parseInt(req.params.userId));
    logger.info(`Se obtuvieron ${assignments.length} asignaciones para el usuario ${req.params.userId}`);
    res.status(200).json(assignments);
  } catch (error) {
    logger.error(`Error al obtener asignaciones por usuario ${req.params.userId}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🔹 Obtener una asignación por ID
export const getAssignmentById = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Errores de validación al obtener asignación por ID", { errors: errors.array() });
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const assignment = await assignmentModel.getAssignmentById(parseInt(req.params.id));
    if (!assignment) {
      logger.warn(`Asignación con ID ${req.params.id} no encontrada`);
      res.status(404).json({ error: "Asignación no encontrada" });
      return;
    }
    logger.info(`Asignación con ID ${req.params.id} obtenida correctamente`);
    res.status(200).json(assignment);
  } catch (error) {
    logger.error(`Error al obtener asignación con ID ${req.params.id}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🔹 Crear una nueva asignación
export const createAssignment = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Errores de validación al crear asignación", { errors: errors.array() });
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const newAssignment = await assignmentModel.createAssignment(req.body);
    logger.info(`Asignación creada correctamente: ${JSON.stringify(newAssignment)}`);
    res.status(201).json(newAssignment);
  } catch (error) {
    logger.error(`Error al crear asignación: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🔹 Actualizar una asignación
export const updateAssignment = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Errores de validación al actualizar asignación", { errors: errors.array() });
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const updatedAssignment = await assignmentModel.updateAssignment(parseInt(req.params.id), req.body);
    if (!updatedAssignment) {
      logger.warn(`Intento de actualizar asignación con ID ${req.params.id} que no existe`);
      res.status(404).json({ error: "Asignación no encontrada" });
      return;
    }
    logger.info(`Asignación con ID ${req.params.id} actualizada correctamente`);
    res.status(200).json(updatedAssignment);
  } catch (error) {
    logger.error(`Error al actualizar asignación con ID ${req.params.id}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🔹 Eliminar una asignación
export const deleteAssignment = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Errores de validación al eliminar asignación", { errors: errors.array() });
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    await assignmentModel.deleteAssignment(parseInt(req.params.id));
    logger.info(`Asignación con ID ${req.params.id} eliminada correctamente`);
    res.status(200).json({ message: "Asignación eliminada correctamente" });
  } catch (error) {
    logger.error(`Error al eliminar asignación con ID ${req.params.id}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
