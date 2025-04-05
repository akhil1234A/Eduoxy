import { Request, Response, NextFunction } from "express";
import { logRequest, logResponse } from "./logger";

export const logRequests = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log the incoming request
  logRequest(req);

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    // Log the completed request with duration
    logResponse(req, res, duration);
  });

  next();
};