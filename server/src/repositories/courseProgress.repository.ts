import { injectable, inject } from "inversify";
import TYPES from "../di/types"; 
import { UserCourseProgress, IUserCourseProgress } from "../models/userCourseProgress.model";
import { IUserCourseProgressRepository } from "../interfaces/courseProgress.repository";




@injectable()
export class UserCourseProgressRepository implements IUserCourseProgressRepository {
  constructor(
    @inject(TYPES.UserCourseProgressModel) private userCourseProgressModel: typeof UserCourseProgress
  ) {}


  async getUserEnrolledCourses(userId: string): Promise<IUserCourseProgress[]> {
    return this.userCourseProgressModel.find({ userId }).exec();
  }


  async getUserCourseProgress(userId: string, courseId: string): Promise<IUserCourseProgress | null> {
    console.log('c',userId,courseId);
    return this.userCourseProgressModel.findOne({ userId, courseId }).exec();
  }

  async saveUserCourseProgress(progress: IUserCourseProgress): Promise<IUserCourseProgress> {
    const { userId, courseId } = progress;
    const updatedProgress = await this.userCourseProgressModel.findOneAndUpdate(
      { userId, courseId },
      progress,
      { new: true, upsert: true } 
    ).exec();
    return updatedProgress;
  }
}