import { Model } from 'mongoose';
import { ICourseRepository } from '../interfaces/course.repository';
import { BaseRepository } from './base.repository';
import Course, { ICourseDocument } from '../models/course.model';
import { CourseLevel, CourseStatus, ChapterType } from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { inject, injectable } from 'inversify';
import TYPES from '../di/types';

/**
 * CourseRepository class is responsible for interacting with the Course model.
 */
@injectable()
export class CourseRepository extends BaseRepository<ICourseDocument> implements ICourseRepository {
  constructor(@inject(TYPES.CourseModel) model: Model<ICourseDocument>) {
    super(model);
  }

  /**
   * Finds a course by its courseId.
   * @param courseId - The ID of the course to find.
   * @returns A promise that resolves to the found course or null if not found.
   */
  async findByCourseId(courseId: string): Promise<ICourseDocument | null> {
    return this.model.findOne({ courseId }).exec();
  }

/**
 * This methods list all courses that available for public. with pagination and category filter.
 * @param category 
 * @param skip 
 * @param limit 
 * @returns ICourseDocument[] list of courses
 */
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

  /**
   * This method counts the number of public courses available.
   * @param category - The category to filter by (optional).
   * @returns A promise that resolves to the count of public courses.
   */
  async countPublicCourses(category?: string): Promise<number> {
    const query: Record<string, unknown> = { status: CourseStatus.Published };
    if (category && category !== 'all') {
      query['category'] = category;
    }
    return this.model.countDocuments(query).exec();
  }

  /**
   * This method find all courses that are created, visible to admin 
   * @param category 
   * @param skip 
   * @param limit 
   * @returns 
   */
  async findAdminCourses(category?: string, skip: number = 0, limit: number = 10): Promise<ICourseDocument[]> {
    const query = category && category !== 'all' ? { category } : {};
    return this.model
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  /**
   * This method counts the number of courses available for admin.
   * @param category - The category to filter by (optional).
   * @returns A promise that resolves to the count of admin courses.
   */
  async countAdminCourses(category?: string): Promise<number> {
    const query = category && category !== 'all' ? { category } : {};
    return this.model.countDocuments(query).exec();
  }

  /**
   * This method finds all courses created by a specific teacher.
   * @param teacherId 
   * @param category 
   * @param skip 
   * @param limit 
   * @returns 
   */
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

  /**
   * This method counts the number of courses created by a specific teacher.
   * @param teacherId 
   * @param category 
   * @returns 
   */
  async countTeacherCourses(teacherId: string, category?: string): Promise<number> {
    const query: Record<string, unknown> = { teacherId };
    if (category && category !== 'all') {
      query['category'] = category;
    }
    return this.model.countDocuments(query).exec();
  }

  /**
   * This method lists a course by changing its status to "listed". - By Admin 
   * @param courseId 
   * @returns 
   */
  async unlist(courseId: string): Promise<ICourseDocument | null> {
    return this.model
      .findOneAndUpdate({ courseId }, { status: CourseStatus.Unlisted }, { new: true })
      .exec();
  }

  /**
   * This method allow teacher ot publish a course 
   * @param courseId 
   * @returns 
   */
  async publish(courseId: string): Promise<ICourseDocument | null> {
    return this.model
      .findOneAndUpdate({ courseId }, { status: CourseStatus.Published }, { new: true })
      .exec();
  }

  /**
   * This method allows a teacher to update a course by its courseId.
   * @param courseId 
   * @param teacherId 
   * @param updateData 
   * @returns 
   */
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

  /**
   * This method allows a teacher to delete a course by its courseId.
   * @param courseId 
   * @param teacherId 
   * @returns 
   */
  async deleteByCourseId(courseId: string, teacherId: string): Promise<ICourseDocument | null> {
    return this.model.findOneAndDelete({ courseId, teacherId }).exec();
  }

  /**
   * This method creates a new course in the database.
   * @param ICourseDocument
   * @returns 
   */
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

  /**
   * This method finds a course by its ID.
   * @param id - The ID of the course to find.
   * @returns A promise that resolves to the found course or null if not found.
   */
  async findById(id: string): Promise<ICourseDocument | null> {
    return this.findByCourseId(id);
  }

  /**
   * This method updates a course by its ID.
   * @param id - The ID of the course to update.
   * @param data - The data to update the course with.
   * @returns A promise that resolves to the updated course or null if not found.
   */
  async update(id: string, data: Partial<ICourseDocument>): Promise<ICourseDocument | null> {
    return this.model.findOneAndUpdate({ courseId: id }, data, { new: true }).exec();
  }

  /**
   * This method deletes a course by its ID.
   * @param id - The ID of the course to delete.
   * @returns A promise that resolves to true if the course was deleted, false otherwise.
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.model.findOneAndDelete({ courseId: id }).exec();
    return result !== null;
  }

  /**
   * This medhod adds an enrollment to a course.
   * @param courseId 
   * @param userId 
   * @param studentName 
   * @returns 
   */
  async addEnrollment(courseId: string, userId: string, studentName: string): Promise<ICourseDocument | null> {
    return this.model
      .findOneAndUpdate(
        { courseId },
        { $addToSet: { enrollments: { userId, studentName } } },
        { new: true }
      )
      .exec();
  }

  /**
   * This method is for searching functionality with category filter.
   * @param searchTerm 
   * @param category 
   * @param skip 
   * @param limit 
   * @returns 
   */
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

  /**
   * This method counts the number of public courses that match the search term and category.
   * exists for pagination purpose 
   * @param searchTerm 
   * @param category 
   * @returns 
   */
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