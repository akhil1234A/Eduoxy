import { Schema, model } from "mongoose";
import { IReviewDocument } from "../interfaces/review.interface";

const reviewSchema = new Schema<IReviewDocument>(
  {
    userId: {
      type: String,
      required: true,
    },
    courseId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Review = model<IReviewDocument>("Review", reviewSchema); 