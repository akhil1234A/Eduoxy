import { ICourseDocument } from "../models/course.model";
import { IUserCourseProgress } from "../models/userCourseProgress.model";

export interface IUserCourseProgressRepository {
  getUserEnrolledCourses(userId: string, skip: number, limit: number): Promise<ICourseDocument[]>;
  countUserEnrolledCourses(userId: string): Promise<number>;
  getUserCourseProgress(userId: string, courseId: string): Promise<IUserCourseProgress | null>;
  saveUserCourseProgress(progress: IUserCourseProgress): Promise<IUserCourseProgress>;
}