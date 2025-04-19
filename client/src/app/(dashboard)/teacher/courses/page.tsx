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
import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState, Suspense } from "react";
import { toast } from "sonner";
import Cookies from "js-cookie";

// Add export for dynamic rendering
export const dynamic = 'force-dynamic';

const Courses = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CoursesContent />
    </Suspense>
  );
};

const CoursesContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const userId = Cookies.get("userId");
  const userName = Cookies.get("userName");

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");

  const {
    data,
    isLoading,
    isError,
  } = useGetTeacherCoursesQuery({ category: selectedCategory, page, limit });

  const [createCourse] = useCreateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();

  const coursesData = useMemo(
    () => data?.data || { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 },
    [data]
  );

  const { courses, total, totalPages } = coursesData;

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
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
        const errorMessage = error as Error;
        toast.error(errorMessage.message || "Failed to delete course");
      }
    }
  };

  const handleCreateCourse = async () => {
    if (!userId) return;

    try {
      await createCourse({
        teacherId: userId,
        teacherName: userName || "Unknown Teacher",
      }).unwrap();
      toast.success("Course created successfully!");
    } catch (error) {
      const errorMessage = error as Error;
      toast.error(errorMessage.message || "Failed to create course");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const query = new URLSearchParams({
        page: newPage.toString(),
        limit: limit.toString(),
        q: searchTerm,
        category: selectedCategory,
      }).toString();
      router.push(`/teacher/courses?${query}`, { scroll: false });
    }
  };

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    const query = new URLSearchParams({
      page: "1",
      limit: limit.toString(),
      q: newSearchTerm,
      category: selectedCategory,
    }).toString();
    router.push(`/teacher/courses?${query}`, { scroll: false });
  };

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    const query = new URLSearchParams({
      page: "1",
      limit: limit.toString(),
      q: searchTerm,
      category: newCategory,
    }).toString();
    router.push(`/teacher/courses?${query}`, { scroll: false });
  };

  return (
    <div className="teacher-courses container mx-auto px-4 py-8">
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
      ) : isError || (!filteredCourses.length && !searchTerm && selectedCategory === "all") ? (
        <div className="text-center py-10 text-gray-500">No courses found.</div>
      ) : (
        <>
          <Toolbar onSearch={handleSearchChange} onCategoryChange={handleCategoryChange} />
          <div className="teacher-courses__grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
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
          <div className="teacher-courses__pagination flex justify-center items-center gap-4 mt-8">
            <Button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2"
            >
              Previous
            </Button>
            <span className="text-lg text-gray-700">
              Page {page} of {totalPages} (Total: {total} courses)
            </span>
            <Button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2"
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Courses;