import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { IUserCourseProgressService } from "../interfaces/courseProgress.service";
import { Request, Response } from "express";
import { successResponse, errorResponse } from "../types/types";
import { HttpStatus } from "../utils/httpStatus";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";
import { buildPaginationResult, getPaginationParams } from "../utils/paginationUtil";

/**
 * Controller for handling user course progress
 */

@injectable()
export class UserCourseProgressController {
  constructor(
    @inject(TYPES.IUserCourseProgressService) private _userCourseProgressService: IUserCourseProgressService
  ) {}

/**
 * This method gets all enrolled courses for a user with pagination
 * @param req userId, page, limit
 * @param res 
 */
  async getUserEnrolledCourses(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const params = getPaginationParams(req);
  

      const { courses, total } = await this._userCourseProgressService.getUserEnrolledCourses(
        userId,
        params.page,
        params.limit,
      );

      const paginationn = buildPaginationResult(params, total);
  
      res.status(HttpStatus.OK).json(
        successResponse(RESPONSE_MESSAGES.USER_COURSE_PROGRESS.ENROLLED_COURSES_SUCCESS, {
          courses,
          total: paginationn.total,
          page: paginationn,
          limit: paginationn.limit,
          totalPages: paginationn.totalPages,
        })
      );
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        errorResponse(RESPONSE_MESSAGES.USER_COURSE_PROGRESS.ENROLLED_COURSES_ERROR, err.message)
      );
    }
  }

  /**
   * This is a method to get user course progress for a specific course
   * @param req userId, courseId
   * @param res 
   * @returns 
   */
  async getUserCourseProgress(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;
      const progress = await this._userCourseProgressService.getUserCourseProgress(userId, courseId);
      if (!progress) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse(RESPONSE_MESSAGES.USER_COURSE_PROGRESS.PROGRESS_NOT_FOUND));
        return;
      }
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.USER_COURSE_PROGRESS.PROGRESS_RETRIEVE_SUCCESS, progress));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.USER_COURSE_PROGRESS.PROGRESS_RETRIEVE_ERROR, err.message));
    }
  }

  /**
   * This method updates user course progress for a specific course
   * @param req userId, courseId, progressData
   * @param res 
   */

  async updateUserCourseProgress(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;
      const progressData = req.body;
      const progress = await this._userCourseProgressService.updateUserCourseProgress(userId, courseId, progressData);
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.USER_COURSE_PROGRESS.PROGRESS_UPDATE_SUCCESS, progress));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.USER_COURSE_PROGRESS.PROGRESS_UPDATE_ERROR, err.message));
    }
  }
}
