import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// List of sensitive fields to redact
const SENSITIVE_FIELDS = [
  'password',
  'idToken',
  'accessToken',
  'refreshToken',
  'token',
  'authorization',
  'cookie',
  'set-cookie',
  'authorization',
  'x-auth-token',
  'x-access-token',
  'x-refresh-token',
  'x-api-key',
  'api-key',
  'secret',
  'privateKey',
  'creditCard',
  'cvv',
  'ssn',
  'socialSecurityNumber',
  'bankAccount',
  'routingNumber',
];

// Helper function to sanitize sensitive data
const sanitizeData = (data: any, seen = new WeakMap()): any => {
  if (!data || typeof data !== 'object') return data;

  // Handle circular references
  if (seen.has(data)) {
    return '[Circular Reference]';
  }

  // Handle Mongoose documents
  if (data._doc) {
    seen.set(data, true);
    return sanitizeData(data._doc, seen);
  }

  if (Array.isArray(data)) {
    seen.set(data, true);
    return data.map(item => sanitizeData(item, seen));
  }

  seen.set(data, true);
  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    // Skip Mongoose internal properties
    if (key.startsWith('$') || key === '__v' || key === '_id') {
      continue;
    }
    
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value, seen);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    // Handle cases where message might be an object
    const messageStr = typeof message === 'object' ? JSON.stringify(sanitizeData(message)) : message;
    let msg = `[${timestamp}] ${level}: ${messageStr}`;
    
    // Only add metadata if it's not empty and not already part of the message
    if (Object.keys(metadata).length > 0 && typeof message !== 'object') {
      const metaString = JSON.stringify(sanitizeData(metadata), null, 2);
      msg += `\n${metaString}`;
    }
    return msg;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.json()
);

export const apiLogger = winston.createLogger({
  format: fileFormat,
  transports: [
    new winston.transports.Console({
      level: "debug",
      format: consoleFormat,
    }),
    new DailyRotateFile({
      filename: path.join(logDir, "api-info-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "10m",
      maxFiles: "7d",
      zippedArchive: true,
      level: "info",
      format: fileFormat,
    }),
    new DailyRotateFile({
      filename: path.join(logDir, "api-error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "10m",
      maxFiles: "7d",
      zippedArchive: true,
      level: "error",
      format: fileFormat,
    }),
  ],
});

// Helper methods for structured logging
export const logRequest = (req: any) => {
  // Sanitize headers
  const sanitizedHeaders = { ...req.headers };
  SENSITIVE_FIELDS.forEach(field => {
    if (sanitizedHeaders[field]) {
      sanitizedHeaders[field] = '[REDACTED]';
    }
  });

  apiLogger.info("Incoming Request", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    userId: req.user?.userId || "anonymous",
    userName: req.user?.userName || "anonymous",
    userType: req.user?.userType || "anonymous",
    body: sanitizeData(req.body),
    query: sanitizeData(req.query),
    headers: sanitizedHeaders,
  });
};

export const logResponse = (req: any, res: any, duration: number) => {
  // Sanitize response headers
  const sanitizedHeaders = { ...res.getHeaders() };
  SENSITIVE_FIELDS.forEach(field => {
    if (sanitizedHeaders[field]) {
      sanitizedHeaders[field] = '[REDACTED]';
    }
  });

  apiLogger.info("Request Completed", {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userId: req.user?.userId || "anonymous",
    userName: req.user?.userName || "anonymous",
    userType: req.user?.userType || "anonymous",
    responseHeaders: sanitizedHeaders,
  });
};

export const logError = (error: any, req?: any) => {
  apiLogger.error("Error Occurred", {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    request: req ? {
      method: req.method,
      url: req.url,
      userId: req.user?.userId || "anonymous",
      userName: req.user?.userName || "anonymous",
      userType: req.user?.userType || "anonymous",
    } : undefined,
  });
};