import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { IUserCourseProgress } from "../models/userCourseProgress.model";
import { IUserCourseProgressRepository } from "../interfaces/courseProgress.repository";
import { mergeSections, calculateOverallProgress } from "../utils/course.progress";
import { IUserCourseProgressService } from "../interfaces/courseProgress.service";
import { ICourseDocument } from "../models/course.model";
import { CacheUtil } from "../utils/cache";
import { IRedisClient } from "../config/redis";

@injectable()
export class UserCourseProgressService implements IUserCourseProgressService {
  constructor(
    @inject(TYPES.IUserCourseProgressRepository) private _userCourseProgressRepository: IUserCourseProgressRepository,
    @inject(TYPES.IRedisClient) private _redisClient: IRedisClient
  ) {}

  async getUserEnrolledCourses(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ courses: ICourseDocument[]; total: number }> {
    const cacheKey = CacheUtil.getCoursesListCacheKey(`enrolled:${userId}`, "all", page, limit);
    const cachedData = await CacheUtil.get<{ courses: ICourseDocument[]; total: number }>(cacheKey);
    if (cachedData) return cachedData;
  
    const skip = (page - 1) * limit;
    const [courses, total] = await Promise.all([
      this._userCourseProgressRepository.getUserEnrolledCourses(userId, skip, limit),
      this._userCourseProgressRepository.countUserEnrolledCourses(userId),
    ]);
  
    const result = { courses, total };
    await CacheUtil.set(cacheKey, result, 300); 
    return result;
  }

  async getUserCourseProgress(userId: string, courseId: string): Promise<IUserCourseProgress | null> {
    return this._userCourseProgressRepository.getUserCourseProgress(userId, courseId);
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
    
    const updatedProgress = await this._userCourseProgressRepository.saveUserCourseProgress(progress);
    
    // Invalidate all paginated enrolled courses caches for this user
    const enrolledPattern = `enrolled:${userId}*`;
    const keysToDelete = await this._redisClient.keys(enrolledPattern);
    if (keysToDelete.length > 0) {
      await Promise.all(keysToDelete.map(key => this._redisClient.del(key)));
    }
    
    return updatedProgress;
  }
}