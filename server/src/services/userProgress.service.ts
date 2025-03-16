import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { IUserCourseProgress } from "../models/userCourseProgress.model";
import { IUserCourseProgressRepository } from "../interfaces/courseProgress.repository";
import { mergeSections, calculateOverallProgress } from "../utils/course.progress";
import { IUserCourseProgressService } from "../interfaces/courseProgress.service";


@injectable()
export class UserCourseProgressService implements IUserCourseProgressService {
  constructor(
    @inject(TYPES.IUserCourseProgressRepository) private userCourseProgressRepository: IUserCourseProgressRepository
  ) {}

  async getUserEnrolledCourses(userId: string): Promise<IUserCourseProgress[]> {
    return this.userCourseProgressRepository.getUserEnrolledCourses(userId);
  }

  async getUserCourseProgress(userId: string, courseId: string): Promise<IUserCourseProgress | null> {
    console.log('getUserProgress');
    return this.userCourseProgressRepository.getUserCourseProgress(userId, courseId);
  }

  async updateUserCourseProgress(
    userId: string,
    courseId: string,
    progressData: Partial<IUserCourseProgress>
  ): Promise<IUserCourseProgress> {
    let progress = await this.getUserCourseProgress(userId, courseId);
    if (!progress) {
      progress = {
        userId,
        courseId,
        enrollmentDate: new Date().toISOString(),
        overallProgress: 0,
        sections: [],
        lastAccessedTimestamp: new Date().toISOString(),
      } as IUserCourseProgress;
    }
    if (progressData.sections) {
      progress.sections = mergeSections(progress.sections, progressData.sections);
    }
    progress.lastAccessedTimestamp = new Date().toISOString();
    progress.overallProgress = calculateOverallProgress(progress.sections);
    return this.userCourseProgressRepository.saveUserCourseProgress(progress);
  }
}