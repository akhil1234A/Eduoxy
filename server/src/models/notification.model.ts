import mongoose, { Schema } from "mongoose";

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    isRead: { type: Boolean, default: false },
    link: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
); 