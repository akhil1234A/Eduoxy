import { inject, injectable } from "inversify";
import { IReviewRepository } from "../interfaces/review.repository";
import { IReviewService } from "../interfaces/review.service";
import { IReviewDocument } from "../interfaces/review.interface";
import TYPES from "../di/types";
import { apiLogger } from "../utils/logger";

/**
 * This is a service responsible for managing review functionalities
 * It handles creating, fetching, and deleting reviews for courses and instructors
 */
@injectable()
export class ReviewService implements IReviewService {
  constructor(
    @inject(TYPES.IReviewRepository) private reviewRepository: IReviewRepository
  ) {}

  /**
   * This method creates a new review for a course
   * @param review 
   * @returns 
   */
  async createReview(review: Partial<IReviewDocument>): Promise<IReviewDocument> {
    return this.reviewRepository.create(review);
  }

  /**
   * This method retrieves all reviews for a specific course
   * @param courseId 
   * @returns 
   */
  async getReviewsByCourseId(courseId: string): Promise<IReviewDocument[]> {
    apiLogger.info(`Fetching reviews for course ${courseId}`);
    const reviews = await this.reviewRepository.findByCourseId(courseId);
    apiLogger.info(`Reviews fetched successfully for course ${courseId}`);
    return reviews;
  }

  /**
   * This method deletes a review of a user who posted it
   * @param reviewId 
   * @param userId 
   * @returns 
   */
  async deleteReview(reviewId: string, userId: string): Promise<boolean> {
    apiLogger.info(`Deleting review ${reviewId} for user ${userId}`);
    const result = await this.reviewRepository.deleteById(reviewId, userId);
    apiLogger.info(`Review deleted successfully ${reviewId} for user ${userId}`);
    return result;
  }
} 