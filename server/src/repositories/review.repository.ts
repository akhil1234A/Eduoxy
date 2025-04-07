import { inject, injectable } from "inversify";
import { Model } from "mongoose";
import { BaseRepository } from "./base.repository";
import { IReviewDocument } from "../interfaces/review.interface";
import { IReviewRepository } from "../interfaces/review.repository";
import TYPES from "../di/types";
import { apiLogger } from "../utils/logger";

@injectable()
export class ReviewRepository extends BaseRepository<IReviewDocument> implements IReviewRepository {
  constructor(@inject(TYPES.ReviewModel) model: Model<IReviewDocument>) {
    super(model);
  }

  async findByCourseId(courseId: string): Promise<IReviewDocument[]> {
    return this.model.find({ courseId }).sort({ createdAt: -1 }).exec();
  }

  async deleteById(reviewId: string, userId: string): Promise<boolean> {
    const result = await this.model.findOneAndDelete({ _id: reviewId, userId }).exec();
    apiLogger.info(`Review deleted successfully ${reviewId} for user ${userId}, result: ${result}`);
    return !!result;
  }
} 