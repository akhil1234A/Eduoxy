import { Request, Response, NextFunction } from "express";
import { apiLogger } from "../utils/logger";

export const logErrors = (err: any, req: Request, res: Response, next: NextFunction) => {
  apiLogger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    user: {
      id: req.cookies?.userId || "unknown",
      role: req.cookies?.userType || "guest",
    },
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  next(err);
};