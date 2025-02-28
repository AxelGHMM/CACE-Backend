import { Request, Response } from "express";
import gradeModel from "../models/gradeModel";

// 🔹 Crear registros en la tabla grades cuando se inscribe un estudiante
export const createGradesForStudent = async (studentId: number, groupId: number) => {
  try {
    await gradeModel.createGradesForStudent(studentId, groupId);
  } catch (error) {
    console.error("Error al crear registros en grades:", error);
  }
};

// 🔹 Obtener calificaciones de un grupo y materia específicos
export const getGradesByGroupAndSubject = async (req: Request, res: Response): Promise<void> => {
  const { groupId, subjectId, partial } = req.params;
  console.log("🔹 Parámetros recibidos:", { groupId, subjectId, partial });

  try {
    const grades = await gradeModel.getGradesByGroupAndSubject(parseInt(groupId), parseInt(subjectId), partial ? parseInt(partial) : null);
    console.log("📌 Calificaciones obtenidas:", grades);
    res.status(200).json(grades);
  } catch (error) {
    console.error("❌ Error al obtener calificaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


// 🔹 Obtener todas las calificaciones de un profesor autenticado
export const getGradesByProfessor = async (req: Request, res: Response): Promise<void> => {
  const { professorId } = req.params;

  try {
    const grades = await gradeModel.getGradesByProfessor(parseInt(professorId));
    res.status(200).json(grades);
  } catch (error) {
    console.error("Error al obtener calificaciones del profesor:", error);
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
      res.status(404).json({ error: "Registro de calificación no encontrado" });
      return;
    }
    res.status(200).json({ message: "Calificación actualizada", grade: updatedGrade });
  } catch (error) {
    console.error("Error al actualizar calificación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
