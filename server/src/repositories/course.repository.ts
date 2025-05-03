import { Model } from 'mongoose';
import { ICourseRepository } from '../interfaces/course.repository';
import { BaseRepository } from './base.repository';
import Course, { ICourseDocument } from '../models/course.model';
import { CourseLevel, CourseStatus, ChapterType } from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { inject, injectable } from 'inversify';
import TYPES from '../di/types';

@injectable()
export class CourseRepository extends BaseRepository<ICourseDocument> implements ICourseRepository {
  constructor(@inject(TYPES.CourseModel) model: Model<ICourseDocument>) {
    super(model);
  }

  async findByCourseId(courseId: string): Promise<ICourseDocument | null> {
    return this.model.findOne({ courseId }).exec();
  }

  async findPublicCourses(category?: string, skip?: number, limit?: number): Promise<ICourseDocument[]> {
    const query: Record<string, unknown> = { status: CourseStatus.Published };
    if (category && category !== 'all') {
      query['category'] = category;
    }
    return this.model
      .find(query)
      .skip(skip || 0)
      .limit(limit || 10)
      .exec();
  }

  async countPublicCourses(category?: string): Promise<number> {
    const query: Record<string, unknown> = { status: CourseStatus.Published };
    if (category && category !== 'all') {
      query['category'] = category;
    }
    return this.model.countDocuments(query).exec();
  }

  async findAdminCourses(category?: string, skip: number = 0, limit: number = 10): Promise<ICourseDocument[]> {
    const query = category && category !== 'all' ? { category } : {};
    return this.model
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countAdminCourses(category?: string): Promise<number> {
    const query = category && category !== 'all' ? { category } : {};
    return this.model.countDocuments(query).exec();
  }

  async findTeacherCourses(
    teacherId: string,
    category?: string,
    skip: number = 0,
    limit: number = 10
  ): Promise<ICourseDocument[]> {
    const query: Record<string, unknown> = { teacherId };
    if (category && category !== 'all') {
      query['category'] = category;
    }
    return this.model
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countTeacherCourses(teacherId: string, category?: string): Promise<number> {
    const query: Record<string, unknown> = { teacherId };
    if (category && category !== 'all') {
      query['category'] = category;
    }
    return this.model.countDocuments(query).exec();
  }

  async unlist(courseId: string): Promise<ICourseDocument | null> {
    return this.model
      .findOneAndUpdate({ courseId }, { status: CourseStatus.Unlisted }, { new: true })
      .exec();
  }

  async publish(courseId: string): Promise<ICourseDocument | null> {
    return this.model
      .findOneAndUpdate({ courseId }, { status: CourseStatus.Published }, { new: true })
      .exec();
  }

  async updateByCourseId(
    courseId: string,
    teacherId: string,
    updateData: Partial<ICourseDocument>
  ): Promise<ICourseDocument | null> {
    const course = await this.model.findOne({ courseId, teacherId }).exec();
    if (!course) return null;

    if (updateData.price) {
      const price = parseInt(updateData.price as unknown as string);
      if (isNaN(price)) throw new Error('Invalid price format');
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
      title: data.title || 'Untitled Course',
      description: data.description || '',
      category: data.category || 'Uncategorized',
      image: data.image || '',
      price: data.price || 0,
      level: data.level || CourseLevel.Beginner,
      status: data.status || CourseStatus.Draft,
      sections: data.sections || [],
      enrollments: data.enrollments || [],
      teacherId: data.teacherId,
      teacherName: data.teacherName,
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
    return this.model
      .findOneAndUpdate(
        { courseId },
        { $addToSet: { enrollments: { userId, studentName } } },
        { new: true }
      )
      .exec();
  }

  async searchPublicCourses(
    searchTerm: string,
    category?: string,
    skip: number = 0,
    limit: number = 10
  ): Promise<ICourseDocument[]> {
    const query: Record<string, any> = {
      status: CourseStatus.Published,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    return this.model
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countSearchPublicCourses(searchTerm: string, category?: string): Promise<number> {
    const query: Record<string, any> = {
      status: CourseStatus.Published,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    return this.model.countDocuments(query).exec();
  }
}