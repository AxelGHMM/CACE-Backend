import winston from "winston";
import path from "path";

// 🔹 Configuración de niveles de log
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
  },
};

winston.addColors(customLevels.colors);

// 🔹 Formato de logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// 🔹 Configuración de Winston con múltiples archivos de salida
const logger = winston.createLogger({
  levels: customLevels.levels,
  format: logFormat,
  transports: [
    // Consola para todos los niveles
    new winston.transports.Console({ level: "debug" }),

    // Archivo para logs generales de la app
    new winston.transports.File({ filename: path.join("logs", "app.log"), level: "info" }),

    // Archivo exclusivo para errores
    new winston.transports.File({ filename: path.join("logs", "error.log"), level: "error" }),

    // Archivo para peticiones HTTP
    new winston.transports.File({ filename: path.join("logs", "http.log"), level: "http" }),

    // Archivo específico para la API activa y pings
    new winston.transports.File({ filename: path.join("logs", "health.log"), level: "info" }),
  ],
});

export default logger;
