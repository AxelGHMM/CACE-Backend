import { Request, Response } from "express";
import attendanceModel from "../models/attendanceModel";

// Obtener lista de alumnos por grupo y materia
export const getAttendanceByGroupAndSubject = async (req: Request, res: Response) => {
  const { groupId, subjectId } = req.params;

  if (!groupId || !subjectId) {
    res.status(400).json({ error: "groupId y subjectId son requeridos" });
    return;
  }

  try {
    const students = await attendanceModel.getAttendanceByGroupAndSubject(parseInt(groupId), parseInt(subjectId));
    if (students.length === 0) {
      res.status(404).json({ message: "No hay alumnos en este grupo" });
      return;
    }

    res.status(200).json(students);
  } catch (error) {
    console.error("Error al obtener asistencia:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Registrar asistencias
export const createAttendances = async (req: Request, res: Response) => {
  const { group_id, subject_id, date, attendances } = req.body;
  const user_id = req.user?.id;

  if (!group_id || !subject_id || !date || !attendances || !Array.isArray(attendances)) {
    res.status(400).json({ error: "group_id, subject_id, date y attendances son requeridos" });
    return;
  }

  if (!user_id) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  try {
    const formattedAttendances = attendances.map(att => ({
      student_id: att.student_id,
      user_id,
      subject_id,
      date,
      status: att.status.toLowerCase(),
    }));

    const newAttendances = await attendanceModel.createAttendances(formattedAttendances);
    res.status(201).json({ message: "Asistencia registrada", data: newAttendances });
  } catch (error) {
    console.error("Error al registrar asistencias:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
