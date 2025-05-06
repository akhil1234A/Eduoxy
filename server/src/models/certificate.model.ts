import mongoose, { Schema, Document } from "mongoose";

export interface ICertificate extends Document {
  userId: string;
  courseId: string;
  courseName: string;
  certificateUrl: string;
  issuedAt: Date;
  certificateId: string;
}

const certificateSchema = new Schema<ICertificate>(
  {
    userId: { type: String, required: true },
    courseId: { type: String, required: true },
    courseName: { type: String, required: true },
    certificateUrl: { type: String, required: true },
    issuedAt: { type: Date, required: true },
    certificateId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Certificate = mongoose.model<ICertificate>("Certificate", certificateSchema);