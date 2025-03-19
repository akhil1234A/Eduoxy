import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { IUserCourseProgressService } from "../interfaces/courseProgress.service";
import { Request, Response } from "express";
import { successResponse, errorResponse } from "../types/types";
import { HttpStatus } from "../utils/httpStatus";

@injectable()
export class UserCourseProgressController {
  constructor(
    @inject(TYPES.IUserCourseProgressService) private _userCourseProgressService: IUserCourseProgressService
  ) {}

  async getUserEnrolledCourses(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const enrolledCourses = await this._userCourseProgressService.getUserEnrolledCourses(userId);
      res.status(HttpStatus.OK).json(successResponse("Enrolled courses retrieved successfully", enrolledCourses));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error retrieving enrolled courses", err.message));
    }
  }

  async getUserCourseProgress(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;
      const progress = await this._userCourseProgressService.getUserCourseProgress(userId, courseId);
      if (!progress) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse("Course progress not found for this user"));
        return;
      }
      res.status(HttpStatus.OK).json(successResponse("Course progress retrieved successfully", progress));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error retrieving user course progress", err.message));
    }
  }

  async updateUserCourseProgress(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;
      const progressData = req.body;
      const progress = await this._userCourseProgressService.updateUserCourseProgress(userId, courseId, progressData);
      res.status(HttpStatus.OK).json(successResponse("Course progress updated successfully", progress));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error updating user course progress", err.message));
    }
  }
}
