import { IUserCourseProgress } from "../models/userCourseProgress.model";
import { ICourseDocument } from "../models/course.model";

export interface IUserCourseProgressService {
  getUserEnrolledCourses(userId: string): Promise<ICourseDocument[]>;
  getUserCourseProgress(userId: string, courseId: string): Promise<IUserCourseProgress | null>;
  updateUserCourseProgress(
    userId: string,
    courseId: string,
    progressData: Partial<IUserCourseProgress>
  ): Promise<IUserCourseProgress>;
}