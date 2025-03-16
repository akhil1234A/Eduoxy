import AccordionSections from "@/components/AccordionSections";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import React from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const SelectedCourse = ({ course, handleEnrollNow }: SelectedCourseProps) => {
  const userId = Cookies.get("userId");
  const router = useRouter();
  const isEnrolled = course.enrollments?.some(
    (enrollment) => enrollment.userId === userId
  );

  const handleCourseAction = () => {
    if (isEnrolled) {
      if (
        course.sections &&
        course.sections.length > 0 &&
        course.sections[0].chapters.length > 0
      ) {
        const firstChapter = course.sections[0].chapters[0];
        router.push(
          `/user/courses/${course.courseId}/chapters/${firstChapter.chapterId}`,
          { scroll: false }
        );
      } else {
        router.push(`/user/courses/${course.courseId}`, { scroll: false });
      }
    } else {
      handleEnrollNow(course.courseId);
    }
  };

  return (
    <div className="selected-course">
      <div>
        <h3 className="selected-course__title">{course.title}</h3>
        <p className="selected-course__author">
          By {course.teacherName} |{" "}
          <span className="selected-course__enrollment-count">
            {course?.enrollments?.length}
          </span>
        </p>
      </div>

      <div className="selected-course__content">
        <p className="selected-course__description">{course.description}</p>

        <div className="selected-course__sections">
          <h4 className="selected-course__sections-title">Course Content</h4>
          <AccordionSections sections={course.sections} />
        </div>

        <div className="selected-course__footer">
          <span className="selected-course__price">
            {formatPrice(course.price)}
          </span>
          <Button
            onClick={handleCourseAction}
            className="bg-primary-700 hover:bg-primary-600"
          >
            {isEnrolled ? "Continue Learning" : "Purchase Course"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectedCourse;
