import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Sensitive fields to redact
const SENSITIVE_FIELDS = [
  "password",
  "idToken",
  "accessToken",
  "refreshToken",
  "token",
  "authorization",
  "cookie",
  "set-cookie",
  "x-auth-token",
  "x-access-token",
  "x-refresh-token",
  "x-api-key",
  "api-key",
  "secret",
  "privateKey",
  "creditCard",
  "cvv",
  "ssn",
  "socialSecurityNumber",
  "bankAccount",
  "routingNumber",
];

// Sanitize sensitive data
const sanitizeData = (data: any, seen = new WeakMap()): any => {
  if (!data || typeof data !== "object") return data;

  if (seen.has(data)) return "[Circular]";
  seen.set(data, true);

  if (data._doc) return sanitizeData(data._doc, seen);
  if (Array.isArray(data)) return data.map((item) => sanitizeData(item, seen));

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("$") || key === "__v" || key === "_id") continue;
    sanitized[key] = SENSITIVE_FIELDS.includes(key.toLowerCase())
      ? "[REDACTED]"
      : typeof value === "object" && value !== null
      ? sanitizeData(value, seen)
      : value;
  }
  return sanitized;
};

// Console format: concise and readable
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const msg = `[${timestamp}] ${level}: ${message}`;
    return Object.keys(meta).length ? `${msg} ${JSON.stringify(sanitizeData(meta))}` : msg;
  })
);

// File format: structured JSON for parsing
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json({ replacer: (key, value) => sanitizeData(value) })
);

// Logger instance
export const apiLogger = winston.createLogger({
  level: "info",
  format: fileFormat,
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new DailyRotateFile({
      filename: path.join(logDir, "api-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "10m",
      maxFiles: "14d",
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: path.join(logDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "10m",
      maxFiles: "14d",
      zippedArchive: true,
      level: "error",
    }),
  ],
});

// Structured logging helpers
export const logRequest = (req: any) => {
  apiLogger.info("HTTP Request", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.userId || "anonymous",
    query: sanitizeData(req.query),
  });
};

export const logResponse = (req: any, res: any, duration: number) => {
  apiLogger.info("HTTP Response", {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration_ms: duration,
    userId: req.user?.userId || "anonymous",
  });
};

export const logError = (error: any, req?: any) => {
  apiLogger.error("Error", {
    message: error.message,
    stack: error.stack,
    request: req
      ? {
          method: req.method,
          url: req.url,
          userId: req.user?.userId || "anonymous",
        }
      : undefined,
  });
};