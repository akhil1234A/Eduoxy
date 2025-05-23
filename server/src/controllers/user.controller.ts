import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { Request, Response } from "express";
import { IUserService } from "../interfaces/user.service";
import { HttpStatus } from "../utils/httpStatus";
import { errorResponse, successResponse } from "../types/types";
import { IUser } from "../models/user.model";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";
import { MapperUtil } from "../utils/mapper.util";

/**
 * Controller for handling user management
 */
@injectable()
export class UserController {
  constructor(
    @inject(TYPES.IUserService) private _userService: IUserService,
    @inject(TYPES.MapperUtil) private _mapperUtil: MapperUtil
  ) {}

  /**
   * This method handles update password
   * @param req userId, currentPassword, newPassword
   * @param res 
   * @returns 
   */
  async updatePassword(req: Request, res: Response): Promise<void> {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.USER.MISSING_FIELDS));
      return;
    }

    try {
      await this._userService.updatePassword(userId, currentPassword, newPassword);
      res.json(successResponse(RESPONSE_MESSAGES.USER.UPDATE_PASSWORD_SUCCESS));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.USER.UPDATE_PASSWORD_FAIL, err.message));
    }
  }

  /**
   * This mehod handles update instructor profile
   * @param req userId, name, title, bio, profileImage
   * @param res 
   * @returns 
   */
  async updateInstructorProfile(req: Request, res: Response): Promise<void> {
    
    const { userId, name, title, bio } = req.body;
    const profileImage = req.file;
    
    if (!userId) {
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.USER.MISSING_FIELDS));
      return;
    }

    try {
      const updatedUser = await this._userService.updateInstructorProfile(userId, name, title, bio, profileImage);
      res.json(successResponse(RESPONSE_MESSAGES.USER.UPDATE_PROFILE_SUCCESS, updatedUser as IUser));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.USER.UPDATE_PROFILE_FAIL, err.message));
    }
  }

  /**
   * This method handles get instructor profile
   * @param req userId
   * @param res 
   * @returns 
   */
  async getProfile(req: Request, res: Response): Promise<void>{
    const userId = req.query.userId as string;

    if(!userId || typeof userId !== "string"){
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.USER.MISSING_FIELDS));
      return;
    }

    try{
     const user = await this._userService.getProfile(userId);
     const userResponse = await this._mapperUtil.toProfileResponse(user);
     res.json(successResponse(RESPONSE_MESSAGES.USER.GET_PROFILE_SUCCESS, userResponse));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.USER.GET_PROFILE_FAIL, err.message));
    }
  }
}