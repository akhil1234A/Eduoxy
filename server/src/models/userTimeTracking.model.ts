import mongoose, { Schema, Document } from "mongoose";

export interface IUserTimeTracking extends Document {
  userId: string;
  courseId: string;
  chapterId: string;
  timeSpentSeconds: number;
  lastUpdated: Date;
}

const userTimeTrackingSchema = new Schema<IUserTimeTracking>(
  {
    userId: { type: String, required: true },
    courseId: { type: String, required: true },
    chapterId: { type: String, required: true },
    timeSpentSeconds: { type: Number, required: true, default: 0 },
    lastUpdated: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

userTimeTrackingSchema.index({ userId: 1, courseId: 1, chapterId: 1 }, { unique: true });

export const UserTimeTracking = mongoose.model<IUserTimeTracking>("UserTimeTracking", userTimeTrackingSchema);