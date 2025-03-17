import { Request, Response } from "express";
import attendanceModel from "../models/attendanceModel";
import logger from "../utils/logger"; // Importar Winston

// 🔹 Obtener lista de alumnos por grupo y materia
export const getAttendanceByGroupAndSubject = async (req: Request, res: Response) => {
  const { groupId, subjectId } = req.params;

  if (!groupId || !subjectId) {
    logger.warn("Solicitud de asistencia fallida: Falta groupId o subjectId");
    res.status(400).json({ error: "groupId y subjectId son requeridos" });
    return;
  }

  try {
    const students = await attendanceModel.getAttendanceByGroupAndSubject(parseInt(groupId), parseInt(subjectId));
    if (students.length === 0) {
      logger.warn(`No se encontraron alumnos en el grupo ${groupId} y materia ${subjectId}`);
      res.status(404).json({ message: "No hay alumnos en este grupo" });
      return;
    }

    logger.info(`Asistencias obtenidas para grupo ${groupId}, materia ${subjectId}: ${students.length} registros`);
    res.status(200).json(students);
  } catch (error) {
    logger.error(`Error al obtener asistencia para grupo ${groupId} y materia ${subjectId}: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🔹 Registrar asistencias
export const createAttendances = async (req: Request, res: Response) => {
  const { group_id, subject_id, date, attendances } = req.body;
  const user_id = req.user?.id;

  if (!group_id || !subject_id || !date || !attendances || !Array.isArray(attendances)) {
    logger.warn("Intento de registrar asistencia con datos incompletos");
    res.status(400).json({ error: "group_id, subject_id, date y attendances son requeridos" });
    return;
  }

  if (!user_id) {
    logger.warn("Intento de registrar asistencia sin autenticación");
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
    logger.info(`Asistencia registrada para ${formattedAttendances.length} estudiantes en grupo ${group_id}, materia ${subject_id}`);
    res.status(201).json({ message: "Asistencia registrada", data: newAttendances });
  } catch (error) {
    logger.error(`Error al registrar asistencias: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
export const getAttendanceByStudent = async (req: Request, res: Response) => {
  const { studentId } = req.params;

  try {
    const attendanceRecords = await attendanceModel.getAttendanceByStudent(parseInt(studentId));
    res.status(200).json(attendanceRecords);
  } catch (error) {
    logger.error(`Error al obtener asistencias: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🔹 Obtener asistencias por fecha separadas por hora
export const getAttendanceByDate = async (req: Request, res: Response) => {
  const { date } = req.params;

  try {
    const attendanceRecords = await attendanceModel.getAttendanceByDate(date);
    res.status(200).json(attendanceRecords);
  } catch (error) {
    logger.error(`Error al obtener asistencias: ${error}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
