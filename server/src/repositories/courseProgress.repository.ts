import { injectable, inject } from "inversify";
import TYPES from "../di/types"; 
import { UserCourseProgress, IUserCourseProgress } from "../models/userCourseProgress.model";
import { IUserCourseProgressRepository } from "../interfaces/courseProgress.repository";
import { ICourseDocument } from "../models/course.model";
import { Model } from "mongoose";



@injectable()
export class UserCourseProgressRepository implements IUserCourseProgressRepository {
  constructor(
    @inject(TYPES.UserCourseProgressModel) private _userCourseProgressModel: typeof UserCourseProgress,
    @inject(TYPES.CourseModel) private _courseModel: Model<ICourseDocument>
  ) {}


  async getUserEnrolledCourses(
    userId: string,
    skip: number = 0,
    limit: number = 10
  ): Promise<ICourseDocument[]> {
    const userProgress = await this._userCourseProgressModel
      .find({ userId })
      .skip(skip)
      .limit(limit)
      .exec();
    const courseIds = userProgress.map((progress) => progress.courseId);
    const courses = await this._courseModel
      .find({
        courseId: { $in: courseIds },
      })
      .exec();
    return courses;
  }
  
  async countUserEnrolledCourses(userId: string): Promise<number> {
    return this._userCourseProgressModel.countDocuments({ userId }).exec();
  }


  async getUserCourseProgress(userId: string, courseId: string): Promise<IUserCourseProgress | null> {
    return this._userCourseProgressModel.findOne({ userId, courseId }).exec();
  }

  async saveUserCourseProgress(progress: IUserCourseProgress): Promise<IUserCourseProgress> {
    const { userId, courseId } = progress;
    const updatedProgress = await this._userCourseProgressModel.findOneAndUpdate(
      { userId, courseId },
      progress,
      { new: true, upsert: true } 
    ).exec();
    return updatedProgress;
  }
}