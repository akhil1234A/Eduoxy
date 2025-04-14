"use client";

import Loading from "@/components/Loading";
import { useState, useMemo, useCallback } from "react";
import { useGetPublicCoursesQuery, useSearchCoursesQuery } from "@/state/redux";
import { useRouter } from "next/navigation";
import { debounce } from "lodash";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import CourseCardSearch from "@/components/CourseCardSearch";

const Search = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  const { data: allCourses, isLoading: isLoadingAll, isError } = useGetPublicCoursesQuery({}, { skip: !!debouncedTerm });
  const { data: searchedCourses, isLoading: isSearching } = useSearchCoursesQuery({ searchTerm: debouncedTerm }, { skip: !debouncedTerm });

  const courses = useMemo(() => (debouncedTerm ? searchedCourses?.data : allCourses?.data) || [], [searchedCourses, allCourses, debouncedTerm]);

  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      setDebouncedTerm(term);
    }, 500),
    []
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  const handleCourseSelect = (course: Course) => {
    router.push(`/search/${course.courseId}`, { scroll: false }); 
  };

  if (isLoadingAll || isSearching) return <Loading />;
  if (isError || !courses) return <div>Failed to fetch courses</div>;

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
      <h2 className="search__subtitle text-lg text-gray-500 text-center mb-6">{courses.length} courses available</h2>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="search__courses-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6" 
      >
        {courses.map((course) => (
          <CourseCardSearch
            key={course.courseId}
            course={course}
            onClick={() => handleCourseSelect(course)}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Search;