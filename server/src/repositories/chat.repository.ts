import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { IChatRepository } from "../interfaces/chat.repository";
import Message, { IMessage } from "../models/chat.model";
import { Model } from "mongoose";
import { BaseRepository } from "./base.repository";

/**
 * ChatRepository class is responsible for interacting with the Message model.
 * It provides methods to create and find messages in the database.
 */
@injectable()
export class ChatRepository extends BaseRepository<IMessage> implements IChatRepository {
  constructor(
    @inject(TYPES.MessageModel) private _messageModel: Model<IMessage>
  ) {
    super(_messageModel);
  }

  /**
   * Finds messages by course ID and user IDs.
   * This method retrieves messages exchanged between teacher and student.
   * @param courseId 
   * @param senderId 
   * @param receiverId 
   * @returns IMessage[] list of messsages
   */
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

  /**
   * This method to create a new message in the database.
   * It takes a Partial<IMessage> object as input and returns the created IMessage object.
   * @param message - The message data to be created.
   * @returns 
   */
  async createMessage(message: Partial<IMessage>): Promise<IMessage> {
    return this._messageModel.create(message);
  }
}