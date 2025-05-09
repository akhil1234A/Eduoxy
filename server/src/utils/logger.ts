import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";
import { Request, Response } from "express";

// Extend Request to include user property
interface CustomRequest extends Request {
  user?: { userId: string };
}

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
const sanitizeData = (input: unknown, seen = new WeakMap()): unknown => {
  if (!input || typeof input !== "object") return input;

  if (seen.has(input)) return "[Circular]";
  seen.set(input, true);

  if ("_doc" in input && input._doc) return sanitizeData(input._doc, seen);
  if (Array.isArray(input)) return input.map((item) => sanitizeData(item, seen));

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
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
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    const msg = `[${timestamp}] ${level}: ${message}`;
    return Object.keys(metadata).length ? `${msg} ${JSON.stringify(sanitizeData(metadata))}` : msg;
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
export const logRequest = (req: CustomRequest) => {
  apiLogger.info("HTTP Request", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.userId || "anonymous",
    query: sanitizeData(req.query),
  });
};

export const logResponse = (req: CustomRequest, res: Response, duration: number) => {
  apiLogger.info("HTTP Response", {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration_ms: duration,
    userId: req.user?.userId || "anonymous",
  });
};

export const logError = (error: Error, req?: CustomRequest) => {
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