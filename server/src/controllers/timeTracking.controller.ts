import { injectable, inject } from "inversify";
import { Request, Response } from "express";
import TYPES from "../di/types";
import { TimeTrackingService } from "../services/timeTracking.service";
import { HttpStatus } from "../utils/httpStatus";
import { successResponse, errorResponse } from "../types/types";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";
import { apiLogger } from "../utils/logger";

/**
 * Controller for handling time tracking functionality
 * *    1. Log time spent by user on a course
 * *    2. Get total time spent by user on a course
 */
@injectable()
export class TimeTrackingController {
  constructor(
    @inject(TYPES.ITimeTrackingService) private service: TimeTrackingService
  ) {}

  /**
   * This method logs the time spent by a user on a course
   * @param req userId, courseId, chapterId, timeSpentSeconds
   * @param res 
   */
  async logTimeSpent(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId, chapterId, timeSpentSeconds } = req.body;
      await this.service.logTimeSpent(userId, courseId, chapterId, timeSpentSeconds);
      apiLogger.info("Time logged", { userId, courseId, chapterId });
      res.status(HttpStatus.OK).json(successResponse("Time logged successfully"));
    } catch (error) {
      const err = error as Error;
      apiLogger.error("Failed to log time", { error: err.message });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to log time", err.message));
    }
  }

  /**
   * This method retrieves the total time spent by a user on a course
   * @param req userId, courseId
   * @param res 
   */
  async getTotalTimeSpent(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { courseId } = req.query;
      const totalSeconds = await this.service.getTotalTimeSpent(userId, courseId as string);
      apiLogger.info("Time retrieved", { userId, courseId });
      res.status(HttpStatus.OK).json(successResponse("Time retrieved", { totalSeconds }));
    } catch (error) {
      const err = error as Error;
      apiLogger.error("Failed to retrieve time", { error: err.message });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to retrieve time", err.message));
    }
  }
}