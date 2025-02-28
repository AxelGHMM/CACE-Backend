import { Request, Response } from "express";
import groupModel from "../models/groupModel";
import { validationResult } from "express-validator";

// Obtener grupo por nombre con validación
export const getGroupByName = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const group = await groupModel.getGroupByName(req.params.name);
    if (!group) {
      res.status(404).json({ message: "Grupo no encontrado" });
      return;
    }
    res.status(200).json(group);
  } catch (error) {
    console.error("Error al obtener grupo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todos los grupos
export const getAllGroups = async (_req: Request, res: Response): Promise<void> => {
  try {
    const groups = await groupModel.getAllGroups();
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error al obtener grupos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear un nuevo grupo con validación
export const createGroup = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const group = await groupModel.createGroup(req.body.name);
    res.status(201).json(group);
  } catch (error) {
    console.error("Error al crear grupo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
