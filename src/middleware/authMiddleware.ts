import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface CustomJwtPayload extends JwtPayload {
  id: number;
  role?: string;
}

interface CustomRequest extends Request {
  user?: CustomJwtPayload;
}

export const verifyToken = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Token no proporcionado" });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || "defaultsecret";
    const decoded = jwt.verify(token, secret) as CustomJwtPayload;

    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      res.status(401).json({ error: "Token expirado" });
      return;
    }

    // Asigna el token decodificado a `req.user` con el tipo correcto
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Error al verificar token:", err);
    res.status(401).json({ error: "Token inválido" });
  }
};
