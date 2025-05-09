import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { UserCourseProgress, IUserCourseProgress } from "../models/userCourseProgress.model";
import { IUserCourseProgressRepository } from "../interfaces/courseProgress.repository";
import { ICourseDocument } from "../models/course.model";
import { Model } from "mongoose";
import { BaseRepository } from "./base.repository";

/**
 * UserCourseProgressRepository class is responsible for interacting with the UserCourseProgress model.
 * It provides methods to manage user course progress in the database.
 */
@injectable()
export class UserCourseProgressRepository extends BaseRepository<IUserCourseProgress> implements IUserCourseProgressRepository {
  constructor(
    @inject(TYPES.UserCourseProgressModel) private _userCourseProgressModel: Model<IUserCourseProgress>,
    @inject(TYPES.CourseModel) private _courseModel: Model<ICourseDocument>
  ) {
    super(_userCourseProgressModel)
  }

  /**
   * This method retrieves a list of courses that a user is enrolled in.
   * It takes a userId, skip, and limit as parameters for pagination.
   * @param userId 
   * @param skip 
   * @param limit 
   * @returns 
   */
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

  /**
   * This method counts the number of courses a user is enrolled in.
   * @param userId 
   * @returns number of courses
   */
  async countUserEnrolledCourses(userId: string): Promise<number> {
    return this._userCourseProgressModel.countDocuments({ userId }).exec();
  }

  /**
   * This method retrieves the progress of a specific course for a user.
   * It takes a userId and courseId as parameters.
   * @param userId 
   * @param courseId 
   * @returns 
   */
  async getUserCourseProgress(userId: string, courseId: string): Promise<IUserCourseProgress | null> {
    return this._userCourseProgressModel.findOne({ userId, courseId }).exec();
  }

  /**
   * This method saves or updates the progress of a course for a user.
   * It takes an IUserCourseProgress object as a parameter.
   * @param progress - The progress data to be saved or updated.
   * @returns 
   */
  async saveUserCourseProgress(progress: IUserCourseProgress): Promise<IUserCourseProgress> {
    const { userId, courseId } = progress;
    const updatedProgress = await this._userCourseProgressModel.findOneAndUpdate(
      { userId, courseId },
      progress,
      { new: true, upsert: true }
    ).exec();
    return updatedProgress;
  }

  /**
   * This method retrieves a list of courses that a user is enrolled in along with their progress.
   * @param userId 
   * @param skip 
   * @param limit 
   * @returns 
   */
  async getEnrolledCoursesWithProgress(
    userId: string,
    skip: number = 0,
    limit: number = 10
  ): Promise<{ course: ICourseDocument; progress: IUserCourseProgress | null }[]> {
    const progressRecords = await this._userCourseProgressModel
      .find({ userId })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const courseIds = progressRecords.map((progress) => progress.courseId);
    const courses = await this._courseModel
      .find({ courseId: { $in: courseIds } })
      .lean()
      .exec();

    return progressRecords.map((progress) => ({
      course: courses.find((course) => course.courseId === progress.courseId) || ({
        courseId: progress.courseId,
        teacherId: "",
        teacherName: "Unknown",
        title: "Unknown",
        category: "",
        level: "Beginner",
        status: "Draft",
        sections: [],
        enrollments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        _id: null, 
      } as unknown as ICourseDocument), 
      progress,
    }));
  }

  /**
   * This method checks if a course is completed by a user.
   * It takes a userId and courseId as parameters.
   * This method is useful for determining if a user has completed a course.
   * prevents duplicate certificates for the same course.
   * @param userId 
   * @param courseId 
   * @returns 
   */
  async isCourseCompleted(userId: string, courseId: string): Promise<boolean> {
    const progress = await this._userCourseProgressModel.findOne({ userId, courseId }).exec();
    if (!progress) return false;
    const allChaptersCompleted = progress.sections.every((section) =>
      section.chapters.every((chapter) => chapter.completed)
    );
    return allChaptersCompleted && progress.overallProgress === 100;
  }
  
}