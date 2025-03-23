import { IMessage } from "../models/chat.model";

export interface IChatRepository {
  findMessagesByCourseAndUsers(courseId: string, senderId: string, receiverId: string): Promise<IMessage[]>;
  createMessage(message: IMessage): Promise<IMessage>;
}
