import { Request, Response } from "express";
import subjectModel from "../models/subjectModel";
import { validationResult } from "express-validator";
import logger from "../utils/logger"; // Importar Winston

// Obtener materia por ID
export const getSubjectById = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Errores de validación al obtener materia por ID", { errors: errors.array() });
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const subject = await subjectModel.getSubjectById(parseInt(req.params.id));
    if (!subject) {
      logger.warn(`Materia con ID ${req.params.id} no encontrada`);
      res.status(404).json({ message: "Materia no encontrada" });
      return;
    }
    logger.info(`Materia con ID ${req.params.id} obtenida correctamente`);
    res.status(200).json(subject);
  } catch (error) {
    logger.error(`Error al obtener materia por ID ${req.params.id}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener materia por nombre
export const getSubjectByName = async (req: Request, res: Response): Promise<void> => {
  const { name } = req.params;

  try {
    const subject = await subjectModel.getSubjectByName(name);
    if (!subject) {
      logger.warn(`Materia con nombre '${name}' no encontrada`);
      res.status(404).json({ message: "Materia no encontrada" });
      return;
    }
    logger.info(`Materia '${name}' obtenida correctamente`);
    res.status(200).json(subject);
  } catch (error) {
    logger.error(`Error al obtener materia por nombre '${name}': ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todas las materias
export const getAllSubjects = async (_req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await subjectModel.getAllSubjects();
    logger.info(`Se obtuvieron ${subjects.length} materias`);
    res.status(200).json(subjects);
  } catch (error) {
    logger.error(`Error al obtener todas las materias: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear nueva materia
export const createSubject = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Errores de validación al crear materia", { errors: errors.array() });
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const newSubject = await subjectModel.createSubject({ name: req.body.name });
    logger.info(`Materia creada: ${newSubject.name}`);
    res.status(201).json(newSubject);
  } catch (error) {
    logger.error(`Error al crear materia: ${error}`);
    res.status(500).json({ error: "Error al crear materia" });
  }
};

// Actualizar materia
export const updateSubject = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Errores de validación al actualizar materia", { errors: errors.array() });
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const updatedSubject = await subjectModel.updateSubject(parseInt(req.params.id), req.body.name);
    if (!updatedSubject) {
      logger.warn(`Intento de actualizar materia con ID ${req.params.id} que no existe`);
      res.status(404).json({ message: "Materia no encontrada" });
      return;
    }
    logger.info(`Materia con ID ${req.params.id} actualizada correctamente`);
    res.status(200).json(updatedSubject);
  } catch (error) {
    logger.error(`Error al actualizar materia con ID ${req.params.id}: ${error}`);
    res.status(500).json({ error: "Error al actualizar materia" });
  }
};

// Eliminar materia lógicamente
export const deleteSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    await subjectModel.deleteSubject(parseInt(req.params.id));
    logger.info(`Materia con ID ${req.params.id} eliminada lógicamente`);
    res.status(200).json({ message: "Materia eliminada lógicamente" });
  } catch (error) {
    logger.error(`Error al eliminar materia con ID ${req.params.id}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
