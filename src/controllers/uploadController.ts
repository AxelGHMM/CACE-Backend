import { Request, Response } from "express";
import pool from "../config/db";
import { createGradesForStudent } from "../controllers/gradeController";
import { validationResult } from "express-validator";

export const uploadStudents = async (req: Request, res: Response): Promise<void> => {
  // Validación de datos
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { data, groupId } = req.body;

  try {
    if (!groupId || !Array.isArray(data)) {
      res.status(400).json({ error: "Datos inválidos. Verifica el grupo y el archivo." });
      return;
    }

    const client = await pool.connect();

    try {
      for (const student of data) {
        const { name, email, matricula } = student;

        if (!name || !matricula) {
          console.warn(`Registro inválido encontrado: ${JSON.stringify(student)}`);
          continue;
        }

        // Insertar estudiante en la tabla students si no existe
        const studentResult = await client.query(
          `INSERT INTO students (name, email, matricula, group_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (matricula) 
           DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, group_id = EXCLUDED.group_id
           RETURNING id;`,
          [name, email || null, matricula, groupId]
        );

        const studentId = studentResult.rows[0].id;

        // Crear registros en grades para este estudiante si aún no existen
        await createGradesForStudent(studentId, groupId);
      }

      await client.query("COMMIT");
      res.status(200).json({ message: "Archivo subido y estudiantes registrados correctamente." });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error al procesar el archivo:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al establecer conexión con la base de datos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
