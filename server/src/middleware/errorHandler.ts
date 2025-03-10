import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../types/types";
import { HttpStatus } from "../utils/httpStatus";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error:", err.message);

  switch (err.message) {
    case "No token provided":
      res.status(HttpStatus.UNAUTHORIZED).json(errorResponse("Authentication failed", err.message));
      break;
    case "Token expired":
      res.status(HttpStatus.UNAUTHORIZED).json(errorResponse("Token has expired", err.message));
      break;
    case "Invalid token":
      res.status(HttpStatus.FORBIDDEN).json(errorResponse("Invalid token provided", err.message));
      break;
    case "Not authenticated":
      res.status(HttpStatus.UNAUTHORIZED).json(errorResponse("User not authenticated", err.message));
      break;
    case "Forbidden: Insufficient permissions":
      res.status(HttpStatus.FORBIDDEN).json(errorResponse("Insufficient permissions", err.message));
      break;
    default:
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Internal server error", err.message));
      break;
  }
};