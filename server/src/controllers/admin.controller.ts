import { Request, Response } from "express";
import { IAdminService } from "../interfaces/admin.service";
import { successResponse, errorResponse } from "../types/types";
import { HttpStatus } from "../utils/httpStatus";
import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";
export class AdminController {
  constructor(@inject(TYPES.IAdminService) private _adminService: IAdminService) {}

  async listStudents(req: Request, res: Response): Promise<void> {
    try {
      const { page = "1", limit = "10", q = "" } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const searchTerm = q as string;
  
      const { users, total } = await this._adminService.listStudents(pageNum, limitNum, searchTerm);
      res.json(
        successResponse(RESPONSE_MESSAGES.ADMIN_MANAGEMENT.STUDENT_LISTED_SUCCESS, {
          users,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        })
      );
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.ADMIN_MANAGEMENT.STUDENT_LISTED_ERROR, err.message));
    }
  }
  
  async listTeachers(req: Request, res: Response): Promise<void> {
    try {
      const { page = "1", limit = "10", q = "" } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const searchTerm = q as string;
  
      const { users, total } = await this._adminService.listTeachers(pageNum, limitNum, searchTerm);
      res.json(
        successResponse(RESPONSE_MESSAGES.ADMIN_MANAGEMENT.TEACHER_LISTED_SUCCESS, {
          users,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        })
      );
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.ADMIN_MANAGEMENT.TEACHER_LISTED_ERROR, err.message));
    }
  }

  async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const updatedUser = await this._adminService.blockUser(userId);
      res.json(successResponse(RESPONSE_MESSAGES.ADMIN_MANAGEMENT.USER_BLOCKED_SUCCESS, updatedUser));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.ADMIN_MANAGEMENT.USER_BLOCKED_ERROR, err.message));
    }
  }

  async unblockUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const updatedUser = await this._adminService.unblockUser(userId);
      res.json(successResponse(RESPONSE_MESSAGES.ADMIN_MANAGEMENT.USER_UNBLOCKED_SUCCESS, updatedUser));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.ADMIN_MANAGEMENT.USER_UNBLOCKED_ERROR, err.message));
    }
  }
}