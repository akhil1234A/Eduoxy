import { IReviewDocument } from "./review.interface";

export interface IReviewRepository {
  create(review: Partial<IReviewDocument>): Promise<IReviewDocument>;
  findByCourseId(courseId: string): Promise<IReviewDocument[]>;
  deleteById(reviewId: string, userId: string): Promise<boolean>;
} 