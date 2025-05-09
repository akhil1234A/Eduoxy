import { inject, injectable } from "inversify";
import { Model } from "mongoose";
import { BaseRepository } from "./base.repository";
import { IReviewDocument } from "../interfaces/review.interface";
import { IReviewRepository } from "../interfaces/review.repository";
import TYPES from "../di/types";
import { apiLogger } from "../utils/logger";

/**
 * This is a repository responsible for interacting with review repository
 * Managing reviews for courses and instructors
 */
@injectable()
export class ReviewRepository extends BaseRepository<IReviewDocument> implements IReviewRepository {
  constructor(@inject(TYPES.ReviewModel) model: Model<IReviewDocument>) {
    super(model);
  }

  /**
   * This methods retrieves all reviews for a specific course
   * @param courseId 
   * @returns 
   */
  async listReviewsByCourse(courseId: string): Promise<IReviewDocument[]> {
    return this.model.find({ courseId }).sort({ createdAt: -1 }).exec();
  }

/**
 * This method delete a review of a user who posted it
 * @param reviewId 
 * @param userId 
 * @returns 
 */
  async deleteReviewById(reviewId: string, userId: string): Promise<boolean> {
    const result = await this.model.findOneAndDelete({ _id: reviewId, userId }).exec();
    apiLogger.info(`Review deleted successfully ${reviewId} for user ${userId}, result: ${result}`);
    return !!result;
  }
} 