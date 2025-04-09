"use client"
import { useParams, useSearchParams } from "next/navigation"
import TeacherLiveClass from "@/components/TeacherLiveClass"
import Cookies from "js-cookie"
import Loading from "@/components/Loading"

const TeacherLiveClassPage = () => {
  const params = useParams()
  const searchParams = useSearchParams()
  const liveClassId = params.liveClassId as string
  const userId = searchParams.get("userId") ?? Cookies.get("userId")
  const courseId = searchParams.get("courseId") as string

  if (!liveClassId || !userId || !courseId) {
    console.error("Missing parameters:", { liveClassId, userId, courseId })
    return <Loading />
  }

  return <TeacherLiveClass liveClassId={liveClassId} courseId={courseId} userId={userId} />
}

export default TeacherLiveClassPage
