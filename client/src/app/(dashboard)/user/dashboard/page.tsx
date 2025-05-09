"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Trophy, Clock, BookOpen, Download, ArrowRight, CheckCircle, Award } from "lucide-react"
import { useGetUserDashboardQuery } from "@/state/redux"
import Loading from "@/components/Loading"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const UserDashboard = () => {
  const router = useRouter()
  const userId = Cookies.get("userId") || null

  const {
    data: dashboardResponse,
    isLoading,
    error,
  } = useGetUserDashboardQuery(userId ?? "", {
    skip: !userId,
  })
  const dashboard = dashboardResponse?.data

  if (!userId) {
    router.push("/signin")
    return null
  }

  if (isLoading) return <Loading />
  if (error || !dashboard) return <div>Error loading dashboard</div>

  const handleCourseClick = (courseId: string) => {
    router.push(`/search/${courseId}`)
  }

  const handleViewCertificates = () => {
    router.push("/user/certificates")
  }

  const handleDownloadCertificate = (url: string) => {
    window.open(url, "_blank")
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
          <p className="text-[#9ca3af]">Track your progress and continue learning</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<BookOpen className="h-8 w-8 text-primary-500" />}
            title="Chapters Completed"
            value={dashboard.completedChapters.toString()}
            description="Across all courses"
          />
          <StatCard
            icon={<Trophy className="h-8 w-8 text-secondary-500" />}
            title="Certificates Earned"
            value={dashboard.certificatesEarned.toString()}
            description="Ready to download"
          />
          <StatCard
            icon={<Clock className="h-8 w-8 text-tertiary-50" />}
            title="Total Courses"
            value={(
              dashboard.enrolledCourses.startLearning.length +
              dashboard.enrolledCourses.continueLearning.length +
              dashboard.enrolledCourses.completedCourses.length
            ).toString()}
            description="Enrolled courses"
          />
          <StatCard
            icon={<Clock className="h-8 w-8 text-tertiary-50" />}
            title="Total Time Spent"
            value={`${dashboard.timeSpent.hours}h ${dashboard.timeSpent.minutes}m`}
            description="Learning time"
          />
        </div>

        {/* Start Learning */}
        {dashboard.enrolledCourses.startLearning.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Start Learning</h2>
              {dashboard.enrolledCourses.startLearning.length > 3 && (
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
              {dashboard.enrolledCourses.startLearning.map((course: DashboardCourseCard) => (
                <CourseCard key={course.courseId} course={course} onClick={() => handleCourseClick(course.courseId)} />
              ))}
            </div>
          </div>
        )}

        {/* Continue Learning */}
        {dashboard.enrolledCourses.continueLearning.length > 0 && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboard.enrolledCourses.continueLearning.map((course: DashboardCourseCard) => (
                <CourseCard key={course.courseId} course={course} onClick={() => handleCourseClick(course.courseId)} />
              ))}
            </div>
          </div>
        )}

        {/* No Courses Message */}
        {dashboard.enrolledCourses.startLearning.length === 0 &&
          dashboard.enrolledCourses.continueLearning.length === 0 && (
            <div className="mb-10">
              <div className="bg-[#2a2b34] rounded-lg border border-[#3a3b44] p-8 text-center">
                <BookOpen className="h-12 w-12 text-[#3a3b44] mx-auto mb-4" />
                <p className="text-lg text-white mb-2">No courses in progress</p>
                <p className="text-sm text-[#9ca3af] mb-6">Start learning by enrolling in a course</p>
                <Button
                  className="bg-primary-700 hover:bg-primary-600 text-white"
                  onClick={() => router.push("/search")}
                >
                  Browse Courses
                </Button>
              </div>
            </div>
          )}

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
              {dashboard.enrolledCourses.completedCourses.map((course: DashboardCourseCard) => (
                <CourseCard key={course.courseId} course={course} onClick={() => handleCourseClick(course.courseId)} />
              ))}
            </div>
          </div>
        )}

        {/* Certificates Section */}
        {dashboard.certificatesEarned > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Recent Certificates</h2>
              <Button
                variant="ghost"
                className="text-primary-500 hover:text-primary-400 hover:bg-[#32333c]"
                onClick={handleViewCertificates}
              >
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dashboard.certificates.slice(0, 2).map((cert: Certificate) => (
                <Card
                  key={cert.certificateId}
                  className="bg-[#2a2b34] border-[#3a3b44] hover:border-[#4a4b54] transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-secondary-700 p-3 rounded-full">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-white truncate">{cert.courseName}</h3>
                        <p className="text-sm text-[#9ca3af]">
                          Issued on{" "}
                          {new Date(cert.issuedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDownloadCertificate(cert.certificateUrl)}
                        className="bg-primary-700 hover:bg-primary-600 text-white shrink-0"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
  course: {
    courseId: string
    title: string
    progress: number
    completed: boolean
    timeSpent?: { hours: number; minutes: number }
  }
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
        <span className="text-sm font-medium text-white">{course.progress.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-[#1e1f26] rounded-full h-2">
        <div
          className={`h-2 rounded-full ${course.completed ? "bg-secondary-700" : "bg-primary-700"}`}
          style={{ width: `${course.progress}%` }}
        ></div>
      </div>
    </div>

    {course.timeSpent && (
      <div className="mb-4">
        <div className="flex items-center text-sm text-[#9ca3af]">
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          <span>
            {course.timeSpent.hours}h {course.timeSpent.minutes}m spent
          </span>
        </div>
      </div>
    )}

    <Separator className="bg-[#3a3b44] my-4" />

    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-center text-primary-500 hover:text-primary-400 hover:bg-[#32333c]"
    >
      {course.completed ? "Review Course" : course.progress === 0 ? "Start Learning" : "Continue Learning"}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  </div>
)

export default UserDashboard
