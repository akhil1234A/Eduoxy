import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logger";

export const logErrors = (err: any, req: Request, res: Response, next: NextFunction) => {
  logError(err, req);
  next(err);
};