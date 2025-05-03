import { ICourseService } from '../interfaces/course.service';
import { ICourseRepository } from '../interfaces/course.repository';
import { ICourseDocument } from '../models/course.model';
import { IInitialCoursesResponse } from '../types/types';
import { CacheUtil } from '../utils/cache';
import { v4 as uuidv4 } from 'uuid';
import { injectable, inject } from 'inversify';
import TYPES from '../di/types';
import { s3Service } from './s3.service';
import { IRedisClient } from '../config/redis';

@injectable()
export class CourseService implements ICourseService {
  constructor(
    @inject(TYPES.ICourseRepository) private _courseRepository: ICourseRepository,
    @inject(TYPES.IRedisClient) private _redisClient: IRedisClient
  ) {}

  async createCourse(courseData: Partial<ICourseDocument>): Promise<ICourseDocument> {
    if (!courseData.teacherId || !courseData.teacherName) {
      throw new Error('Teacher ID and name are required');
    }

    if (courseData.price) {
      const price = parseInt(courseData.price as any, 10);
      if (isNaN(price)) {
        throw new Error('Invalid price format: Price must be a valid number');
      }
      courseData.price = price;
    }

    if (courseData.sections && Array.isArray(courseData.sections)) {
      courseData.sections = courseData.sections.map((section: any) => ({
        ...section,
        sectionId: section.sectionId || uuidv4(),
        chapters: Array.isArray(section.chapters)
          ? section.chapters.map((chapter: any) => ({
              ...chapter,
              chapterId: chapter.chapterId || uuidv4(),
            }))
          : [],
      }));
    }

    const course = await this._courseRepository.createCourse(courseData);

    const teacherCoursesPattern = `courses:teacher:${courseData.teacherId}*`;
    const publicCoursesPattern = 'courses:public*';
    const adminCoursesPattern = 'courses:admin*';
    const searchCoursesPattern = 'courses:search*';

    const keysToDelete = await Promise.all([
      this._redisClient.keys(teacherCoursesPattern),
      this._redisClient.keys(publicCoursesPattern),
      this._redisClient.keys(adminCoursesPattern),
      this._redisClient.keys(searchCoursesPattern),
    ]);

    const allKeys = keysToDelete.flat();
    if (allKeys.length > 0) {
      await Promise.all(allKeys.map((key: string) => this._redisClient.del(key)));
    }

    return course;
  }

  async getCourse(courseId: string): Promise<ICourseDocument | null> {
    const cacheKey = CacheUtil.getCourseCacheKey(courseId);
    const cachedData = await CacheUtil.get<ICourseDocument>(cacheKey);
    if (cachedData) return cachedData;

    const course = await this._courseRepository.findByCourseId(courseId);
    if (course) await CacheUtil.set(cacheKey, course);
    return course;
  }

  async listPublicCourses(
    category?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ courses: ICourseDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const cacheKey = CacheUtil.getCoursesListCacheKey('public', category, page, limit);
    const cachedData = await CacheUtil.get<{
      courses: ICourseDocument[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);
    if (cachedData) return cachedData;

    const courses = await this._courseRepository.findPublicCourses(category, skip, limit);
    const total = await this._courseRepository.countPublicCourses(category);
    const totalPages = Math.ceil(total / limit);

    const result = {
      courses,
      total,
      page,
      limit,
      totalPages,
    };

    await CacheUtil.set(cacheKey, result);
    return result;
  }

  async listAdminCourses(category?: string, page: number = 1, limit: number = 10): Promise<{ courses: ICourseDocument[]; total: number }> {
    const cacheKey = CacheUtil.getCoursesListCacheKey('admin', category || 'all', page, limit);
    const cachedData = await CacheUtil.get<{ courses: ICourseDocument[]; total: number }>(cacheKey);
    if (cachedData) return cachedData;

    const skip = (page - 1) * limit;
    const [courses, total] = await Promise.all([
      this._courseRepository.findAdminCourses(category, skip, limit),
      this._courseRepository.countAdminCourses(category),
    ]);

    const result = { courses, total };
    await CacheUtil.set(cacheKey, result);
    return result;
  }

  async listTeacherCourses(
    teacherId: string,
    category?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ courses: ICourseDocument[]; total: number }> {
    const cacheKey = CacheUtil.getCoursesListCacheKey(`teacher:${teacherId}`, category || 'all', page, limit);
    const cachedData = await CacheUtil.get<{ courses: ICourseDocument[]; total: number }>(cacheKey);
    if (cachedData) return cachedData;

    const skip = (page - 1) * limit;
    const [courses, total] = await Promise.all([
      this._courseRepository.findTeacherCourses(teacherId, category, skip, limit),
      this._courseRepository.countTeacherCourses(teacherId, category),
    ]);

    const result = { courses, total };
    await CacheUtil.set(cacheKey, result);
    return result;
  }

  async updateCourse(courseId: string, teacherId: string, updateData: Partial<ICourseDocument>): Promise<ICourseDocument | null> {
    const course = await this._courseRepository.findByCourseId(courseId);

    if (!course) {
      throw new Error('Course not found');
    }

    if (course.teacherId !== teacherId) {
      throw new Error('Not authorized to update this course');
    }

    if (updateData.price) {
      const price = parseInt(updateData.price as any, 10);
      if (isNaN(price)) {
        throw new Error('Invalid price format: Price must be a valid number');
      }
      updateData.price = price;
    }

    if (updateData.sections) {
      if (typeof updateData.sections === 'string') {
        try {
          updateData.sections = JSON.parse(updateData.sections);
        } catch (err) {
          throw new Error('Invalid sections format: Must be an array');
        }
      }

      if (!Array.isArray(updateData.sections)) {
        throw new Error('Invalid sections format: Must be an array');
      }

      updateData.sections = updateData.sections.map((section: any) => ({
        ...section,
        sectionId: section.sectionId || uuidv4(),
        chapters: Array.isArray(section.chapters)
          ? section.chapters.map((chapter: any) => ({
              ...chapter,
              chapterId: chapter.chapterId || uuidv4(),
            }))
          : [],
      }));
    }

    const updatedCourse = await this._courseRepository.updateByCourseId(courseId, teacherId, updateData);
    if (updatedCourse) {
      await CacheUtil.set(CacheUtil.getCourseCacheKey(courseId), updatedCourse);
      await CacheUtil.invalidateCourseListCaches();
    }

    return updatedCourse;
  }

  async deleteCourse(courseId: string, teacherId: string): Promise<ICourseDocument | null> {
    const course = await this._courseRepository.findByCourseId(courseId);

    if (!course) {
      throw new Error('Course not found');
    }

    const s3KeysToDelete: string[] = [];

    const courseImageKey = s3Service.extractKeyFromUrl(course.image);
    if (courseImageKey) {
      s3KeysToDelete.push(courseImageKey);
    }

    course.sections.forEach((section: any) => {
      section.chapters.forEach((chapter: any) => {
        const videoKey = s3Service.extractKeyFromUrl(chapter.video);
        const imageKey = s3Service.extractKeyFromUrl(chapter.image);
        const subtitleKey = s3Service.extractKeyFromUrl(chapter.subtitle);

        if (videoKey) {
          s3KeysToDelete.push(videoKey);
        }
        if (imageKey) {
          s3KeysToDelete.push(imageKey);
        }
        if (subtitleKey) {
          s3KeysToDelete.push(subtitleKey);
        }
      });
    });

    await Promise.all(
      s3KeysToDelete.map(async (key) => {
        try {
          await s3Service.deleteObject(key);
          console.log(`Deleted S3 resource: ${key}`);
        } catch (error) {
          console.error(`Failed to delete S3 resource ${key}:`, error);
        }
      })
    );

    const deletedCourse = await this._courseRepository.deleteByCourseId(courseId, teacherId);
    if (deletedCourse) {
      await CacheUtil.del(CacheUtil.getCourseCacheKey(courseId));
      await CacheUtil.invalidateCourseListCaches();
      await CacheUtil.del(CacheUtil.getCoursesListCacheKey(`teacher:${teacherId}`));
    }
    return deletedCourse;
  }

  async unlistCourse(courseId: string): Promise<ICourseDocument | null> {
    const course = await this._courseRepository.unlist(courseId);
    if (course) {
      await CacheUtil.set(CacheUtil.getCourseCacheKey(courseId), course);
      await CacheUtil.invalidateCourseListCaches();
    }
    return course;
  }

  async publishCourse(courseId: string): Promise<ICourseDocument | null> {
    const course = await this._courseRepository.publish(courseId);
    if (course) {
      await CacheUtil.set(CacheUtil.getCourseCacheKey(courseId), course);
      await CacheUtil.invalidateCourseListCaches();
    }
    return course;
  }

  async searchCourses(
    searchTerm: string,
    category?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<IInitialCoursesResponse> {
    const cacheKey = CacheUtil.getCoursesListCacheKey(`search:${searchTerm}:${category || 'all'}`, 'all', page, limit);
    const cachedData = await CacheUtil.get<IInitialCoursesResponse>(cacheKey);
    if (cachedData) return cachedData;

    const skip = (page - 1) * limit;
    const [courses, total] = await Promise.all([
      this._courseRepository.searchPublicCourses(searchTerm, category, skip, limit),
      this._courseRepository.countSearchPublicCourses(searchTerm, category),
    ]);

    const result = { courses, total };
    await CacheUtil.set(cacheKey, result, 300);
    return result;
  }
}