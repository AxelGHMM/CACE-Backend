import winston from "winston";
import path from "path";

// Configuración de niveles de log
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

// Configuración del formato de logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Configuración de Winston
const logger = winston.createLogger({
  levels: customLevels.levels,
  format: logFormat,
  transports: [
    new winston.transports.Console({ level: "debug" }),
    new winston.transports.File({ filename: path.join("logs", "error.log"), level: "error" }),
    new winston.transports.File({ filename: path.join("logs", "combined.log"), level: "info" }),
  ],
});

export default logger;
