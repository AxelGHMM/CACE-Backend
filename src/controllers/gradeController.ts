import { Request, Response } from "express";
import gradeModel from "../models/gradeModel";
import logger from "../utils/logger"; // Importar Winston

// 🔹 Crear registros en la tabla grades cuando se inscribe un estudiante
export const createGradesForStudent = async (studentId: number, groupId: number) => {
  try {
    await gradeModel.createGradesForStudent(studentId, groupId);
    logger.info(`Calificaciones creadas para estudiante ${studentId} en grupo ${groupId}`);
  } catch (error) {
    logger.error(`Error al crear registros en grades para estudiante ${studentId}: ${error}`);
  }
};

// 🔹 Obtener calificaciones de un grupo y materia específicos
export const getGradesByGroupAndSubject = async (req: Request, res: Response): Promise<void> => {
  const { groupId, subjectId, partial } = req.params;
  logger.info(`Consulta de calificaciones recibida para grupo ${groupId}, materia ${subjectId}, parcial ${partial || "todos"}`);

  try {
    const grades = await gradeModel.getGradesByGroupAndSubject(parseInt(groupId), parseInt(subjectId), partial ? parseInt(partial) : null);
    logger.info(`Calificaciones obtenidas para grupo ${groupId} y materia ${subjectId}: ${grades.length} registros`);
    res.status(200).json(grades);
  } catch (error) {
    logger.error(`Error al obtener calificaciones para grupo ${groupId} y materia ${subjectId}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🔹 Obtener todas las calificaciones de un profesor autenticado
export const getGradesByProfessor = async (req: Request, res: Response): Promise<void> => {
  const { professorId } = req.params;

  try {
    const grades = await gradeModel.getGradesByProfessor(parseInt(professorId));
    logger.info(`Se obtuvieron ${grades.length} calificaciones para el profesor ${professorId}`);
    res.status(200).json(grades);
  } catch (error) {
    logger.error(`Error al obtener calificaciones del profesor ${professorId}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🔹 Actualizar calificaciones de un estudiante
export const updateGrade = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { activity_1, activity_2, attendance, project, exam } = req.body;

  try {
    const updatedGrade = await gradeModel.updateGrade(parseInt(id), { activity_1, activity_2, attendance, project, exam });
    if (!updatedGrade) {
      logger.warn(`Intento de actualizar calificación con ID ${id}, pero no existe`);
      res.status(404).json({ error: "Registro de calificación no encontrado" });
      return;
    }
    logger.info(`Calificación con ID ${id} actualizada correctamente`);
    res.status(200).json({ message: "Calificación actualizada", grade: updatedGrade });
  } catch (error) {
    logger.error(`Error al actualizar calificación con ID ${id}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
