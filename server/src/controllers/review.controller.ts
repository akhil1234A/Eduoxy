import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { IReviewService } from "../interfaces/review.service";
import TYPES from "../di/types";
import { successResponse, errorResponse } from "../types/types";
import { HttpStatus } from "../utils/httpStatus";
import { apiLogger } from "../utils/logger";

@injectable()
export class ReviewController {
  constructor(@inject(TYPES.IReviewService) private reviewService: IReviewService) {}

  async getReviewsByCourseId(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      apiLogger.info(`Fetching reviews for course ${courseId}`);
      const reviews = await this.reviewService.getReviewsByCourseId(courseId);
      apiLogger.info(`Reviews fetched successfully for course ${courseId}`);
      res.status(HttpStatus.OK).json(successResponse("Reviews fetched successfully", reviews));
    } catch (error) {
      const err = error as Error;
      apiLogger.error(`Error fetching reviews for course : ${err.message}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error fetching reviews", err.message));
    }
  }

  async addReview(req: Request, res: Response) {
    try {
      const review = await this.reviewService.createReview(req.body);
      res.status(HttpStatus.CREATED).json(successResponse("Review added successfully", review));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error adding review", err.message));
    }
  }

  async deleteReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      apiLogger.info(`Deleting review ${id} for user ${userId}`);
      const success = await this.reviewService.deleteReview(id, userId);
      apiLogger.info(`Review deleted successfully ${id} for user ${userId}`);
      if (success) {
        res.status(HttpStatus.OK).json(successResponse("Review deleted successfully", "Review deleted successfully"));
      } else {
        apiLogger.error(`Review not found or unauthorized ${id} for user ${userId}`);
        res.status(HttpStatus.NOT_FOUND).json(errorResponse("Review not found or unauthorized", "Review not found or unauthorized"));
      }
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error deleting review", err.message));
    }
  }
} 