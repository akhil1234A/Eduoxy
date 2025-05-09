import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { IUserTimeTracking, UserTimeTracking } from "../models/userTimeTracking.model";
import { Model } from "mongoose";
import { ITimeTrackingRepository } from "../interfaces/timeTracking.repository";
import { BaseRepository } from "./base.repository";

/**
 * This is a repository responsible for interacting with user time tracking data
 */
@injectable()
export class TimeTrackingRepository extends BaseRepository<IUserTimeTracking> implements ITimeTrackingRepository{
  constructor(
    @inject(TYPES.UserTimeTrackingModel) private timeTrackingModel: Model<IUserTimeTracking>
  ) {
    super(timeTrackingModel)
  }


  /**
   * This method updates the time spent by a user on a specific course and chapter
   * tracking watch time of the user on a specific course and chapter
   * @param userId 
   * @param courseId 
   * @param chapterId 
   * @param timeSpentSeconds 
   * @returns 
   */
  async updateTimeSpent(
    userId: string,
    courseId: string,
    chapterId: string,
    timeSpentSeconds: number
  ): Promise<IUserTimeTracking> {
    return this.model
      .findOneAndUpdate(
        { userId, courseId, chapterId },
        {
          $inc: { timeSpentSeconds },
          $set: { lastUpdated: new Date() },
        },
        { upsert: true, new: true }
      )
      .exec();
  }

  /**
   * This method retrieves the time spent by a user on a specific course and chapter
   * @param userId 
   * @param courseId 
   * @param chapterId 
   * @returns 
   */
  async getTotalTimeSpent(userId: string, courseId?: string): Promise<number> {
    const query = courseId ? { userId, courseId } : { userId };
    const records = await this.model.find(query).exec();
    return records.reduce((total, record) => total + record.timeSpentSeconds, 0);
  }
}