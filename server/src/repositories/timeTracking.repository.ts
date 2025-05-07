import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { IUserTimeTracking } from "../models/userTimeTracking.model";
import { Model } from "mongoose";

@injectable()
export class TimeTrackingRepository {
  constructor(
    @inject(TYPES.UserTimeTrackingModel) private model: Model<IUserTimeTracking>
  ) {}

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

  async getTotalTimeSpent(userId: string, courseId?: string): Promise<number> {
    const query = courseId ? { userId, courseId } : { userId };
    const records = await this.model.find(query).exec();
    return records.reduce((total, record) => total + record.timeSpentSeconds, 0);
  }
}