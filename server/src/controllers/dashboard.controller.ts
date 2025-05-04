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

  private parseQueryParams(req: Request): {
    page: number;
    limit: number;
    dateFilter?: { type: "day" | "week" | "month" | "custom"; startDate?: string; endDate?: string };
    tableDateFilter?: { type: "day" | "week" | "month" | "custom"; startDate?: string; endDate?: string };
  } {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const dateFilterType = req.query.dateFilterType as
      | "day"
      | "week"
      | "month"
      | "custom"
      | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const tableDateFilterType = req.query.tableDateFilterType as
      | "day"
      | "week"
      | "month"
      | "custom"
      | undefined;
    const tableStartDate = req.query.tableStartDate as string | undefined;
    const tableEndDate = req.query.tableEndDate as string | undefined;

    let dateFilter;
    if (dateFilterType) {
      dateFilter = {
        type: dateFilterType,
        startDate,
        endDate,
      };
    }

    let tableDateFilter;
    if (tableDateFilterType) {
      tableDateFilter = {
        type: tableDateFilterType,
        startDate: tableStartDate,
        endDate: tableEndDate,
      };
    }

    return { page, limit, dateFilter, tableDateFilter };
  }

  private async handleDashboardResponse<T>(
    res: Response,
    successMessage: string,
    errorMessage: string,
    fetchData: () => Promise<T>
  ): Promise<void> {
    try {
      const data = await fetchData();
      res.json(successResponse(successMessage, data));
    } catch (error) {
      const err = error as Error;
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(errorResponse(errorMessage, err.message));
    }
  }

  async getAdminDashboard(req: Request, res: Response): Promise<void> {
    const { page, limit, dateFilter, tableDateFilter } = this.parseQueryParams(req);
    await this.handleDashboardResponse(
      res,
      RESPONSE_MESSAGES.DASHBOARD.ADMIN_SUCCESS,
      RESPONSE_MESSAGES.DASHBOARD.ADMIN_ERROR,
      () => this._dashboardService.getAdminDashboard(page, limit, dateFilter, tableDateFilter)
    );
  }

  async getTeacherDashboard(req: Request, res: Response): Promise<void> {
    const { teacherId } = req.params;
    if (!teacherId) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          errorResponse(
            RESPONSE_MESSAGES.DASHBOARD.TEACHER_ID_REQUIRED,
            "Teacher ID is required"
          )
        );
      return;
    }

    const { page, limit, dateFilter, tableDateFilter } = this.parseQueryParams(req);
    await this.handleDashboardResponse(
      res,
      RESPONSE_MESSAGES.DASHBOARD.TEACHER_SUCCESS,
      RESPONSE_MESSAGES.DASHBOARD.TEACHER_ERROR,
      () =>
        this._dashboardService.getTeacherDashboard(
          teacherId,
          page,
          limit,
          dateFilter,
          tableDateFilter
        )
    );
  }
}