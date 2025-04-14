"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import {
  useGetCourseQuery,
  useGetUserCourseProgressQuery,
  useUpdateUserCourseProgressMutation,
} from "@/state/redux";

export const useCourseProgressData = (propCourseId?: string) => {
  const { courseId: paramCourseId, chapterId } = useParams();
  const courseId = propCourseId || (paramCourseId as string) || ""; 
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [updateProgress] = useUpdateUserCourseProgressMutation();

  const userId = Cookies.get("userId") || null;

  const {
    data: courseResponse,
    isLoading: courseLoading,
    isFetching: courseFetching,
  } = useGetCourseQuery(courseId, { skip: !courseId });
  const course = useMemo(() => courseResponse?.data || null, [courseResponse]);

  const {
    data: userProgressResponse,
    isLoading: progressLoading,
    isFetching: progressFetching,
  } = useGetUserCourseProgressQuery(
    { userId: userId ?? "", courseId },
    { skip: !userId || !courseId }
  );
  const userProgress = useMemo(() => userProgressResponse?.data || null, [userProgressResponse]);

  const isLoading = useMemo(
    () => courseLoading || progressLoading || courseFetching || progressFetching,
    [courseLoading, progressLoading, courseFetching, progressFetching]
  );

  useEffect(() => {
    if (!isLoading && course && userId && userProgress === null) {
      const initialSections = course.sections.map((section: Section) => ({
        sectionId: section.sectionId,
        chapters: section.chapters.map((chapter: Chapter) => ({
          chapterId: chapter.chapterId,
          completed: false,
        })),
      }));

      updateProgress({
        userId,
        courseId,
        progressData: { sections: initialSections },
      })
        .then(() => {
          console.log("Initial progress saved");
        })
        .catch((err) => {
          console.error("Failed to save initial progress:", err);
        });
    }
  }, [isLoading, course, userId, userProgress, updateProgress, courseId]);

  const currentSection = useMemo(
    () => course?.sections?.find((s: Section) => s.chapters.some((c: Chapter) => c.chapterId === chapterId)) || null,
    [course, chapterId]
  );

  const currentChapter = useMemo(
    () => currentSection?.chapters.find((c: Chapter) => c.chapterId === chapterId) || null,
    [currentSection, chapterId]
  );

  const isChapterCompleted = () => {
    if (!currentSection || !currentChapter || !userProgress?.sections) return false;

    const section = userProgress.sections.find((s: SectionProgress) => s.sectionId === currentSection.sectionId);
    return section?.chapters.some((c: ChapterProgress) => c.chapterId === currentChapter.chapterId && c.completed) ?? false;
  };

  const updateChapterProgress = (sectionId: string, chapterId: string, completed: boolean) => {
    if (!userId) return;

    const updatedSections = [
      {
        sectionId,
        chapters: [
          {
            chapterId,
            completed,
          },
        ],
      },
    ];

    updateProgress({
      userId,
      courseId,
      progressData: { sections: updatedSections },
    });
  };

  return {
    userId,
    courseId,
    chapterId,
    course,
    userProgress,
    currentSection,
    currentChapter,
    isLoading,
    isChapterCompleted,
    updateChapterProgress,
    hasMarkedComplete,
    setHasMarkedComplete,
  };
};