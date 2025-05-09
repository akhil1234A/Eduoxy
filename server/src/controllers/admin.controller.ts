import { Request, Response } from "express";
import { IAdminService } from "../interfaces/admin.service";
import { successResponse, errorResponse } from "../types/types";
import { HttpStatus } from "../utils/httpStatus";
import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";
import { buildPaginationResult, getPaginationParams } from "../utils/paginationUtil";

/**
 * Controller for handling admin management
 */
@injectable()
export class AdminController {
  constructor(@inject(TYPES.IAdminService) private _adminService: IAdminService) {}

  /**
   * Lists students with pagination and search functionality 
   * @param req request object
   * @param res response object 
   * @return list of students
   */
  async listStudents(req: Request, res: Response): Promise<void> {
    try {
      
      const params = getPaginationParams(req);
      const { users, total } = await this._adminService.listStudents(params.page, params.limit, params.searchTerm);
      const result = buildPaginationResult(params, total);

      res.json(
        successResponse(RESPONSE_MESSAGES.ADMIN_MANAGEMENT.STUDENT_LISTED_SUCCESS, {
          users,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        })
      );
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.ADMIN_MANAGEMENT.STUDENT_LISTED_ERROR, err.message));
    }
  }

  /**
   * list teachers with pagination and search 
   * @param req request object
   * @param res response object
   * @return list of teachers
   */
  
  async listTeachers(req: Request, res: Response): Promise<void> {
    try {
      const params = getPaginationParams(req);
      const { users, total } = await this._adminService.listTeachers(params.page, params.limit, params.searchTerm);
      const result = buildPaginationResult(params, total);

      res.json(
        successResponse(RESPONSE_MESSAGES.ADMIN_MANAGEMENT.TEACHER_LISTED_SUCCESS, {
          users,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        })
      );
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.ADMIN_MANAGEMENT.TEACHER_LISTED_ERROR, err.message));
    }
  }

  /**
   * Block a user by userId
   * @param req request object
   * @param res response object
   */
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


  /**
   * Unblock a user by userId
   * @param req request object
   * @param res response object
   */
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