import { ICourseDocument } from "../models/course.model";
import { CourseCreationInput } from "../types/types";

export interface ICourseService {
  createCourse(teacherId: string, teacherName: string): Promise<ICourseDocument>;
  getCourse(courseId: string): Promise<ICourseDocument | null>;
  listPublicCourses(category?: string): Promise<ICourseDocument[]>;
  listAdminCourses(category?: string): Promise<ICourseDocument[]>;
  listTeacherCourses(teacherId: string, category?: string): Promise<ICourseDocument[]>;
  updateCourse(courseId: string, teacherId: string, updateData: Partial<ICourseDocument>): Promise<ICourseDocument | null>;
  deleteCourse(courseId: string, teacherId: string): Promise<ICourseDocument | null>;
  unlistCourse(courseId: string): Promise<ICourseDocument | null>;
  publishCourse(courseId: string): Promise<ICourseDocument | null>;
  searchCourses(searchTerm: string, category?: string): Promise<ICourseDocument[]>;
}