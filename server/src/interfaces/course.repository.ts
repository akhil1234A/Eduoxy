import { IBaseRepository } from "../interfaces/base.repository";
import { ICourseDocument } from "../models/course.model";

export interface ICourseRepository extends IBaseRepository<ICourseDocument> {
  createCourse(data: Partial<ICourseDocument>): Promise<ICourseDocument>;
  findByCourseId(courseId: string): Promise<ICourseDocument | null>;
  findPublicCourses(category?: string, skip?: number, limit?: number): Promise<ICourseDocument[]>;
  countPublicCourses(category?: string): Promise<number>;
  findAdminCourses(category?: string, skip?: number, limit?: number): Promise<ICourseDocument[]>;
  countAdminCourses(category?: string): Promise<number>;
  findTeacherCourses(teacherId: string, category?: string, skip?: number, limit?: number): Promise<ICourseDocument[]>;
  countTeacherCourses(teacherId: string, category?: string): Promise<number>;
  unlist(courseId: string): Promise<ICourseDocument | null>;
  publish(courseId: string): Promise<ICourseDocument | null>;
  updateByCourseId(courseId: string, teacherId: string, updateData: Partial<ICourseDocument>): Promise<ICourseDocument | null>;
  deleteByCourseId(courseId: string, teacherId: string): Promise<ICourseDocument | null>;
  addEnrollment(courseId: string, userId: string, studentName: string): Promise<ICourseDocument | null>;
  searchPublicCourses(searchTerm: string, category?: string, skip?: number, limit?: number): Promise<ICourseDocument[]>;
  countSearchPublicCourses(searchTerm: string, category?: string): Promise<number>;

}