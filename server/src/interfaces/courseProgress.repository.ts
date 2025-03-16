import { IUserCourseProgress } from "../models/userCourseProgress.model";

export interface IUserCourseProgressRepository {
  getUserEnrolledCourses(userId: string): Promise<IUserCourseProgress[]>;
  getUserCourseProgress(userId: string, courseId: string): Promise<IUserCourseProgress | null>;
  saveUserCourseProgress(progress: IUserCourseProgress): Promise<IUserCourseProgress>;
}