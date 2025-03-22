import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { Request, Response } from "express";
import { IDashboardService } from "../interfaces/dashboard.service";
import { HttpStatus } from "../utils/httpStatus";
import { errorResponse, successResponse } from "../types/types";

@injectable()
export class DashboardController {
  constructor(
    @inject(TYPES.IDashboardService) private _dashboardService: IDashboardService
  ) {}

  async getAdminDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboard = await this._dashboardService.getAdminDashboard();
      res.json(successResponse("Admin dashboard retrieved successfully", dashboard));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error retrieving admin dashboard", err));
    }
  }

  async getTeacherDashboard(req: Request, res: Response): Promise<void> {
    const { teacherId } = req.params;
    if (!teacherId) {
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse("Teacher ID is required"));
      return;
    }
    try {
      const dashboard = await this._dashboardService.getTeacherDashboard(teacherId);
      res.json(successResponse("Teacher dashboard retrieved successfully", dashboard));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error retrieving teacher dashboard", err));
    }
  }
}