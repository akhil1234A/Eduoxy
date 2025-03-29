import mongoose, { Schema, Document } from "mongoose";

export interface ILiveClass extends Document {
  courseId: string;
  teacherId: string;
  title: string;
  startTime: string; 
  endTime: string; 
  participants: string[]; 
  isActive: boolean; 
}

const LiveClassSchema: Schema = new Schema(
  {
    courseId: { type: String, required: true },
    teacherId: { type: String, required: true },
    title: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    participants: [{ type: String }],
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ILiveClass>("LiveClass", LiveClassSchema);