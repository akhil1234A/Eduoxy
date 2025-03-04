import { Request, Response } from "express";
import Course from "../models/courseModel";
import { v4 as uuidv4 } from "uuid";

import { successResponse, errorResponse, AuthenticatedRequest } from "../types/types";

export const listCourses = async (req: Request, res: Response): Promise<void> => {
  const { category } = req.query;
  try {
    const courses = category && category !== "all"
      ? await Course.find({ category })
      : await Course.find();
      res.json(successResponse("Courses retrieved successfully", courses));  
    } catch (error: any) {
      res.status(500).json(errorResponse("Error retrieving courses", error.message));
  }
};

export const getCourse = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;
  try {
    const course = await Course.findOne({courseId});
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }
    res.json(successResponse("Course retrieved successfully", course));
  } catch (error:any) {
    res.status(500).json(errorResponse("Error retrieving course", error.message));
  }
};

export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId, teacherName } = req.body;
    if (!teacherId || !teacherName) {
      res.status(400).json({ message: "Teacher Id and name are required" });
      return;
    }
    const newCourse = new Course({
      courseId: uuidv4(),
      teacherId,
      teacherName,
      title: "Untitled Course",
      description: "",
      category: "Uncategorized",
      image: "",
      price: 0,
      level: "Beginner",
      status: "Draft",
      sections: [],
      enrollments: [],
    });
    
    await newCourse.save();
    res.json(successResponse("Course created successfully", newCourse));
  } catch (error:any) {
    res.status(500).json(errorResponse("Error creating course", error.message));
  }
};



export const updateCourse = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const updateData = { ...req.body };
  const userId = req.user?.userId; 
  
  try {
    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json(errorResponse("Course not found"));
      return;
    }
    if (course.teacherId !== userId) {
      res.status(403).json(errorResponse("Not authorized to update this course"));
      return;
    }
    if (updateData.price) {
      const price = parseInt(updateData.price);
      if (isNaN(price)) {
        res.status(400).json(errorResponse("Invalid price format", "Price must be a valid number"));
        return;
      }
      updateData.price = price * 100;
    }
    if (updateData.sections) {
      if (typeof updateData.sections === "string") {
        updateData.sections = JSON.parse(updateData.sections); 
      }
      updateData.sections = updateData.sections.map((section: any) => ({
        ...section,
        sectionId: section.sectionId || uuidv4(),
        chapters: section.chapters.map((chapter: any) => ({
          ...chapter,
          chapterId: chapter.chapterId || uuidv4(),
        })),
      }));
    }
    
    Object.assign(course, updateData);
  
    await course.save();
    res.json(successResponse("Course updated successfully", course));
  } catch (error: unknown) {
    console.error("Error updating course:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json(errorResponse("Error updating course", errorMessage));
  }
};



export const deleteCourse = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  try {
    const course = await Course.findOneAndDelete({ 
      courseId, 
      teacherId: userId 
    });

    if (!course) {
      res.status(404).json(errorResponse("Course not found or not authorized"));
      return;
    }

    res.json(successResponse("Course deleted successfully", course));
  } catch (error:any) {
    res.status(500).json(errorResponse("Error deleting course", error.message));
  }
};



