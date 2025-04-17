import { ICourseDocument } from "../models/course.model";
import { CourseCreationInput, IInitialCoursesResponse } from "../types/types";

export interface ICourseService {
  createCourse(teacherId: string, teacherName: string): Promise<ICourseDocument>;
  getCourse(courseId: string): Promise<ICourseDocument | null>;
  listPublicCourses(category?: string, page?: number, limit?: number): Promise<IInitialCoursesResponse>;
  listAdminCourses(category?: string, page?: number, limit?: number): Promise<IInitialCoursesResponse>;
  listTeacherCourses(teacherId: string, category?: string, page?: number, limit?: number): Promise<IInitialCoursesResponse>;
  updateCourse(courseId: string, teacherId: string, updateData: Partial<ICourseDocument>): Promise<ICourseDocument | null>;
  deleteCourse(courseId: string, teacherId: string): Promise<ICourseDocument | null>;
  unlistCourse(courseId: string): Promise<ICourseDocument | null>;
  publishCourse(courseId: string): Promise<ICourseDocument | null>;
  searchCourses(searchTerm: string, category?: string, page?: number, limit?: number): Promise<IInitialCoursesResponse>;
}