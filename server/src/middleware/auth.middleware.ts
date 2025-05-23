import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import redisClient from "../config/redis";
import { AuthenticatedRequest, UserRole } from "../types/types";


/**
 * This middleware function authenticates the user by verifying the JWT token.
 * It checks if the token is present in the request cookies and verifies it using the secret key.
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // const authHeader = req.headers["authorization"];
  // const token = authHeader && authHeader.split(" ")[1]; 
  const token = req.cookies?.accessToken;

  if (!token) {
    return next(new Error("No token provided"))
  }

  try {

    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted === "true") {
      return next(new Error("Token is blacklisted"));
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "tom") as {
      userId: string;
      userType: string;
    };
    req.user = { userId: decoded.userId, userType: decoded.userType as UserRole };
    next();
  } catch (error) {

    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error("Token expired"));
    }
    return next(new Error("Invalid token"));
  }
};

/**
 * This middleware function authorizes the user based on their role.
 * It checks if the user has the required role to access the requested resource.
 * @param allowedRoles 
 * @returns 
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction):void => {
    if (!req.user) {
      return next(new Error("Not authenticated"));
    }

    const { userType } = req.user;
    if (!allowedRoles.includes(userType)) {
      return next(new Error("Forbidden: Insufficient permissions"));
    }

    next();
  };
};