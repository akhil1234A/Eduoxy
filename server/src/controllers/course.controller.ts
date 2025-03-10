import { Request, Response } from "express";
import { ICourseService } from "../interfaces/course.service";
import { successResponse, errorResponse, AuthenticatedRequest } from "../types/types";
import { HttpStatus } from "../utils/httpStatus";

export class CourseController {
  constructor(private courseService: ICourseService) {}

  async unlistCourse(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;

    try {
      const course = await this.courseService.unlistCourse(courseId);
      if (!course) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse("Course not found"));
        return;
      }
      res.json(successResponse("Course unlisted successfully", course));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error unlisting course", err.message));
    }
  }

  async publishCourse(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;

    try {
      const course = await this.courseService.publishCourse(courseId);
      if (!course) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse("Course not found"));
        return;
      }
      res.json(successResponse("Course published successfully", course));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error publishing course", err.message));
    }
  }

  async listPublicCourses(req: Request, res: Response): Promise<void> {
    const { category } = req.query;

    try {
      const courses = await this.courseService.listPublicCourses(category as string);
      res.json(successResponse("Courses retrieved successfully", courses));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error retrieving courses", err.message));
    }
  }

  async listAdminCourses(req: Request, res: Response): Promise<void> {
    const { category } = req.query;

    try {
      const courses = await this.courseService.listAdminCourses(category as string);
      res.json(successResponse("All courses retrieved successfully", courses));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error retrieving courses", err.message));
    }
  }

  async listTeacherCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { category } = req.query;
    const teacherId = req.user?.userId;

    if (!teacherId) {
      res.status(HttpStatus.UNAUTHORIZED).json(errorResponse("Unauthorized", "Teacher ID not found"));
      return;
    }

    try {
      const courses = await this.courseService.listTeacherCourses(teacherId, category as string);
      res.json(successResponse("Your courses retrieved successfully", courses));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error retrieving courses", err.message));
    }
  }

  async getCourse(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;

    try {
      const course = await this.courseService.getCourse(courseId);
      if (!course) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse("Course not found"));
        return;
      }
      res.json(successResponse("Course retrieved successfully", course));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error retrieving course", err.message));
    }
  }

  async createCourse(req: Request, res: Response): Promise<void> {
    const { teacherId, teacherName } = req.body;

    try {
      if (!teacherId || !teacherName) {
        res.status(HttpStatus.BAD_REQUEST).json(errorResponse("Teacher ID and name are required"));
        return;
      }

      const course = await this.courseService.createCourse(teacherId, teacherName);
      res.json(successResponse("Course created successfully", course));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error creating course", err.message));
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
          res.status(400).json(errorResponse("Invalid sections format: Must be an array"));
          return;
        }
      }
  
      if (updateData.sections && !Array.isArray(updateData.sections)) {
        res.status(400).json(errorResponse("Invalid sections format: Must be an array"));
        return;
      }
  
      const course = await this.courseService.updateCourse(courseId, userId!, updateData);
      if (!course) {
        res.status(404).json(errorResponse("Course not found or not authorized"));
        return;
      }
  
      res.json(successResponse("Course updated successfully", course));
    } catch (error) {
      const err = error as Error;
      res.status(500).json(errorResponse("Error updating course", err.message));
    }
  }
  

  async deleteCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { courseId } = req.params;
    const userId = req.user?.userId;

    try {
      const course = await this.courseService.deleteCourse(courseId, userId!);
      if (!course) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse("Course not found or not authorized"));
        return;
      }
      res.json(successResponse("Course deleted successfully", course));
    } catch (error) {
      const err = error as Error;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Error deleting course", err.message));
    }
  }
}