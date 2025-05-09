import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logger";

/**
 * Middleware to log errors
 * @param err - Error object
 * @param req - Request object
 * @param res - Response object
 * @param next - Next function to call the next middleware
 */
export const logErrors = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logError(err, req);
  next(err);
};