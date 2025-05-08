import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { TimeTrackingRepository } from "../repositories/timeTracking.repository";

/**
 * Service for tracking time spent on courses and chapters.

 */
@injectable()
export class TimeTrackingService {
  constructor(
    @inject(TYPES.TimeTrackingRepository) private repo: TimeTrackingRepository
  ) {}

  /**
   * Tjis method logs the time spent by a user on a specific course and chapter.
   * @param userId 
   * @param courseId 
   * @param chapterId 
   * @param timeSpentSeconds 
   */
  async logTimeSpent(
    userId: string,
    courseId: string,
    chapterId: string,
    timeSpentSeconds: number
  ): Promise<void> {
    await this.repo.updateTimeSpent(userId, courseId, chapterId, timeSpentSeconds);
  }

  /**
   * This method retrieves the total time spent by a user on a specific course.
   * @param userId 
   * @param courseId 
   * @returns 
   */
  async getTotalTimeSpent(userId: string, courseId?: string): Promise<number> {
    return this.repo.getTotalTimeSpent(userId, courseId);
  }
}