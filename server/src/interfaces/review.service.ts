import { IReviewDocument } from "./review.interface";

export interface IReviewService {
  createReview(review: Partial<IReviewDocument>): Promise<IReviewDocument>;
  getReviewsByCourseId(courseId: string): Promise<IReviewDocument[]>;
  deleteReview(reviewId: string, userId: string): Promise<boolean>;
} 