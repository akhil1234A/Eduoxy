"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Trophy, Clock, BookOpen, Download, ArrowRight, CheckCircle } from "lucide-react"
import { useGetUserDashboardQuery } from "@/state/redux"
import Loading from "@/components/Loading"
import ChaptersSidebar from "../courses/[courseId]/ChaptersSidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const UserDashboard = () => {
  const router = useRouter()
  const userId = Cookies.get("userId") || null
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const {
    data: dashboardResponse,
    isLoading,
    error,
  } = useGetUserDashboardQuery(userId ?? "", {
    skip: !userId,
  })
  const dashboard = dashboardResponse?.data

  if (!userId) {
    router.push("/login")
    return null
  }

  if (isLoading) return <Loading />
  if (error || !dashboard) return <div>Error loading dashboard</div>

  const handleCourseClick = (courseId: string) => {
    setSelectedCourseId(courseId)
  }

  const handleViewCertificates = () => {
    router.push("/user/certificates")
  }

  return (
    <div className="flex min-h-screen">
      {selectedCourseId && (
        <div className="w-80 bg-customgreys-secondarybg border-r border-[#3a3b44]">
          <ChaptersSidebar courseId={selectedCourseId} />
        </div>
      )}
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
          <p className="text-[#9ca3af]">Track your progress and continue learning</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Clock className="h-8 w-8 text-primary-500" />}
            title="Time Spent"
            value={`${dashboard.timeSpent.hours}h ${dashboard.timeSpent.minutes}m`}
            description="Total learning time"
          />
          <StatCard
            icon={<BookOpen className="h-8 w-8 text-secondary-500" />}
            title="Chapters Completed"
            value={dashboard.completedChapters.toString()}
            description="Across all courses"
          />
          <StatCard
            icon={<Trophy className="h-8 w-8 text-tertiary-50" />}
            title="Certificates Earned"
            value={dashboard.certificatesEarned.toString()}
            description="Ready to download"
          />
        </div>

        {/* Continue Learning */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Continue Learning</h2>
            {dashboard.enrolledCourses.continueLearning.length > 3 && (
              <Button
                variant="ghost"
                className="text-primary-500 hover:text-primary-400 hover:bg-[#32333c]"
                onClick={() => router.push("/user/courses")}
              >
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {dashboard.enrolledCourses.continueLearning.length === 0 ? (
            <div className="bg-[#2a2b34] rounded-lg border border-[#3a3b44] p-8 text-center">
              <BookOpen className="h-12 w-12 text-[#3a3b44] mx-auto mb-4" />
              <p className="text-lg text-white mb-2">No courses in progress</p>
              <p className="text-sm text-[#9ca3af] mb-6">Start learning by enrolling in a course</p>
              <Button className="bg-primary-700 hover:bg-primary-600 text-white" onClick={() => router.push("/search")}>
                Browse Courses
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboard.enrolledCourses.continueLearning.map((course) => (
                <CourseCard key={course.courseId} course={course} onClick={() => handleCourseClick(course.courseId)} />
              ))}
            </div>
          )}
        </div>

        {/* Completed Courses */}
        {dashboard.enrolledCourses.completedCourses.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Completed Courses</h2>
              {dashboard.enrolledCourses.completedCourses.length > 3 && (
                <Button
                  variant="ghost"
                  className="text-primary-500 hover:text-primary-400 hover:bg-[#32333c]"
                  onClick={() => router.push("/user/courses")}
                >
                  View all <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboard.enrolledCourses.completedCourses.map((course) => (
                <CourseCard key={course.courseId} course={course} onClick={() => handleCourseClick(course.courseId)} />
              ))}
            </div>
          </div>
        )}

        {/* Certificates Section */}
        {dashboard.certificatesEarned > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Your Certificates</h2>
            </div>
            <div className="bg-[#2a2b34] rounded-lg border border-[#3a3b44] p-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="bg-[#32333c] p-3 rounded-full mr-4">
                    <Trophy className="h-8 w-8 text-tertiary-50" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {dashboard.certificatesEarned} Certificate{dashboard.certificatesEarned !== 1 && "s"} Earned
                    </h3>
                    <p className="text-[#9ca3af]">Download and share your achievements</p>
                  </div>
                </div>
                <Button onClick={handleViewCertificates} className="bg-primary-700 hover:bg-primary-600 text-white">
                  <Download className="h-4 w-4 mr-2" />
                  View Certificates
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const StatCard = ({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode
  title: string
  value: string
  description: string
}) => (
  <div className="bg-[#2a2b34] p-6 rounded-lg border border-[#3a3b44] hover:border-[#4a4b54] transition-colors">
    <div className="flex items-start">
      <div className="bg-[#32333c] p-3 rounded-full mr-4">{icon}</div>
      <div>
        <h3 className="text-lg font-medium text-white">{title}</h3>
        <p className="text-2xl font-bold text-white mt-1 mb-1">{value}</p>
        <p className="text-sm text-[#9ca3af]">{description}</p>
      </div>
    </div>
  </div>
)

const CourseCard = ({
  course,
  onClick,
}: {
  course: { courseId: string; title: string; progress: number; completed: boolean }
  onClick: () => void
}) => (
  <div
    onClick={onClick}
    className="bg-[#2a2b34] p-6 rounded-lg border border-[#3a3b44] cursor-pointer hover:border-primary-600 transition-colors"
  >
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-lg font-medium text-white">{course.title}</h3>
      {course.completed && (
        <Badge className="bg-secondary-700 text-white">
          <CheckCircle className="h-3 w-3 mr-1" /> Complete
        </Badge>
      )}
    </div>

    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-[#9ca3af]">Progress</span>
        <span className="text-sm font-medium text-white">{course.progress}%</span>
      </div>
      <div className="w-full bg-[#1e1f26] rounded-full h-2">
        <div
          className={`h-2 rounded-full ${course.completed ? "bg-secondary-700" : "bg-primary-700"}`}
          style={{ width: `${course.progress}%` }}
        ></div>
      </div>
    </div>

    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-center text-primary-500 hover:text-primary-400 hover:bg-[#32333c]"
    >
      {course.completed ? "Review Course" : "Continue Learning"}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  </div>
)

export default UserDashboard
