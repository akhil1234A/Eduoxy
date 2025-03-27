import { Schema, model, Document } from "mongoose";

export interface IMessage extends Document {
  courseId: string;
  senderId: string; 
  receiverId: string; 
  message: string;
  timestamp: string;
  isRead: boolean;
  isFile?: boolean;
  fileName?: string;
}

export interface IMessageInput {
  courseId: string;
  senderId: string; 
  receiverId: string; 
  message: string;
  timestamp: string;
  isRead: boolean;
  isFile?: boolean;
  fileName?: string;
}

const messageSchema = new Schema<IMessage>({
  courseId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: String, default: () => new Date().toISOString() },
  isRead: { type: Boolean, default: false },
  isFile: { type: Boolean, default: false },
  fileName: { type: String, default: null },
});

export default model<IMessage>("Message", messageSchema);