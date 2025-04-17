import { IUserCourseProgress } from "../models/userCourseProgress.model";
import { ICourseDocument } from "../models/course.model";

export interface IUserCourseProgressService {
  getUserEnrolledCourses(userId: string, page: number, limit: number): Promise<{ courses: ICourseDocument[]; total: number }>;
  getUserCourseProgress(userId: string, courseId: string): Promise<IUserCourseProgress | null>;
  updateUserCourseProgress(
    userId: string,
    courseId: string,
    progressData: Partial<IUserCourseProgress>
  ): Promise<IUserCourseProgress>;
}