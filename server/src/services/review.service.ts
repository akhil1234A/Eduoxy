import { inject, injectable } from "inversify";
import { IReviewRepository } from "../interfaces/review.repository";
import { IReviewService } from "../interfaces/review.service";
import { IReviewDocument } from "../interfaces/review.interface";
import TYPES from "../di/types";
import { apiLogger } from "../utils/logger";

@injectable()
export class ReviewService implements IReviewService {
  constructor(
    @inject(TYPES.IReviewRepository) private reviewRepository: IReviewRepository
  ) {}

  async createReview(review: Partial<IReviewDocument>): Promise<IReviewDocument> {
    return this.reviewRepository.create(review);
  }

  async getReviewsByCourseId(courseId: string): Promise<IReviewDocument[]> {
    apiLogger.info(`Fetching reviews for course ${courseId}`);
    const reviews = await this.reviewRepository.findByCourseId(courseId);
    apiLogger.info(`Reviews fetched successfully for course ${courseId}`);
    return reviews;
  }

  async deleteReview(reviewId: string, userId: string): Promise<boolean> {
    apiLogger.info(`Deleting review ${reviewId} for user ${userId}`);
    const result = await this.reviewRepository.deleteById(reviewId, userId);
    apiLogger.info(`Review deleted successfully ${reviewId} for user ${userId}`);
    return result;
  }
} 