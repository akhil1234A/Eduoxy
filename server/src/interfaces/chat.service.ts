import { IMessage } from "../models/chat.model";

export interface IChatService {
  getChatHistory(courseId: string, userId: string, instructorId: string): Promise<IMessage[]>;
  sendMessage(courseId: string, senderId: string, receiverId: string, message: string, isFile: boolean, fileName?: string): Promise<IMessage>;
}