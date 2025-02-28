import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'clave_secreta';

// Generar un token
export const generateToken = (payload: object): string => {
  return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
};

// Verificar un token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Token inválido o expirado.');
  }
};
