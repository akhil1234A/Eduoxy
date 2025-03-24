import mongoose, { Document } from "mongoose";
import { CourseLevel, ChapterType, CourseStatus } from "../types/types";


export interface ICourse {
  courseId: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description?: string;
  category: string;
  image?: string;
  price?: number;
  level: CourseLevel; 
  status: CourseStatus; 
  sections: {
    sectionId: string;
    sectionTitle: string;
    sectionDescription?: string;
    chapters: {
      chapterId: string;
      type: ChapterType; 
      title: string;
      content: string;
      comments: {
        commentId: string;
        userId: string;
        text: string;
        timestamp: string;
      }[];
      video?: string;
      pdf?: string;
      subtitle?: string;
    }[];
  }[];
  enrollments: {
    userId: string;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICourseDocument extends ICourse, Document {}

const commentSchema = new mongoose.Schema({
  commentId: { type: String, required: true },
  userId: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true },
});

const chapterSchema = new mongoose.Schema({
  chapterId: { type: String, required: true },
  type: { type: String, enum: Object.values(ChapterType), required: true }, 
  title: { type: String, required: true },
  content: { type: String, required: true },
  comments: [commentSchema],
  video: { type: String },
  pdf: { type: String },
  subtitle: { type: String },
});

const sectionSchema = new mongoose.Schema({
  sectionId: { type: String, required: true },
  sectionTitle: { type: String, required: true },
  sectionDescription: { type: String },
  chapters: [chapterSchema],
});

const enrollmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
});

const courseSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true, unique: true },
    teacherId: { type: String, required: true },
    teacherName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    image: { type: String },
    price: { type: Number },
    level: { type: String, enum: Object.values(CourseLevel), required: true }, 
    status: { type: String, enum: Object.values(CourseStatus), required: true }, 
    sections: [sectionSchema],
    enrollments: [enrollmentSchema],
  },
  { timestamps: true }
);

const Course = mongoose.model<ICourseDocument>("Course", courseSchema);
export default Course;