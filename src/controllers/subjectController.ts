import { Request, Response } from "express";
import subjectModel from "../models/subjectModel";
import { validationResult } from "express-validator";

// Obtener materia por ID
export const getSubjectById = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const subject = await subjectModel.getSubjectById(parseInt(req.params.id));
    if (!subject) {
      res.status(404).json({ message: "Materia no encontrada" });
      return;
    }
    res.status(200).json(subject);
  } catch (error) {
    console.error("Error al obtener materia:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener materia por nombre
export const getSubjectByName = async (req: Request, res: Response): Promise<void> => {
  const { name } = req.params;

  try {
    const subject = await subjectModel.getSubjectByName(name);
    if (!subject) {
      res.status(404).json({ message: "Materia no encontrada" });
      return;
    }
    res.status(200).json(subject);
  } catch (error) {
    console.error("Error al obtener materia por nombre:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todas las materias
export const getAllSubjects = async (_req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await subjectModel.getAllSubjects();
    res.status(200).json(subjects);
  } catch (error) {
    console.error("Error al obtener todas las materias:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear nueva materia
export const createSubject = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const newSubject = await subjectModel.createSubject({ name: req.body.name });
    res.status(201).json(newSubject);
  } catch (error) {
    console.error("Error al crear materia:", error);
    res.status(500).json({ error: "Error al crear materia" });
  }
};

// Actualizar materia
export const updateSubject = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const updatedSubject = await subjectModel.updateSubject(parseInt(req.params.id), req.body.name);
    if (!updatedSubject) {
      res.status(404).json({ message: "Materia no encontrada" });
      return;
    }
    res.status(200).json(updatedSubject);
  } catch (error) {
    console.error("Error al actualizar materia:", error);
    res.status(500).json({ error: "Error al actualizar materia" });
  }
};

// Eliminar materia lógicamente
export const deleteSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    await subjectModel.deleteSubject(parseInt(req.params.id));
    res.status(200).json({ message: "Materia eliminada lógicamente" });
  } catch (error) {
    console.error("Error al eliminar materia:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
