import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../types/types";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error:", err.message);

  switch (err.message) {
    case "No token provided":
      res.status(401).json(errorResponse("Authentication failed", err.message));
      break;
    case "Token expired":
      res.status(401).json(errorResponse("Token has expired", err.message));
      break;
    case "Invalid token":
      res.status(403).json(errorResponse("Invalid token provided", err.message));
      break;
    case "Not authenticated":
      res.status(401).json(errorResponse("User not authenticated", err.message));
      break;
    case "Forbidden: Insufficient permissions":
      res.status(403).json(errorResponse("Insufficient permissions", err.message));
      break;
    default:
      res.status(500).json(errorResponse("Internal server error", err.message));
      break;
  }
};