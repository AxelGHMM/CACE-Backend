import { Request, Response } from "express";
import assignmentModel from "../models/assignmentModel";
import { validationResult } from "express-validator";

// 🔹 Obtener asignaciones por usuario
export const getAssignmentsByUserId = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const assignments = await assignmentModel.getAssignmentsByUserId(parseInt(req.params.userId));
    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error al obtener asignaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🔹 Obtener una asignación por ID
export const getAssignmentById = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const assignment = await assignmentModel.getAssignmentById(parseInt(req.params.id));
    if (!assignment) {
      res.status(404).json({ error: "Asignación no encontrada" });
      return;
    }
    res.status(200).json(assignment);
  } catch (error) {
    console.error("Error al obtener asignación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🔹 Crear una nueva asignación
export const createAssignment = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const newAssignment = await assignmentModel.createAssignment(req.body);
    res.status(201).json(newAssignment);
  } catch (error) {
    console.error("Error al crear asignación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🔹 Actualizar una asignación
export const updateAssignment = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const updatedAssignment = await assignmentModel.updateAssignment(parseInt(req.params.id), req.body);
    if (!updatedAssignment) {
      res.status(404).json({ error: "Asignación no encontrada" });
      return;
    }
    res.status(200).json(updatedAssignment);
  } catch (error) {
    console.error("Error al actualizar asignación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🔹 Eliminar una asignación
export const deleteAssignment = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    await assignmentModel.deleteAssignment(parseInt(req.params.id));
    res.status(200).json({ message: "Asignación eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar asignación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
