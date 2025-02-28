import { Request, Response } from "express";
import studentModel from "../models/studentModel";
import { validationResult } from "express-validator";

// Obtener estudiante por matrícula
export const getStudentByMatricula = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const student = await studentModel.getStudentByMatricula(req.params.matricula);
    if (!student) {
      res.status(404).json({ message: "Estudiante no encontrado" });
      return;
    }
    res.status(200).json(student);
  } catch (error) {
    console.error("Error al obtener estudiante:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener estudiantes por grupo
export const getStudentsByGroup = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const students = await studentModel.getStudentsByGroup(parseInt(req.params.groupId));
    if (students.length === 0) {
      res.status(404).json({ message: "No se encontraron estudiantes para este grupo" });
      return;
    }
    res.status(200).json(students);
  } catch (error) {
    console.error("Error al obtener estudiantes del grupo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
