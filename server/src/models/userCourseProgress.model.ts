import mongoose from "mongoose";

export interface IUserCourseProgress {
  userId: string;
  courseId: string;
  enrollmentDate: string;
  overallProgress: number;
  sections: {
    sectionId: string;
    chapters: {
      chapterId: string;
      completed: boolean;
    }[];
  }[];
  lastAccessedTimestamp: string;
}

const userCourseProgressSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    courseId: { type: String, required: true },
    enrollmentDate: { type: String, required: true },
    overallProgress: { type: Number, required: true },
    sections: [
      {
        sectionId: { type: String, required: true },
        chapters: [
          {
            chapterId: { type: String, required: true },
            completed: { type: Boolean, required: true },
          },
        ],
      },
    ],
    lastAccessedTimestamp: { type: String, required: true },
  },
  { timestamps: true } 
);

// Create a unique compound index on userId and courseId
userCourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const UserCourseProgress = mongoose.model("UserCourseProgress", userCourseProgressSchema);