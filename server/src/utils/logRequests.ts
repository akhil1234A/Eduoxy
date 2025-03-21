import { Request, Response, NextFunction } from "express";
import { apiLogger } from "./logger";

export const logRequests = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    apiLogger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      user: {
        id: req.cookies?.userId || "unknown",
        role: req.cookies?.userType || "guest",
      },
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  });

  next();
};