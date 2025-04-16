import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { IUserCourseProgressService } from "../interfaces/courseProgress.service";
import { Request, Response } from "express";
import { successResponse, errorResponse } from "../types/types";
import { HttpStatus } from "../utils/httpStatus";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";

@injectable()
export class UserCourseProgressController {
  constructor(
    @inject(TYPES.IUserCourseProgressService) private _userCourseProgressService: IUserCourseProgressService
  ) {}

  async getUserEnrolledCourses(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const enrolledCourses = await this._userCourseProgressService.getUserEnrolledCourses(userId);
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.USER_COURSE_PROGRESS.ENROLLED_COURSES_SUCCESS, enrolledCourses));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.USER_COURSE_PROGRESS.ENROLLED_COURSES_ERROR, err.message));
    }
  }

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
