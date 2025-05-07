"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import {
  useGetCourseQuery,
  useGetUserCourseProgressQuery,
  useUpdateUserCourseProgressMutation,
  useGetUserCertificatesQuery,
  useLogTimeSpentMutation,
  useGetTotalTimeSpentQuery,
} from "@/state/redux";

export const useCourseProgressData = (propCourseId?: string) => {
  const { courseId: paramCourseId, chapterId } = useParams();
  const courseId = propCourseId || (paramCourseId as string) || "";
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [lastTimeUpdate, setLastTimeUpdate] = useState<number>(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);
  const timeAccumulated = useRef<number>(0);
  const [updateProgress] = useUpdateUserCourseProgressMutation();
  const [logTimeSpent] = useLogTimeSpentMutation();

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

  const {
    data: certificatesResponse,
    isLoading: certificatesLoading,
  } = useGetUserCertificatesQuery(
    { userId: userId ?? "", page: 1, limit: 10 },
    { skip: !userId }
  );
  const certificate = useMemo(
    () => certificatesResponse?.data?.certificates.find((cert: Certificate) => cert.courseId === courseId) || null,
    [certificatesResponse, courseId]
  );

  const {
    data: timeSpentResponse,
    isLoading: timeLoading,
  } = useGetTotalTimeSpentQuery(
    { userId: userId ?? "", courseId },
    { skip: !userId || !courseId }
  );

  const isLoading = useMemo(
    () => courseLoading || progressLoading || courseFetching || progressFetching || certificatesLoading || timeLoading,
    [courseLoading, progressLoading, courseFetching, progressFetching, certificatesLoading, timeLoading]
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

  useEffect(() => {
    if (timeSpentResponse?.data?.totalSeconds) {
      setTotalTimeSpent(timeSpentResponse.data.totalSeconds);
    }
  }, [timeSpentResponse]);

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

  const isCourseCompleted = useMemo(() => {
    if (!userProgress?.sections) return false;
    return userProgress.sections.every((section: SectionProgress) =>
      section.chapters.every((chapter: ChapterProgress) => chapter.completed)
    ) && userProgress.overallProgress === 100;
  }, [userProgress]);

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

  const handleLogTimeSpent = useCallback(async (timeSpentSeconds: number) => {
    if (!userId || !courseId || !currentChapter?.chapterId || currentChapter.type !== "Video") return;
    try {
      await logTimeSpent({
        userId,
        courseId,
        chapterId: currentChapter.chapterId,
        timeSpentSeconds,
      }).unwrap();
      setTotalTimeSpent((prev) => prev + timeSpentSeconds);
    } catch (err) {
      console.error("Failed to log time:", err);
    }
  }, [userId, courseId, currentChapter, logTimeSpent]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (timeAccumulated.current >= 5) {
        handleLogTimeSpent(timeAccumulated.current);
        timeAccumulated.current = 0;
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [handleLogTimeSpent]);

  const handleVideoProgress = ({ playedSeconds }: { playedSeconds: number }) => {
    const timeDiff = playedSeconds - lastTimeUpdate;
    if (timeDiff >= 1) {
      timeAccumulated.current += timeDiff;
      setLastTimeUpdate(playedSeconds);
    }
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
    isCourseCompleted,
    updateChapterProgress,
    hasMarkedComplete,
    setHasMarkedComplete,
    certificate,
    totalTimeSpent,
    handleVideoProgress,
  };
};