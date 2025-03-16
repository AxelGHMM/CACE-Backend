import { Request, Response } from "express";
import groupModel from "../models/groupModel";
import { validationResult } from "express-validator";
import logger from "../utils/logger"; // Importar Winston

// Obtener grupo por nombre con validación
export const getGroupByName = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Errores de validación al obtener grupo por nombre", { errors: errors.array() });
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const group = await groupModel.getGroupByName(req.params.name);
    if (!group) {
      logger.warn(`Grupo con nombre '${req.params.name}' no encontrado`);
      res.status(404).json({ message: "Grupo no encontrado" });
      return;
    }
    logger.info(`Grupo '${req.params.name}' obtenido correctamente`);
    res.status(200).json(group);
  } catch (error) {
    logger.error(`Error al obtener grupo por nombre '${req.params.name}': ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todos los grupos
export const getAllGroups = async (_req: Request, res: Response): Promise<void> => {
  try {
    const groups = await groupModel.getAllGroups();
    logger.info(`Se obtuvieron ${groups.length} grupos`);
    res.status(200).json(groups);
  } catch (error) {
    logger.error(`Error al obtener todos los grupos: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear un nuevo grupo con validación
export const createGroup = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Errores de validación al crear grupo", { errors: errors.array() });
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const group = await groupModel.createGroup(req.body.name);
    logger.info(`Grupo creado: ${group.name}`);
    res.status(201).json(group);
  } catch (error) {
    logger.error(`Error al crear grupo: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
