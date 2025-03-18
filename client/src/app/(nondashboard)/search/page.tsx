"use client";

import Loading from "@/components/Loading";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useGetPublicCoursesQuery, useSearchCoursesQuery } from "@/state/redux";
import { useRouter, useSearchParams } from "next/navigation";
import { debounce } from "lodash";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import CourseCardSearch from "@/components/CourseCardSearch";
import SelectedCourse from "./SelectedCourse";

const Search = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const { data: allCourses, isLoading: isLoadingAll, isError } = useGetPublicCoursesQuery({}, { skip: !!debouncedTerm });
  const { data: searchedCourses, isLoading: isSearching } = useSearchCoursesQuery({ searchTerm: debouncedTerm }, { skip: !debouncedTerm });

  const courses = useMemo(() => (debouncedTerm ? searchedCourses?.data : allCourses?.data) || [], [searchedCourses, allCourses, debouncedTerm]);

  useEffect(() => {
    if (courses.length > 0) {
      if (id) {
        const course = courses.find((c) => c.courseId === id);
        setSelectedCourse(course || courses[0]);
      } else {
        setSelectedCourse(courses[0]);
      }
    }
  }, [courses, id]);

  const debouncedSearch = useCallback(
    debounce((term) => {
      setDebouncedTerm(term);
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  if (isLoadingAll || isSearching) return <Loading />;
  if (isError || !courses) return <div>Failed to fetch courses</div>;

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    router.push(`/search?id=${course.courseId}`, { scroll: false });
  };

  const handleEnrollNow = (courseId) => {
    router.push(`/payment/${courseId}`, { scroll: false });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="search"
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
      <h1 className="search__title">List of available courses</h1>
      <h2 className="search__subtitle">{courses.length} courses available</h2>
      <div className="search__content">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="search__courses-grid"
        >
          {courses.map((course) => (
            <CourseCardSearch
              key={course.courseId}
              course={course}
              isSelected={selectedCourse?.courseId === course.courseId}
              onClick={() => handleCourseSelect(course)}
            />
          ))}
        </motion.div>

        {selectedCourse && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="search__selected-course"
          >
            <SelectedCourse course={selectedCourse} handleEnrollNow={handleEnrollNow} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Search;
