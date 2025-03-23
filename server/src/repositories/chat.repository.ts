import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { IChatRepository } from "../interfaces/chat.repository";
import Message, { IMessage } from "../models/chat.model";
import { Model } from "mongoose";

@injectable()
export class ChatRepository implements IChatRepository {
  constructor(
    @inject(TYPES.MessageModel) private _messageModel: Model<IMessage>
  ) {}

  async findMessagesByCourseAndUsers(courseId: string, senderId: string, receiverId: string): Promise<IMessage[]> {
    return this._messageModel
      .find({
        courseId,
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      })
      .sort({ timestamp: 1 })
      .exec();
  }

  async createMessage(message: Partial<IMessage>): Promise<IMessage> {
    return this._messageModel.create(message);
  }
}