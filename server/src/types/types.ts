import { Request } from "express";
import { IUser } from "../models/user.model";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    userType: string;
  }
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | object;
}

export const successResponse = <T>(message: string, data?: T): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

export const errorResponse = (message: string, error?: string | object): ApiResponse<never> => ({
  success: false,
  message,
  error,
});

export interface UserResponse {
  id: string
  name: string;
  email: string;
  userType: "student" | "admin" | "teacher";
  isVerified: boolean;
}

export interface AuthTokens{
  accessToken: string;
  refreshToken: string; 
}

export interface LoginUser {
  id?: string;
  email: string;
  userType: "student" | "admin" | "teacher";
  name?: string; 
  isVerified?: boolean; 
}
export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: LoginUser;
  needsVerification?:boolean;
}