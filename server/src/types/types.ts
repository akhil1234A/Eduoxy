import { Request } from "express";
import { IUser } from "../models/user.model";
import { ICourseDocument } from "../models/course.model";

export enum UserRole {
  ADMIN = "admin",
  STUDENT = "student",
  TEACHER = "teacher"
}

export enum CourseLevel {
  Beginner = "Beginner",
  Intermediate = "Intermediate",
  Advanced = "Advanced",
}

export enum CourseStatus {
  Draft = "Draft",
  Published = "Published",
  Unlisted = "Unlisted",
}

export enum ChapterType {
  Text = "Text",
  Quiz = "Quiz",
  Video = "Video",
  PDF = "PDF",
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    userType: UserRole;
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
  userType: UserRole
  isVerified: boolean;
}

export interface AuthTokens{
  accessToken: string;
  refreshToken: string; 
}

export interface LoginUser {
  id?: string;
  email: string;
  userType: UserRole
  name?: string; 
  isVerified?: boolean; 
}
export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: LoginUser;
  needsVerification?:boolean;
}

export interface CourseCreationInput {
  teacherId: string;
  teacherName: string;
}

export interface IInitialCoursesResponse {
  courses: ICourseDocument[];
  total: number;
}
