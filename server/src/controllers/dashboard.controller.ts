import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { Request, Response } from "express";
import { IDashboardService } from "../interfaces/dashboard.service";
import { HttpStatus } from "../utils/httpStatus";
import { errorResponse, successResponse } from "../types/types";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";

@injectable()
export class DashboardController {
  constructor(
    @inject(TYPES.IDashboardService) private _dashboardService: IDashboardService
  ) {}

  async getAdminDashboard(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const dateFilterType = req.query.dateFilterType as 'week' | 'month' | 'custom' | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      
      let dateFilter;
      if (dateFilterType) {
        dateFilter = {
          type: dateFilterType,
          startDate,
          endDate
        };
      }
      
      const dashboard = await this._dashboardService.getAdminDashboard(page, limit, dateFilter);
      res.json(successResponse(RESPONSE_MESSAGES.DASHBOARD.ADMIN_SUCCESS, dashboard));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.DASHBOARD.ADMIN_ERROR, err));
    }
  }

  async getTeacherDashboard(req: Request, res: Response): Promise<void> {
    const { teacherId } = req.params;
    if (!teacherId) {
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.DASHBOARD.TEACHER_ID_REQUIRED));
      return;
    }
    
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const dateFilterType = req.query.dateFilterType as 'week' | 'month' | 'custom' | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      
      let dateFilter;
      if (dateFilterType) {
        dateFilter = {
          type: dateFilterType,
          startDate,
          endDate
        };
      }
      
      const dashboard = await this._dashboardService.getTeacherDashboard(teacherId, page, limit, dateFilter);
      res.json(successResponse(RESPONSE_MESSAGES.DASHBOARD.TEACHER_SUCCESS, dashboard));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.DASHBOARD.TEACHER_ERROR, err));
    }
  }
}