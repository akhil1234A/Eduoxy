"use client";

import React, { useMemo, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Toolbar from "@/components/Toolbar";
import CourseCard from "@/components/CourseCard";
import Loading from "@/components/Loading";
import { useGetUserEnrolledCoursesQuery } from "@/state/redux";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";

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
  const userId = Cookies.get("userId");

  const {
    data: courseResponse,
    isLoading,
    isError,
  } = useGetUserEnrolledCoursesQuery(
    { userId: userId ?? "", page, limit },
    { skip: !userId }
  );

  const coursesData = useMemo(
    () => courseResponse?.data || { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 },
    [courseResponse]
  );

  const { courses, total, totalPages } = coursesData;

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchTerm, selectedCategory]);

  const handleGoToCourse = (course: Course) => {
    if (course.sections && course.sections.length > 0 && course.sections[0].chapters.length > 0) {
      const firstChapter = course.sections[0].chapters[0];
      router.push(
        `/user/courses/${course.courseId}/chapters/${firstChapter.chapterId}`,
        { scroll: false }
      );
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
      router.push(`/user/courses?${query}`, { scroll: false });
    }
  };

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    const query = new URLSearchParams({
      page: "1", // Reset to page 1 on search change
      limit: limit.toString(),
      q: newSearchTerm,
      category: selectedCategory,
    }).toString();
    router.push(`/user/courses?${query}`, { scroll: false });
  };

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    const query = new URLSearchParams({
      page: "1", // Reset to page 1 on category change
      limit: limit.toString(),
      q: searchTerm,
      category: newCategory,
    }).toString();
    router.push(`/user/courses?${query}`, { scroll: false });
  };

  if (isLoading) return <Loading />;
  if (isError || (!filteredCourses.length && !searchTerm && selectedCategory === "all")) {
    return (
      <div className="user-courses container mx-auto px-4 py-8">
        <Header title="My Courses" subtitle="View your enrolled courses" />
        <div className="text-center text-gray-500">You are not enrolled in any courses yet.</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="user-courses container mx-auto px-4 py-8"
    >
      <Header title="My Courses" subtitle="View your enrolled courses" />
      <Toolbar onSearch={handleSearchChange} onCategoryChange={handleCategoryChange} />
      {filteredCourses.length > 0 ? (
        <div className="user-courses__grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.courseId}
              course={course}
              onGoToCourse={handleGoToCourse}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No courses match your search or category.</p>
      )}
      <div className="user-courses__pagination flex justify-center items-center gap-4 mt-8">
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
    </motion.div>
  );
};

export default Courses;