"use client"
import React, { Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import TeacherLiveClass from "@/components/TeacherLiveClass"
import Loading from "@/components/Loading"

// Add export for dynamic rendering
export const dynamic = 'force-dynamic';

const TeacherLiveClassPage = () => {
  return (
    <Suspense fallback={<Loading />}>
      <TeacherLiveClassContent />
    </Suspense>
  );
};

const TeacherLiveClassContent = () => {
  const params = useParams()
  const searchParams = useSearchParams()
  const liveClassId = params.liveClassId as string
  const userId = searchParams.get("userId") ?? localStorage.getItem("userId");
  const courseId = searchParams.get("courseId") as string

  if (!liveClassId || !userId || !courseId) {
    console.error("Missing parameters:", { liveClassId, userId, courseId })
    return <Loading />
  }

  return <TeacherLiveClass liveClassId={liveClassId} userId={userId} courseId={courseId} />
}

export default TeacherLiveClassPage
