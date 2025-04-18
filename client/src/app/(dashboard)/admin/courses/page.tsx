"use client";

import React, { useState, useMemo, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
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

// Add export for dynamic rendering
export const dynamic = 'force-dynamic';

const Courses = () => {
  return (
    <Suspense fallback={<Loading />}>
      <CoursesContent />
    </Suspense>
  );
};

const CoursesContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");

  const {
    data,
    isLoading,
    isError,
  } = useGetAdminCoursesQuery({ category: selectedCategory, page, limit });

  const [unlistCourse] = useUnlistCourseMutation();
  const [publishCourse] = usePublishCourseMutation();

  const coursesData = useMemo(
    () => data?.data || { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 },
    [data]
  );

  const { courses, total, totalPages } = coursesData;

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
    if (course.sections?.length && course.sections[0].chapters.length) {
      const firstChapter = course.sections[0].chapters[0];
      router.push(`/user/courses/${course.courseId}/chapters/${firstChapter.chapterId}`, {
        scroll: false,
      });
    } else {
      router.push(`/user/courses/${course.courseId}`, { scroll: false });
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
      router.push(`/admin/courses?${query}`, { scroll: false });
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
    router.push(`/admin/courses?${query}`, { scroll: false });
  };

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    const query = new URLSearchParams({
      page: "1",
      limit: limit.toString(),
      q: searchTerm,
      category: newCategory,
    }).toString();
    router.push(`/admin/courses?${query}`, { scroll: false });
  };

  if (isLoading) return <Loading />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="admin-courses container mx-auto px-4 py-8 w-full"
    >
      <Header title="Admin Courses" subtitle="Manage all courses" />
      <Toolbar onSearch={handleSearchChange} onCategoryChange={handleCategoryChange} />

      {isError ? (
        <div className="text-center text-red-500 mt-4">Error loading courses.</div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center text-gray-500 mt-4">No courses available.</div>
      ) : (
        <>
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
          <div className="admin-courses__pagination flex justify-center items-center gap-4 mt-8">
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
    </motion.div>
  );
};

export default Courses;