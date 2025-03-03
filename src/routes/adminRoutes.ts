import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import db from "../config/db"; // Ajusta esto según tu conexión a la BD

const router = Router();


router.get("/homepage", verifyToken, async (req, res) => {
  try {
    // 🔹 Consultas con parámetros seguros
    const totalUsersResult = await db.query("SELECT COUNT(*)::int AS totalUsers FROM users");
    const totalSubjectsResult = await db.query("SELECT COUNT(*)::int AS totalSubjects FROM subjects");
    const totalGroupsResult = await db.query("SELECT COUNT(*)::int AS totalGroups FROM groups");

    const usersByRoleResult = await db.query(`
      SELECT role, COUNT(*)::int AS count 
      FROM users 
      GROUP BY role
    `);

    const subjectsByGroupResult = await db.query(`
      SELECT g.name AS group_name, COUNT(s.id)::int AS subject_count
      FROM groups g
      LEFT JOIN assignments a ON a.group_id = g.id
      LEFT JOIN subjects s ON s.id = a.subject_id
      GROUP BY g.id, g.name
    `);

    // 🔹 Extraer valores correctamente
    const totalUsers = totalUsersResult.rows[0]?.totalusers ?? 0;
    const totalSubjects = totalSubjectsResult.rows[0]?.totalsubjects ?? 0;
    const totalGroups = totalGroupsResult.rows[0]?.totalgroups ?? 0;

    // 🔹 Asegurar que los valores de roles sean correctos
    const roles = { admin: 0, professor: 0, student: 0 };

    usersByRoleResult.rows.forEach((row) => {
      const roleKey = row.role as keyof typeof roles;
      if (roleKey in roles) {
        roles[roleKey] = row.count;
      }
    });

    const subjectsByGroup = subjectsByGroupResult.rows.map((g) => g.subject_count);

    res.json({
      totalUsers,
      totalSubjects,
      totalGroups,
      usersByRole: [roles.admin, roles.professor, roles.student],
      subjectsByGroup,
    });
  } catch (error) {
    console.error("Error en la consulta:", error);
    res.status(500).json({ message: "Error al obtener datos" });
  }
});

export default router;
