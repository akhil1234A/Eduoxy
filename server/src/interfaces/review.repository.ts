import { IReviewDocument } from "./review.interface";

export interface IReviewRepository {
  create(review: Partial<IReviewDocument>): Promise<IReviewDocument>;
  listReviewsByCourse(courseId: string): Promise<IReviewDocument[]>;
  deleteReviewById(reviewId: string, userId: string): Promise<boolean>;
} 