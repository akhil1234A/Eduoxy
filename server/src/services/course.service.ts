import { ICourseService } from "../interfaces/course.service";
import { ICourseRepository } from "../interfaces/course.repository";
import { ICourseDocument } from "../models/course.model";
import { CourseStatus } from "../types/types";
import { CacheUtil } from "../utils/cache";
import { v4 as uuidv4, v4 } from "uuid";
import { injectable, inject } from "inversify";
import TYPES from "../di/types";
@injectable()
export class CourseService implements ICourseService {
  constructor(@inject(TYPES.ICourseRepository) private courseRepository: ICourseRepository) {}

  async createCourse(teacherId: string, teacherName: string): Promise<ICourseDocument> {
    const courseData: Partial<ICourseDocument> = { 
      teacherId,
      teacherName,
    }; 
    const course = await this.courseRepository.create(courseData); 
    await CacheUtil.del(CacheUtil.getCoursesListCacheKey(`teacher:${teacherId}`));
    return course;
  }

  async getCourse(courseId: string): Promise<ICourseDocument | null> {
    const cacheKey = CacheUtil.getCourseCacheKey(courseId);
    const cachedData = await CacheUtil.get<ICourseDocument>(cacheKey);
    if (cachedData) return cachedData;

    const course = await this.courseRepository.findByCourseId(courseId);
    if (course) await CacheUtil.set(cacheKey, course);
    return course;
  }

  async listPublicCourses(category?: string): Promise<ICourseDocument[]> {
    const cacheKey = CacheUtil.getCoursesListCacheKey("public", category);
    const cachedData = await CacheUtil.get<ICourseDocument[]>(cacheKey);
    if (cachedData) return cachedData;

    const courses = await this.courseRepository.findPublicCourses(category);
    await CacheUtil.set(cacheKey, courses);
    return courses;
  }

  async listAdminCourses(category?: string): Promise<ICourseDocument[]> {
    const cacheKey = CacheUtil.getCoursesListCacheKey("admin", category);
    const cachedData = await CacheUtil.get<ICourseDocument[]>(cacheKey);
    if (cachedData) return cachedData;

    const courses = await this.courseRepository.findAdminCourses(category);
    await CacheUtil.set(cacheKey, courses);
    return courses;
  }

  async listTeacherCourses(teacherId: string, category?: string): Promise<ICourseDocument[]> {
    const cacheKey = CacheUtil.getCoursesListCacheKey(`teacher:${teacherId}`, category);
    const cachedData = await CacheUtil.get<ICourseDocument[]>(cacheKey);
    if (cachedData) return cachedData;

    const courses = await this.courseRepository.findTeacherCourses(teacherId, category);
    await CacheUtil.set(cacheKey, courses);
    return courses;
  }

  async updateCourse(courseId: string, teacherId: string, updateData: Partial<ICourseDocument>): Promise<ICourseDocument | null> {
    const course = await this.courseRepository.findByCourseId(courseId);
  
    if (!course) {
      throw new Error("Course not found");
    }
  
    if (course.teacherId !== teacherId) {
      throw new Error("Not authorized to update this course");
    }
  
    if (updateData.price) {
      const price = parseInt(updateData.price as any, 10);
      if (isNaN(price)) {
        throw new Error("Invalid price format: Price must be a valid number");
      }
      updateData.price = price * 100;
    }
  
    if (updateData.sections) {
      if (typeof updateData.sections === "string") {
        try {
          updateData.sections = JSON.parse(updateData.sections);
        } catch (err) {
          throw new Error("Invalid sections format: Must be an array");
        }
      }
  
      if (!Array.isArray(updateData.sections)) {
        throw new Error("Invalid sections format: Must be an array");
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
  
    const updatedCourse = await this.courseRepository.updateByCourseId(courseId, teacherId, updateData);
    if (updatedCourse) {
      await CacheUtil.set(CacheUtil.getCourseCacheKey(courseId), updatedCourse);
      await CacheUtil.invalidateCourseListCaches();
    }
  
    return updatedCourse;
  }
  

  async deleteCourse(courseId: string, teacherId: string): Promise<ICourseDocument | null> {
    const course = await this.courseRepository.deleteByCourseId(courseId, teacherId);
    if (course) {
      await CacheUtil.del(CacheUtil.getCourseCacheKey(courseId));
      await CacheUtil.invalidateCourseListCaches();
      await CacheUtil.del(CacheUtil.getCoursesListCacheKey(`teacher:${teacherId}`));
    }
    return course;
  }

  async unlistCourse(courseId: string): Promise<ICourseDocument | null> {
    const course = await this.courseRepository.unlist(courseId);
    if (course) {
      await CacheUtil.set(CacheUtil.getCourseCacheKey(courseId), course);
      await CacheUtil.invalidateCourseListCaches();
    }
    return course;
  }

  async publishCourse(courseId: string): Promise<ICourseDocument | null> {
    const course = await this.courseRepository.publish(courseId);
    if (course) {
      await CacheUtil.set(CacheUtil.getCourseCacheKey(courseId), course);
      await CacheUtil.invalidateCourseListCaches();
    }
    return course;
  }
}