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
import { useSelector } from "react-redux";
import { RootState } from "@/state/redux";
import { toast } from "sonner";

const Courses = () => {
  const router = useRouter();
  const { user, token } = useSelector((state: RootState) => state.auth);

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
    if (!token || !user) return;

    try {
      const result = await createCourse({
        teacherId: user.id,
        teacherName: user.name || "Unknown Teacher",
      }).unwrap();
      router.push(`/teacher/courses/${result.courseId}`, { scroll: false });
    } catch (error) {
      toast.error("Failed to create course");
    }
  };

  if (isLoading) return <Loading />;
  if (isError || !courses.length) {
    return (
      <div className="teacher-courses">
        <Header title="Courses" subtitle="Browse your courses" />
        <div>Error loading courses or no courses available.</div>
      </div>
    );
  }

  return (
    <div className="teacher-courses">
      <Header
        title="Courses"
        subtitle="Browse your courses"
        rightElement={
          <Button
            onClick={handleCreateCourse}
            className="teacher-courses__header"
            disabled={!token}
          >
            Create Course
          </Button>
        }
      />
      <Toolbar onSearch={setSearchTerm} onCategoryChange={setSelectedCategory} />
      <div className="teacher-courses__grid">
        {filteredCourses.map((course) => (
          <TeacherCourseCard
            key={course.courseId}
            course={course}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isOwner={course.teacherId === user?.id}
          />
        ))}
      </div>
    </div>
  );
};

export default Courses;