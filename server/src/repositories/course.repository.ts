import { Model } from "mongoose";
import { ICourseRepository } from "../interfaces/course.repository";
import { BaseRepository } from "./base.repository";
import Course, { ICourseDocument} from "../models/course.model";
import {CourseLevel, CourseStatus, ChapterType} from '../types/types';
import { v4 as uuidv4 } from "uuid";
import { inject, injectable } from "inversify";
import TYPES from "../di/types";
@injectable()
export class CourseRepository extends BaseRepository<ICourseDocument> implements ICourseRepository {
  constructor(@inject(TYPES.CourseModel) model: Model<ICourseDocument>) {
    super(model);
  }

  async findByCourseId(courseId: string): Promise<ICourseDocument | null> {
    return this.model.findOne({ courseId }).exec();
  }

  async findPublicCourses(category?: string): Promise<ICourseDocument[]> {
    const query: Record<string, unknown> = { status: CourseStatus.Published };
    if (category && category !== "all") {
      query["category"] = category;
    }
    return this.model.find(query).exec();
  }

  async findAdminCourses(category?: string): Promise<ICourseDocument[]> {
    const query = category && category !== "all" ? { category } : {};
    return this.model.find(query).exec();
  }

  async findTeacherCourses(teacherId: string, category?: string): Promise<ICourseDocument[]> {
    const query: Record<string, unknown> = { teacherId };
    if (category && category !== "all") {
      query["category"] = category;
    }
    return this.model.find(query).exec();
  }

  async unlist(courseId: string): Promise<ICourseDocument | null> {
    return this.model.findOneAndUpdate(
      { courseId },
      { status: CourseStatus.Unlisted },
      { new: true }
    ).exec();
  }

  async publish(courseId: string): Promise<ICourseDocument | null> {
    return this.model.findOneAndUpdate(
      { courseId },
      { status: CourseStatus.Published },
      { new: true }
    ).exec();
  }

  async updateByCourseId(courseId: string, teacherId: string, updateData: Partial<ICourseDocument>): Promise<ICourseDocument | null> {
    const course = await this.model.findOne({ courseId, teacherId }).exec();
    if (!course) return null;

    if (updateData.price) {
      const price = parseInt(updateData.price as unknown as string);
      if (isNaN(price)) throw new Error("Invalid price format");
      updateData.price = price;
    }

    if (updateData.sections) {
      updateData.sections = (updateData.sections as any[]).map((section) => ({
        ...section,
        sectionId: section.sectionId || uuidv4(),
        chapters: section.chapters.map((chapter: any) => ({
          ...chapter,
          chapterId: chapter.chapterId || uuidv4(),
        })),
      }));
    }

    Object.assign(course, updateData);
    return course.save();
  }

  async deleteByCourseId(courseId: string, teacherId: string): Promise<ICourseDocument | null> {
    return this.model.findOneAndDelete({ courseId, teacherId }).exec();
  }

  async createCourse(data: Partial<ICourseDocument>): Promise<ICourseDocument> {
    const newCourse = new this.model({
      courseId: uuidv4(),
      title: "Untitled Course",
      description: "",
      category: "Uncategorized",
      image: "",
      price: 0,
      level: CourseLevel.Beginner, 
      status: CourseStatus.Draft, 
      sections: [],
      enrollments: [],
      ...data,
    });
    return newCourse.save();
  }

  async findById(id: string): Promise<ICourseDocument | null> {
    return this.findByCourseId(id);
  }

  async update(id: string, data: Partial<ICourseDocument>): Promise<ICourseDocument | null> {
    return this.model.findOneAndUpdate({ courseId: id }, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findOneAndDelete({ courseId: id }).exec();
    return result !== null;
  }

  async addEnrollment(courseId: string, userId: string, studentName: string): Promise<ICourseDocument | null> {
    return this.model.findOneAndUpdate(
      { courseId },
      { $addToSet: { enrollments: { userId, studentName } } },
      { new: true }
    ).exec();
  }

  async searchPublicCourses(searchTerm: string, category?: string): Promise<ICourseDocument[]> {
    const query: Record<string, any> = { 
      status: CourseStatus.Published,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    if (category && category !== "all") {
      query.category = category;
    }
    
    return this.model.find(query).exec();
  }
}