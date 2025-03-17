"use client";

import { useState, useCallback } from "react";
import { useGetPublicCoursesQuery, useSearchCoursesQuery } from "@/state/api/coursesApi";
import { debounce } from "lodash";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import CourseCard from "@/components/CourseCard";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  
  // Get all courses when there's no search term
  const { data: allCourses = [], isLoading: isLoadingAll } = useGetPublicCoursesQuery({
    category: "all"
  }, {
    skip: !!debouncedTerm
  });

  // Get searched courses when there's a search term
  const { data: searchedCourses = [], isLoading: isSearching } = useSearchCoursesQuery({
    searchTerm: debouncedTerm,
    category: "all"
  }, {
    skip: !debouncedTerm
  });


  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setDebouncedTerm(term);
    }, 500),
    []
  );

  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const isLoading = isLoadingAll || isSearching;
  const displayedCourses = debouncedTerm ? searchedCourses.data : allCourses.data;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full max-w-xl mx-auto"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCourses.map((course) => (
            <CourseCard key={course.courseId} course={course} />
          ))}
          {displayedCourses.length === 0 && (
            <div className="col-span-full text-center text-gray-500">
              {debouncedTerm ? "No courses found matching your search." : "No courses available."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
