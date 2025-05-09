import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { Request, Response } from "express";
import { IChatService } from "../interfaces/chat.service";
import { HttpStatus } from "../utils/httpStatus";
import { errorResponse, successResponse } from "../types/types";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";

/**
 * Controller for handling chat functionality
 */
@injectable()
export class ChatController {
  constructor(
    @inject(TYPES.IChatService) private _chatService: IChatService
  ) {}

  /**
   * This methods handles chat history of user with teacher 
   * @param req request object
   * @param res response object
   * @returns 
   */
  async getChatHistory(req: Request, res: Response): Promise<void> {
    const { courseId, senderId, receiverId } = req.query;

    if (!courseId || !senderId || !receiverId) {
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.CHAT.MISSING_QUERY_PARAMS));
      return;
    }

    try {
      const messages = await this._chatService.getChatHistory(
        courseId as string,
        senderId as string,
        receiverId as string
      );
      res.json(successResponse(RESPONSE_MESSAGES.CHAT.CHAT_HISTORY_SUCCESS, messages));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.CHAT.CHAT_HISTORY_ERROR, err));
    }
  }
}