import { IUserCourseProgress } from "../models/userCourseProgress.model";

export interface IUserCourseProgressService {
  getUserEnrolledCourses(userId: string): Promise<IUserCourseProgress[]>;
  getUserCourseProgress(userId: string, courseId: string): Promise<IUserCourseProgress | null>;
  updateUserCourseProgress(
    userId: string,
    courseId: string,
    progressData: Partial<IUserCourseProgress>
  ): Promise<IUserCourseProgress>;
}