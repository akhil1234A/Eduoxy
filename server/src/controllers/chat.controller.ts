import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { Request, Response } from "express";
import { IChatService } from "../interfaces/chat.service";
import { HttpStatus } from "../utils/httpStatus";
import { errorResponse, successResponse } from "../types/types";

@injectable()
export class ChatController {
  constructor(
    @inject(TYPES.IChatService) private _chatService: IChatService
  ) {}

  async getChatHistory(req: Request, res: Response): Promise<void> {
    const { courseId, senderId, receiverId } = req.query;

    if (!courseId || !senderId || !receiverId) {
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse("Missing required query parameters"));
      return;
    }

    try {
      const messages = await this._chatService.getChatHistory(
        courseId as string,
        senderId as string,
        receiverId as string
      );
      res.json(successResponse("Chat history retrieved successfully", messages));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error retrieving chat history", err));
    }
  }
}