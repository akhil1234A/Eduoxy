import { IBaseRepository } from "../interfaces/base.repository";
import { ICourseDocument } from "../models/course.model";

export interface ICourseRepository extends IBaseRepository<ICourseDocument> {
  create(data: Partial<ICourseDocument>): Promise<ICourseDocument>;
  findByCourseId(courseId: string): Promise<ICourseDocument | null>;
  findPublicCourses(category?: string): Promise<ICourseDocument[]>;
  findAdminCourses(category?: string): Promise<ICourseDocument[]>;
  findTeacherCourses(teacherId: string, category?: string): Promise<ICourseDocument[]>;
  unlist(courseId: string): Promise<ICourseDocument | null>;
  publish(courseId: string): Promise<ICourseDocument | null>;
  updateByCourseId(courseId: string, teacherId: string, updateData: Partial<ICourseDocument>): Promise<ICourseDocument | null>;
  deleteByCourseId(courseId: string, teacherId: string): Promise<ICourseDocument | null>;
  addEnrollment(courseId: string, userId: string): Promise<ICourseDocument | null>;
}