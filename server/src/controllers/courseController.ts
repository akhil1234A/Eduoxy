import { Request, Response } from "express";
import Course from "../models/course.model";
import { v4 as uuidv4 } from "uuid";

import { successResponse, errorResponse, AuthenticatedRequest } from "../types/types";


export const unlistCourse = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;

  try {
    const course = await Course.findOneAndUpdate(
      { courseId },
      { status: "Unlisted" },
      { new: true } 
    );

    if (!course) {
      res.status(404).json(errorResponse("Course not found", "Course not found"));
      return;
    }

    res.json(successResponse("Course unlisted successfully", course));
  } catch (error: any) {
    res.status(500).json(errorResponse("Error unlisting course", error.message));
  }
};


export const publishCourse = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;

  try {
    const course = await Course.findOneAndUpdate(
      { courseId },
      { status: "Published" },
      { new: true } 
    );

    if (!course) {
      res.status(404).json(errorResponse("Course not found", "Course not found"));
      return;
    }

    res.json(successResponse("Course published successfully", course));
  } catch (error: any) {
    res.status(500).json(errorResponse("Error publishing course", error.message));
  }
};

export const listPublicCourses = async (req: Request, res: Response): Promise<void> => {
  const { category } = req.query;
  try {
    const query: Record<string, unknown> = { status: "Published"};
    if(category && category !=="all"){
      query["category"] = category; 
    }
    const courses = await Course.find(query);
    res.json(successResponse("Courses retrieved successfully", courses));  
    } catch (error: any) {
      res.status(500).json(errorResponse("Error retrieving courses", error.message));
  }
};

export const listAdminCourses = async (req: Request, res: Response): Promise<void> => {
  const { category } = req.query;
  try {
    const query = category && category !== "all" ? { category: category as string } : {};
    const courses = await Course.find(query);
    res.json(successResponse("All courses retrieved successfully", courses));
  } catch (error: any) {
    res.status(500).json(errorResponse("Error retrieving courses", error.message));
  }
};

export const listTeacherCourses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { category } = req.query;
  const teacherId = req.user?.userId; 

  if (!teacherId) {
    res.status(401).json(errorResponse("Unauthorized", "Teacher ID not found"));
    return;
  }

  try {
    const query: Record<string, unknown> = { teacherId };
    if (category && category !== "all") {
      query["category"] = category;
    }
    const courses = await Course.find(query);
    res.json(successResponse("Your courses retrieved successfully", courses));
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



