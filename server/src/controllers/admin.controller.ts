import { Request, Response } from "express";
import { IAdminService } from "../interfaces/admin.service";
import { successResponse, errorResponse } from "../types/types";

export class AdminController {
  constructor(private adminService: IAdminService) {}

  async listStudents(req: Request, res: Response): Promise<void> {
    try {
      const students = await this.adminService.listStudents();
      res.json(successResponse("Students retrieved successfully", students));
    } catch (error: any) {
      res.status(500).json(errorResponse("Failed to list students", error.message));
    }
  }

  async listTeachers(req: Request, res: Response): Promise<void> {
    try {
      const teachers = await this.adminService.listTeachers();
      res.json(successResponse("Teachers retrieved successfully", teachers));
    } catch (error: any) {
      res.status(500).json(errorResponse("Failed to list teachers", error.message));
    }
  }

  async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const updatedUser = await this.adminService.blockUser(userId);
      res.json(successResponse("User blocked successfully", updatedUser));
    } catch (error: any) {
      res.status(400).json(errorResponse("Failed to block user", error.message));
    }
  }

  async unblockUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const updatedUser = await this.adminService.unblockUser(userId);
      res.json(successResponse("User unblocked successfully", updatedUser));
    } catch (error: any) {
      res.status(400).json(errorResponse("Failed to unblock user", error.message));
    }
  }
}