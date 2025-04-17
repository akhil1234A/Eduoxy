"use client";

import Loading from "@/components/Loading";
import { useState, useMemo, useCallback } from "react";
import { useGetPublicCoursesQuery, useSearchCoursesQuery } from "@/state/redux";
import { useRouter, useSearchParams } from "next/navigation";
import { debounce } from "lodash";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CourseCardSearch from "@/components/CourseCardSearch";

const Search = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [debouncedTerm, setDebouncedTerm] = useState(searchParams.get("q") || "");

  const { data: allCoursesData, isLoading: isLoadingAll, isError: isErrorAll } = useGetPublicCoursesQuery(
    { page, limit },
    { skip: !!debouncedTerm }
  );
  const { data: searchedCoursesData, isLoading: isSearching, isError: isErrorSearch } = useSearchCoursesQuery(
    { searchTerm: debouncedTerm, page, limit },
    { skip: !debouncedTerm }
  );

  const coursesData = useMemo(
    () => (debouncedTerm ? searchedCoursesData?.data : allCoursesData?.data) || { courses: [], total: 0, page: 1, limit: 10, totalPages: 0 },
    [searchedCoursesData, allCoursesData, debouncedTerm]
  );

  const { courses, total, totalPages } = coursesData;

  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      setDebouncedTerm(term);
    }, 500),
    []
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSearchTerm = e.target.value;
      setSearchTerm(newSearchTerm);
      debouncedSearch(newSearchTerm);

      const query = new URLSearchParams({
        q: newSearchTerm,
        page: "1",
        limit: limit.toString(),
      }).toString();
      router.push(`/search?${query}`, { scroll: false });
    },
    [debouncedSearch, router, limit]
  );

  const handleCourseSelect = (course: Course) => {
    router.push(`/search/${course.courseId}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const query = new URLSearchParams({
        q: searchTerm,
        page: newPage.toString(),
        limit: limit.toString(),
      }).toString();
      router.push(`/search?${query}`, { scroll: false });
    }
  };

  if (isLoadingAll || isSearching) return <Loading />;
  if (isErrorAll || isErrorSearch) return <div>Failed to fetch courses</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="search container mx-auto px-4 py-8"
    >
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full max-w-xl mx-auto"
        />
      </div>
      <h1 className="search__title text-3xl font-bold text-center mb-2">List of available courses</h1>
      <h2 className="search__subtitle text-lg text-gray-500 text-center mb-6">
        {total} courses available
      </h2>
      {courses.length > 0 ? (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="search__courses-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
        >
          {courses.map((course: Course) => (
            <CourseCardSearch
              key={course.courseId}
              course={course}
              onClick={() => handleCourseSelect(course)}
            />
          ))}
        </motion.div>
      ) : (
        <p className="text-center text-gray-500">No courses found.</p>
      )}
      <div className="search__pagination flex justify-center items-center gap-4 mt-8">
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

export default Search;