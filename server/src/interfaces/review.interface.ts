import { Document } from "mongoose";

export interface IReview {
  userId: string;
  courseId: string;
  userName: string;
  rating: number;
  review: string;
}

export interface IReviewDocument extends IReview, Document {
  createdAt: Date;
  updatedAt: Date;
} 