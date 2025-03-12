import { Request, Response } from "express";
import { IAdminService } from "../interfaces/admin.service";
import { successResponse, errorResponse } from "../types/types";
import { HttpStatus } from "../utils/httpStatus";
import { injectable, inject } from "inversify";
import TYPES from "../di/types";
export class AdminController {
  constructor(@inject(TYPES.IAdminService) private adminService: IAdminService) {}

  async listStudents(req: Request, res: Response): Promise<void> {
    try {
      const students = await this.adminService.listStudents();
      res.json(successResponse("Students retrieved successfully", students));
    } catch (error) {
      const err = error as Error
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to list students", err.message));
    }
  }

  async listTeachers(req: Request, res: Response): Promise<void> {
    try {
      const teachers = await this.adminService.listTeachers();
      res.json(successResponse("Teachers retrieved successfully", teachers));
    } catch (error) {
      const err = error as Error; 
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to list teachers", err.message));
    }
  }

  async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const updatedUser = await this.adminService.blockUser(userId);
      res.json(successResponse("User blocked successfully", updatedUser));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse("Failed to block user", err.message));
    }
  }

  async unblockUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const updatedUser = await this.adminService.unblockUser(userId);
      res.json(successResponse("User unblocked successfully", updatedUser));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse("Failed to unblock user", err.message));
    }
  }
}