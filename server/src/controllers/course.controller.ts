import { Request, Response } from 'express';
import { ICourseService } from '../interfaces/course.service';
import { ICourseDocument } from '../models/course.model';
import { successResponse, errorResponse, AuthenticatedRequest } from '../types/types';
import { HttpStatus } from '../utils/httpStatus';
import { injectable, inject } from 'inversify';
import TYPES from '../di/types';
import { apiLogger } from '../utils/logger';
import { RESPONSE_MESSAGES } from '../utils/responseMessages';

@injectable()
export class CourseController {
  constructor(@inject(TYPES.ICourseService) private _courseService: ICourseService) {}

  async unlistCourse(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;

    try {
      const course = await this._courseService.unlistCourse(courseId);
      if (!course) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse(RESPONSE_MESSAGES.COURSE.NOT_FOUND));
        return;
      }
      res.json(successResponse(RESPONSE_MESSAGES.COURSE.UNLIST_SUCCESS, course));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.COURSE.UNLIST_ERROR, err.message));
    }
  }

  async publishCourse(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;
    apiLogger.info('Publishing course', { courseId });

    try {
      const course = await this._courseService.publishCourse(courseId);
      if (!course) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse(RESPONSE_MESSAGES.COURSE.NOT_FOUND));
        return;
      }
      res.json(successResponse(RESPONSE_MESSAGES.COURSE.PUBLISH_SUCCESS, course));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.COURSE.PUBLISH_ERROR, err.message));
    }
  }

  async listPublicCourses(req: Request, res: Response): Promise<void> {
    const { category, page = '1', limit = '10' } = req.query;
    apiLogger.info('Listing public courses', { category, page, limit });

    try {
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      const result = await this._courseService.listPublicCourses(category as string, pageNumber, limitNumber);
      res.json(successResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_SUCCESS, result));
    } catch (error) {
      const err = error as Error;
      apiLogger.error('Error retrieving courses', { error: err.message });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_ERROR, err.message));
    }
  }

  async listAdminCourses(req: Request, res: Response): Promise<void> {
    const { category, page = '1', limit = '10' } = req.query;

    try {
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const { courses, total } = await this._courseService.listAdminCourses(category as string, pageNum, limitNum);
      res.json(
        successResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_ALL_SUCCESS, {
          courses,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        })
      );
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_ERROR, err.message));
    }
  }

  async listTeacherCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { category, page = '1', limit = '10' } = req.query;
    const teacherId = req.user?.userId;

    if (!teacherId) {
      res.status(HttpStatus.UNAUTHORIZED).json(errorResponse(RESPONSE_MESSAGES.COURSE.UNAUTHORIZED, 'Teacher ID not found'));
      return;
    }

    try {
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const { courses, total } = await this._courseService.listTeacherCourses(teacherId, category as string, pageNum, limitNum);
      res.json(
        successResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_TEACHER_SUCCESS, {
          courses,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        })
      );
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_ERROR, err.message));
    }
  }

  async getCourse(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;

    try {
      const course = await this._courseService.getCourse(courseId);
      if (!course) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse(RESPONSE_MESSAGES.COURSE.NOT_FOUND));
        return;
      }
      res.json(successResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_SUCCESS, course));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_ERROR, err.message));
    }
  }

  async createCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId;
    const formData = req.body;

    try {
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json(errorResponse(RESPONSE_MESSAGES.COURSE.UNAUTHORIZED, 'User ID not found'));
        return;
      }


      


      const courseData: Partial<ICourseDocument> = {
        teacherId: formData.teacherId,
        teacherName: formData.teacherName,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        image: formData.image,
        price: parseInt(formData.price, 10),
        level: formData.level || 'Beginner',
        status: formData.status || 'Draft',
      };

      if (formData.sections) {
        try {
          courseData.sections = typeof formData.sections === 'string' ? JSON.parse(formData.sections) : formData.sections;
          if (!Array.isArray(courseData.sections)) {
            res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.COURSE.INVALID_SECTIONS));
            return;
          }
        } catch (err) {
          res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.COURSE.INVALID_SECTIONS));
          return;
        }
      }

      const course = await this._courseService.createCourse(courseData);
      apiLogger.info('Course created successfully', { course });
      res.json(successResponse(RESPONSE_MESSAGES.COURSE.CREATE_SUCCESS, course));
    } catch (error) {
      const err = error as Error;
      apiLogger.error('Error creating course', { error: err.stack });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.COURSE.CREATE_ERROR, err.message));
    }
  }

  async updateCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { courseId } = req.params;
    const updateData = { ...req.body };
    const userId = req.user?.userId;

    try {
      if (updateData.sections && typeof updateData.sections === 'string') {
        try {
          updateData.sections = JSON.parse(updateData.sections);
        } catch (err) {
          res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.COURSE.INVALID_SECTIONS));
          return;
        }
      }

      if (updateData.sections && !Array.isArray(updateData.sections)) {
        res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.COURSE.INVALID_SECTIONS));
        return;
      }

      const course = await this._courseService.updateCourse(courseId, userId!, updateData);
      if (!course) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse(RESPONSE_MESSAGES.COURSE.NOT_FOUND_OR_UNAUTHORIZED));
        return;
      }

      res.json(successResponse(RESPONSE_MESSAGES.COURSE.UPDATE_SUCCESS, course));
    } catch (error) {
      const err = error as Error;
      apiLogger.error('Error updating course', { error: err.message });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.COURSE.UPDATE_ERROR, err.message));
    }
  }

  async deleteCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { courseId } = req.params;
    const userId = req.user?.userId;

    try {
      const course = await this._courseService.deleteCourse(courseId, userId!);
      if (!course) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse(RESPONSE_MESSAGES.COURSE.NOT_FOUND_OR_UNAUTHORIZED));
        return;
      }
      res.json(successResponse(RESPONSE_MESSAGES.COURSE.DELETE_SUCCESS, course));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.COURSE.DELETE_ERROR, err.message));
    }
  }

  async searchCourses(req: Request, res: Response): Promise<void> {
    const { q: searchTerm, category, page = '1', limit = '10' } = req.query;
    apiLogger.info('Searching courses', { searchTerm, category, page, limit });

    try {
      if (!searchTerm || typeof searchTerm !== 'string') {
        res.json(
          successResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_SUCCESS, {
            courses: [],
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          })
        );
        return;
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const { courses, total } = await this._courseService.searchCourses(
        searchTerm as string,
        category as string,
        pageNum,
        limitNum
      );

      res.json(
        successResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_SUCCESS, {
          courses,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        })
      );
      apiLogger.info('Courses retrieved successfully', { courses });
    } catch (error) {
      const err = error as Error;
      apiLogger.error('Error searching courses', { error: err.message });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        errorResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_ERROR, err.message)
      );
    }
  }
}