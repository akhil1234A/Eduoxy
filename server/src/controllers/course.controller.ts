import { Request, Response } from "express";
import { ICourseService } from "../interfaces/course.service";
import { successResponse, errorResponse, AuthenticatedRequest } from "../types/types";
import { HttpStatus } from "../utils/httpStatus";
import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { apiLogger } from "../utils/logger";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";
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
    apiLogger.info("Publishing course", { courseId });

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
    const { category } = req.query;
    apiLogger.info("Listing public courses", { category });

    try {
      const courses = await this._courseService.listPublicCourses(category as string);
      res.json(successResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_SUCCESS, courses));
      
    } catch (error) {
      const err = error as Error;
      apiLogger.error("Error retrieving courses", { error: err.message });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_ERROR, err.message));
    }
  }

  async listAdminCourses(req: Request, res: Response): Promise<void> {
    const { category } = req.query;

    try {
      const courses = await this._courseService.listAdminCourses(category as string);
      res.json(successResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_ALL_SUCCESS, courses));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_ERROR, err.message));
    }
  }

  async listTeacherCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { category } = req.query;
    const teacherId = req.user?.userId;

    if (!teacherId) {
      res.status(HttpStatus.UNAUTHORIZED).json(errorResponse(RESPONSE_MESSAGES.COURSE.UNAUTHORIZED, "Teacher ID not found"));
      return;
    }

    try {
      const courses = await this._courseService.listTeacherCourses(teacherId, category as string);
      res.json(successResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_TEACHER_SUCCESS, courses));
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

  async createCourse(req: Request, res: Response): Promise<void> {
    const { teacherId, teacherName } = req.body;

    try {
      if (!teacherId || !teacherName) {
        res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.COURSE.TEACHER_REQUIRED));
        return;
      }

      const course = await this._courseService.createCourse(teacherId, teacherName);
      apiLogger.info("Course created successfully", { course });
      res.json(successResponse(RESPONSE_MESSAGES.COURSE.CREATE_SUCCESS, course));
    } catch (error) {
      const err = error as Error;
      apiLogger.error("Error creating course", { error: err.stack });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.COURSE.CREATE_ERROR, err.message));
    }
  }

  async updateCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { courseId } = req.params;
    const updateData = { ...req.body };
    const userId = req.user?.userId;
  
    try {
      
      if (updateData.sections && typeof updateData.sections === "string") {
        try {
          updateData.sections = JSON.parse(updateData.sections);
        } catch (err) {
          res.status(400).json(errorResponse(RESPONSE_MESSAGES.COURSE.INVALID_SECTIONS));
          return;
        }
      }
  
      if (updateData.sections && !Array.isArray(updateData.sections)) {
        res.status(400).json(errorResponse(RESPONSE_MESSAGES.COURSE.INVALID_SECTIONS));
        return;
      }
  
      const course = await this._courseService.updateCourse(courseId, userId!, updateData);
      if (!course) {
        res.status(404).json(errorResponse(RESPONSE_MESSAGES.COURSE.NOT_FOUND_OR_UNAUTHORIZED));
        return;
      }
  
      res.json(successResponse(RESPONSE_MESSAGES.COURSE.UPDATE_SUCCESS, course));
    } catch (error) {
      const err = error as Error;
      apiLogger.error("Error updating course", { error: err.message });
      res.status(500).json(errorResponse(RESPONSE_MESSAGES.COURSE.UPDATE_ERROR, err.message));
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
    const { q: searchTerm, category } = req.query;
    apiLogger.info("Searching courses", { searchTerm, category });
    try {
      if (!searchTerm || typeof searchTerm !== 'string') {
        res.json(successResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_SUCCESS, []));
        return;
      }

      const courses = await this._courseService.searchCourses(
        searchTerm,
        category as string
      );
      res.json(successResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_SUCCESS, courses));
      apiLogger.info("Courses retrieved successfully", { courses });
    } catch (error) {
      const err = error as Error;
      apiLogger.error("Error searching courses", { error: err.message });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        errorResponse(RESPONSE_MESSAGES.COURSE.RETRIEVE_ERROR, err.message)
      );
    }
  }
}