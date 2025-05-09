import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { ILiveClassService } from "../interfaces/liveClass.service";
import { successResponse, errorResponse } from "../types/types";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";
import { HttpStatus } from "../utils/httpStatus";

/**
 * Controller for handling live class functionality
 */
@injectable()
export class LiveClassController {
  constructor(
    @inject(TYPES.ILiveClassService) private liveClassService: ILiveClassService
  ) {}

  /**
   * This method handles the creation of a live class
   * @param req courseId, teacherId, title, startTime, endTime
   * @param res 
   * @returns 
   */
  async createLiveClass(req: Request, res: Response): Promise<void> {
    const { courseId, teacherId, title, startTime, endTime } = req.body;
    try {
      const liveClass = await this.liveClassService.createLiveClass(courseId, teacherId, title, startTime, endTime);
      res.status(HttpStatus.CREATED).json(successResponse(RESPONSE_MESSAGES.LIVE_CLASS.CREATE_SUCCESS, liveClass));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.LIVE_CLASS.CREATE_FAIL, err.message));
    }
  }

  /**
   * This method retrieves the schedule of live classes for a specific course
   * @param req courseId
   * @param res 
   */
  async getSchedule(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;
    try {
      const schedule = await this.liveClassService.getSchedule(courseId);
      res.json(successResponse(RESPONSE_MESSAGES.LIVE_CLASS.SCHEDULE_SUCCESS, schedule));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.LIVE_CLASS.SCHEDULE_FAIL, err.message));
    }
  }

  /**
   * This method allows a user to join a live class
   * @param req liveClassId, userId
   * @param res 
   */
  async joinLiveClass(req: Request, res: Response): Promise<void> {
    const { liveClassId } = req.params;
    const { userId } = req.body; 
    try {
      const liveClass = await this.liveClassService.joinLiveClass(liveClassId, userId);
      res.json(successResponse(RESPONSE_MESSAGES.LIVE_CLASS.JOIN_SUCCESS, liveClass));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.LIVE_CLASS.JOIN_FAIL, err.message));
    }
  }

  /**
   * This method allows a user to leave a live class
   * @param req liveClassId, userId
   * @param res 
   */
  async leaveLiveClass(req: Request, res: Response): Promise<void> {
    const { liveClassId } = req.params;
    const { userId } = req.body;
    try {
      const liveClass = await this.liveClassService.leaveLiveClass(liveClassId, userId);
      res.json(successResponse(RESPONSE_MESSAGES.LIVE_CLASS.LEAVE_SUCCESS, liveClass));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.LIVE_CLASS.LEAVE_FAIL, err.message));
    }
  }

  /**
   * This method allows a teacher to start a live class
   * @param req liveClassId, teacherId
   * @param res 
   */
  async startLiveClass(req: Request, res: Response): Promise<void> {
    const { liveClassId } = req.params;
    const { teacherId } = req.body;
    try {
      const liveClass = await this.liveClassService.startLiveClass(liveClassId, teacherId);
      res.json(successResponse(RESPONSE_MESSAGES.LIVE_CLASS.START_SUCCESS, liveClass));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.LIVE_CLASS.START_FAIL, err.message));
    }
  }
}