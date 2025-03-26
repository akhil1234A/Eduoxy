"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Toolbar from "@/components/Toolbar";
import CourseCard from "@/components/CourseCard";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useGetAdminCoursesQuery,
  useUnlistCourseMutation,
  usePublishCourseMutation,
} from "@/state/api/coursesApi";


const Courses = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const {
    data,
    isLoading,
    isError,
  } = useGetAdminCoursesQuery({ category: selectedCategory });

  const [unlistCourse] = useUnlistCourseMutation();
  const [publishCourse] = usePublishCourseMutation();


  const courses = useMemo(() => data?.data ?? [], [data]);

  const filteredCourses = useMemo(() => {
    if (!courses.length) return [];
  
    return courses.filter((course: Course) => {
      const title = course?.title?.toLowerCase() ?? "";
      const category = course?.category ?? "";
  
      const matchesSearch = title.includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || category === selectedCategory;
  
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchTerm, selectedCategory]);
  

  const handleUnlist = async (courseId: string) => {
    try {
      await unlistCourse(courseId).unwrap();
      toast.success("Course unlisted successfully!");
    } catch (error) {
      console.error("Error unlisting course:", error);
      toast.error("Failed to unlist course");
    }
  };

  const handlePublish = async (courseId: string) => {
    try {
      await publishCourse(courseId).unwrap();
      toast.success("Course published successfully!");
    } catch (error) {
      console.error("Error publishing course:", error);
      toast.error("Failed to publish course");
    }
  };

  const handleGoToCourse = (course: Course) => {
    if (
      course.sections?.length &&
      course.sections[0].chapters.length
    ) {
      const firstChapter = course.sections[0].chapters[0];
      router.push(`/user/courses/${course.courseId}/chapters/${firstChapter.chapterId}`, {
        scroll: false,
      });
    } else {
      router.push(`/user/courses/${course.courseId}`, { scroll: false });
    }
  };

  if (isLoading) return <Loading />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="admin-courses w-full"
    >
      <Header title="Admin Courses" subtitle="Manage all courses" />
      <Toolbar onSearch={setSearchTerm} onCategoryChange={setSelectedCategory} />

      {isError ? (
        <div className="text-center text-red-500 mt-4">Error loading courses.</div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center text-gray-400 mt-4">No courses available.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {filteredCourses.map((course) => (
            <div key={course.courseId} className="course-card-wrapper">
              <CourseCard course={course} onGoToCourse={handleGoToCourse} />
              <div className="course-card-actions mt-4 flex justify-between gap-2">
                {course.status !== "Unlisted" && (
                  <Button
                    onClick={() => handleUnlist(course.courseId)}
                    variant="outline"
                    size="sm"
                    className="w-full bg-customgreys-primarybg text-customgreys-dirtyGrey hover:bg-customgreys-darkerGrey hover:text-white-50"
                  >
                    Unlist
                  </Button>
                )}
                {course.status !== "Published" && (
                  <Button
                    onClick={() => handlePublish(course.courseId)}
                    variant="outline"
                    size="sm"
                    className="w-full bg-customgreys-primarybg text-customgreys-dirtyGrey hover:bg-customgreys-darkerGrey hover:text-white-50"
                  >
                    Publish
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Courses;
