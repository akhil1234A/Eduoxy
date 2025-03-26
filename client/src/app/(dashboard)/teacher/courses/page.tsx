"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import TeacherCourseCard from "@/components/TeacherCourseCard";
import Toolbar from "@/components/Toolbar";
import { Button } from "@/components/ui/button";
import {
  useCreateCourseMutation,
  useDeleteCourseMutation,
  useGetTeacherCoursesQuery,
} from "@/state/api/coursesApi";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import Cookies from 'js-cookie'

const Courses = () => {
  const router = useRouter();
  const userId = Cookies.get("userId");
  const userName = Cookies.get("userName");
  const {
    data, 
    isLoading,
    isError,
  } = useGetTeacherCoursesQuery({ category: "all" });

  const [createCourse] = useCreateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const courses: Course[] = useMemo(() => data?.data || [], [data]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = course.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchTerm, selectedCategory]);

  const handleEdit = (course: Course) => {
    router.push(`/teacher/courses/${course.courseId}`, { scroll: false });
  };

  const handleDelete = async (course: Course) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await deleteCourse(course.courseId).unwrap();
        toast.success("Course deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete course");
      }
    }
  };

  const handleCreateCourse = async () => {
    if (!userId) return;

    try {
      const result = await createCourse({
        teacherId: userId,
        teacherName: userName || "Unknown Teacher",
      }).unwrap();

    } catch (error) {
      toast.error("Failed to create course");
    }
  };

 
  return (
    <div className="teacher-courses">
      <Header
        title="Courses"
        subtitle="Browse your courses"
        rightElement={
          <Button onClick={handleCreateCourse} className="teacher-courses__header">
            Create Course
          </Button>
        }
      />
      {isLoading ? (
        <Loading />
      ) : isError || !courses.length ? (
        <div className="text-center py-10">No courses found.</div>
      ) : (
        <>
          <Toolbar onSearch={setSearchTerm} onCategoryChange={setSelectedCategory} />
          <div className="teacher-courses__grid">
            {filteredCourses.map((course) => (
              <TeacherCourseCard
                key={course.courseId}
                course={course}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isOwner={course.teacherId === userId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Courses;