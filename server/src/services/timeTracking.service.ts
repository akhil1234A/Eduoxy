import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { TimeTrackingRepository } from "../repositories/timeTracking.repository";

@injectable()
export class TimeTrackingService {
  constructor(
    @inject(TYPES.TimeTrackingRepository) private repo: TimeTrackingRepository
  ) {}

  async logTimeSpent(
    userId: string,
    courseId: string,
    chapterId: string,
    timeSpentSeconds: number
  ): Promise<void> {
    await this.repo.updateTimeSpent(userId, courseId, chapterId, timeSpentSeconds);
  }

  async getTotalTimeSpent(userId: string, courseId?: string): Promise<number> {
    return this.repo.getTotalTimeSpent(userId, courseId);
  }
}