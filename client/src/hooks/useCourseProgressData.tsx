import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import {
  useGetCourseQuery,
  useGetUserCourseProgressQuery,
  useUpdateUserCourseProgressMutation,
} from "@/state/redux";

export const useCourseProgressData = () => {
  const { courseId, chapterId } = useParams();
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [updateProgress] = useUpdateUserCourseProgressMutation();

  const userId = Cookies.get("userId");

  const { data: courseResponse, isLoading: courseLoading, isFetching: courseFetching } = useGetCourseQuery(
    (courseId as string) ?? "",
    { skip: !courseId }
  );
  const course = useMemo(() => courseResponse?.data || null, [courseResponse]);

  const { data: userProgressResponse, isLoading: progressLoading, isFetching: progressFetching } =
    useGetUserCourseProgressQuery(
      {
        userId: userId ?? "",
        courseId: (courseId as string) ?? "",
      },
      { skip: !userId || !courseId }
    );
  const userProgress = useMemo(() => userProgressResponse?.data || null, [userProgressResponse]);

  const isLoading = useMemo(
    () => courseLoading || progressLoading || courseFetching || progressFetching,
    [courseLoading, progressLoading, courseFetching, progressFetching]
  );

  // Initialize progress if none exists
  useEffect(() => {
    if (!isLoading && course && userId && userProgress === null) {
      const initialSections = course.sections.map((section: any) => ({
        sectionId: section.sectionId,
        chapters: section.chapters.map((chapter: any) => ({
          chapterId: chapter.chapterId,
          completed: false,
        })),
      }));

      updateProgress({
        userId,
        courseId: (courseId as string) ?? "",
        progressData: { sections: initialSections },
      }).then(() => {
        console.log("Initial progress saved");
      }).catch((err) => {
        console.error("Failed to save initial progress:", err);
      });
    }
  }, [isLoading, course, userId, userProgress, updateProgress, courseId]);

  const currentSection = useMemo(
    () => course?.sections?.find((s) => s.chapters.some((c) => c.chapterId === chapterId)) || null,
    [course, chapterId]
  );

  const currentChapter = useMemo(
    () => currentSection?.chapters.find((c) => c.chapterId === chapterId) || null,
    [currentSection, chapterId]
  );

  const isChapterCompleted = () => {
    if (!currentSection || !currentChapter || !userProgress?.sections) return false;

    const section = userProgress.sections.find((s) => s.sectionId === currentSection.sectionId);
    return section?.chapters.some((c) => c.chapterId === currentChapter.chapterId && c.completed) ?? false;
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
      courseId: (courseId as string) ?? "",
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