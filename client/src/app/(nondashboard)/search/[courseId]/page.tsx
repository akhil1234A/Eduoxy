"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGetCourseQuery, useGetProfileQuery } from "@/state/redux"
import Cookies from "js-cookie"
import Loading from "@/components/Loading"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatPrice } from "@/lib/utils"
import AccordionSections from "@/components/AccordionSections"
import Image from "next/image"
import { Star, Trash2, Calendar, Clock, User } from "lucide-react"
import { toast } from "sonner"
import { useGetReviewsByCourseIdQuery, useAddReviewMutation, useDeleteReviewMutation } from "@/state/api/reviewApi"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"

interface Instructor {
  _id: string
  name: string
  bio?: string
  profileImage?: string
  title?: string
}

interface Review {
  id: string
  userName: string
  rating: number
  comment: string
  date: string
}

interface LiveClass {
  _id: string
  courseId: string
  teacherId: string
  title: string
  startTime: string
  endTime: string
  isActive: boolean
}

interface ReviewFormData {
  rating: number
  review: string
}

const CourseView = () => {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const userId = Cookies.get("userId");
  const userName = Cookies.get("userName");

  const { data: courseData, isLoading: isCourseLoading, isError: isCourseError } = useGetCourseQuery(courseId)
  const course = courseData?.data

  const { data: instructorData, isLoading: isInstructorLoading } = useGetProfileQuery(course?.teacherId || "", {
    skip: !course?.teacherId,
  })
  const instructor: Instructor | undefined = instructorData?.data

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" })
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([])

  const isTeacher = course?.teacherId === userId
  const isEnrolled = course?.enrollments?.some((enrollment) => enrollment.userId === userId)

  const { data, isLoading: isReviewsLoading } = useGetReviewsByCourseIdQuery(courseId)
  const reviewsData = data?.data
  const [addReview] = useAddReviewMutation()
  const [deleteReview] = useDeleteReviewMutation()
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    review: "",
  })

  useEffect(() => {
    if (courseId) {
      fetch(`http://localhost:8000/api/live-classes/${courseId}`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          console.log("Live classes response:", data)
          setLiveClasses(Array.isArray(data) ? data : [])
        })
        .catch((err) => {
          console.error("Failed to fetch live classes:", err)
          setLiveClasses([])
        })
    }
  }, [courseId])

  const handleCourseAction = () => {
    if (isEnrolled) {
      if (course?.sections && course.sections.length > 0 && course.sections[0].chapters.length > 0) {
        const firstChapter = course.sections[0].chapters[0]
        router.push(`/user/courses/${course.courseId}/chapters/${firstChapter.chapterId}`, { scroll: false })
      } else {
        router.push(`/user/courses/${course.courseId}`, { scroll: false })
      }
    } else {
      router.push(`/payment/${course.courseId}`, { scroll: false })
    }
  }


  const handleJoinClass = (liveClassId: string) => {
    const route = isTeacher
      ? `/teacher/liveclass/${liveClassId}`
      : `/user/liveclass/${liveClassId}`;
    router.push(`${route}?userId=${userId}&courseId=${courseId}&teacherId=${course?.teacherId}`);
  };
  
  const handleStartClass = async (liveClassId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/live-classes/${liveClassId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: userId }),
        credentials: "include",
      });
  
      if (response.ok) {
        setLiveClasses((prev) => prev.map((cls) => (cls._id === liveClassId ? { ...cls, isActive: true } : cls)));
        toast.success("Class started successfully!");
        handleJoinClass(liveClassId);
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to start class.");
      }
    } catch (err) {
      console.error("Error starting class:", err);
      toast.error("An error occurred while starting the class.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.rating === 0) {
      toast.error("Please select a rating")
      return
    }
    if (!formData.review.trim()) {
      toast.error("Please write a review")
      return
    }

    try {
      await addReview({
        courseId,
        userId,
        userName,
        rating: formData.rating,
        review: formData.review,
      }).unwrap()
      setFormData({ rating: 0, review: "" })
      setShowReviewForm(false)
      toast.success("Review added successfully")
    } catch (error) {
      toast.error("Failed to add review")
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteReview({ reviewId, userId }).unwrap()
        toast.success("Review deleted successfully")
      } catch (error) {
        toast.error("Failed to delete review")
      }
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  if (isCourseLoading || isInstructorLoading || isReviewsLoading) return <Loading />
  if (isCourseError || !course) return <div className="text-center py-10 text-gray-300">Course not found</div>

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="course-view bg-[#1B1C22] text-white min-h-screen py-8 px-4 md:px-6"
    >
      {/* Course Header */}
      <div className="relative bg-[#2D2E36] rounded-lg overflow-hidden mb-8">
        <Image
          src={course.image || "/placeholder.png"}
          alt={course.title}
          width={1200}
          height={400}
          className="w-full h-64 md:h-96 object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 p-6 md:p-10 flex flex-col">
          <div className="max-w-lg">
            <h1 className="text-3xl md:text-5xl font-bold mb-2 text-white drop-shadow-md">{course.title}</h1>
            <p className="text-lg md:text-xl text-gray-200 drop-shadow-md">
              By {course.teacherName} |{" "}
              <span className="text-gray-300">{course?.enrollments?.length} students enrolled</span>
            </p>
            <p className="text-sm md:text-base mt-2 text-gray-300 drop-shadow-md">
              {course.level} • {course.category}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pl-4 md:pl-10 pr-4 md:pr-6">
        {/* Main Content */}
        <div className="md:col-span-9">
          {/* Description */}
          <section className="mb-10 ml-4 md:ml-6">
            <h2 className="text-2xl font-semibold mb-4 text-white">Course Description</h2>
            <p className="text-gray-300 leading-relaxed">{course.description}</p>
          </section>

          {/* Course Content */}
          <section className="mb-10 ml-4 md:ml-6">
            <h2 className="text-2xl font-semibold mb-4 text-white">Course Content</h2>
            <AccordionSections sections={course.sections} />
          </section>

          {/* Live Classes */}
          <section className="mb-10 ml-4 md:ml-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">Upcoming Live Classes</h2>
              {isTeacher && (
                <Button
                  onClick={() => router.push(`/teacher/schedule/${courseId}`)}
                  className="bg-[#6366F1] hover:bg-[#4f46e5]"
                >
                  Schedule a Class
                </Button>
              )}
            </div>
            {liveClasses.length === 0 ? (
              <div className="bg-[#2D2E36] rounded-lg p-6 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-400">No upcoming live classes scheduled.</p>
                {isTeacher && (
                  <Button
                    onClick={() => router.push(`/teacher/schedule/${courseId}`)}
                    variant="outline"
                    className="mt-4"
                  >
                    Schedule Your First Class
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {liveClasses.map((cls) => {
                  const now = new Date()
                  const start = new Date(cls.startTime)
                  const end = new Date(cls.endTime)
                  const canJoin = now >= start && now <= end && cls.isActive
                  const canStart = isTeacher && now >= start && now <= end && !cls.isActive
                  const isPast = now > end
                  const isFuture = now < start

                  return (
                    <Card
                      key={cls._id}
                      className={`bg-[#2D2E36] border-none overflow-hidden ${isPast ? "opacity-70" : ""}`}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-medium text-white">{cls.title}</h3>
                          <Badge
                            variant={cls.isActive ? "default" : "outline"}
                            className={cls.isActive ? "bg-green-600" : ""}
                          >
                            {cls.isActive ? "Live Now" : "Scheduled"}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm text-gray-300 mb-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{format(start, "MMMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            <span>
                              {format(start, "h:mm a")} - {format(end, "h:mm a")}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Instructor: {course.teacherName}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {canJoin && (
                            <Button
                              onClick={() => handleJoinClass(cls._id)}
                              className="w-full bg-[#6366F1] hover:bg-[#4f46e5]"
                            >
                              Join Class
                            </Button>
                          )}
                          {canStart && (
                            <Button
                              onClick={() => handleStartClass(cls._id)}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              Start Class
                            </Button>
                          )}
                          {isFuture && !isTeacher && (
                            <Button variant="outline" className="w-full" disabled>
                              Starts in {Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60))} hours
                            </Button>
                          )}
                          {isPast && (
                            <Button variant="outline" className="w-full opacity-70" disabled>
                              Class Ended
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>

          {/* Reviews */}
          <section className="ml-4 md:ml-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">Student Reviews</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {reviewsData?.length || 0} {reviewsData?.length === 1 ? "review" : "reviews"} for this course
                </p>
              </div>
              {isEnrolled && (
                <Button
                  variant="outline"
                  className="bg-[#6366F1] hover:bg-[#4f46e5] text-white border-none"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  {showReviewForm ? "Cancel" : "Add Review"}
                </Button>
              )}
            </div>

            <AnimatePresence>
              {showReviewForm && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8"
                >
                  <Card className="bg-[#2D2E36] border border-[#3A3B45]">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-medium mb-4">Share Your Experience</h3>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-sm text-gray-300">Your Rating</label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFormData({ ...formData, rating: star })}
                                className={`p-1.5 rounded-full transition-colors ${
                                  formData.rating >= star ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"
                                }`}
                                aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
                              >
                                <Star className="w-6 h-6" fill={formData.rating >= star ? "currentColor" : "none"} />
                              </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-400">
                              {formData.rating > 0
                                ? `${formData.rating} star${formData.rating === 1 ? "" : "s"}`
                                : "Select rating"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="review" className="block text-sm text-gray-300">
                            Your Review
                          </label>
                          <Textarea
                            id="review"
                            placeholder="Share your thoughts about this course..."
                            value={formData.review}
                            onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                            className="min-h-[120px] bg-[#1B1C22] border-[#3A3B45] resize-none"
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="mr-2"
                            onClick={() => setShowReviewForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" className="bg-[#6366F1] hover:bg-[#4f46e5]">
                            Submit Review
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {isReviewsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="bg-[#2D2E36] border-[#3A3B45]">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-full bg-[#3A3B45]" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-1/4 bg-[#3A3B45]" />
                          <Skeleton className="h-4 w-1/3 bg-[#3A3B45]" />
                          <Skeleton className="h-4 w-full bg-[#3A3B45]" />
                          <Skeleton className="h-4 w-3/4 bg-[#3A3B45]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reviewsData && reviewsData.length > 0 ? (
              <div className="space-y-6">
                {reviewsData.map((review) => (
                  <Card key={review._id} className="bg-[#2D2E36] border-[#3A3B45] overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10 border border-[#3A3B45]">
                          <AvatarFallback className="bg-[#6366F1]/20 text-[#6366F1]">
                            {getInitials(review.userName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <h4 className="font-medium text-white">{review.userName}</h4>
                              <div className="flex items-center mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-500"
                                    }`}
                                  />
                                ))}
                                <span className="ml-2 text-xs text-gray-400">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {review.userId === userId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(review._id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>

                          <p className="mt-3 text-gray-300 leading-relaxed">{review.review}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-[#2D2E36] border-[#3A3B45] text-center p-8">
                <div className="flex flex-col items-center">
                  <div className="bg-[#3A3B45] p-3 rounded-full mb-4">
                    <Star className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No Reviews Yet</h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-6">
                    This course doesn't have any reviews yet. Be the first to share your experience!
                  </p>
                  {isEnrolled && (
                    <Button onClick={() => setShowReviewForm(true)} className="bg-[#6366F1] hover:bg-[#4f46e5]">
                      Write a Review
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-3 space-y-8">
          <div className="bg-[#2D2E36] p-8 rounded-lg shadow-md sticky top-4 border border-gray-700">
            <span className="text-3xl font-bold text-white block mb-6">{formatPrice(course.price)}</span>
            <Button
              onClick={handleCourseAction}
              className="w-full bg-[#6366F1] hover:bg-[#4f46e5] text-white py-4 text-lg"
            >
              {isEnrolled ? "Continue Learning" : "Purchase Course"}
            </Button>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <h4 className="font-medium text-white mb-4">This course includes:</h4>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  {course.sections?.reduce((acc, section) => acc + section.chapters.length, 0) || 0} lessons
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Full lifetime access
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Access on mobile and desktop
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Live class sessions
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-[#2D2E36] p-8 rounded-lg shadow-md border border-gray-700">
            <h3 className="text-xl font-semibold mb-6 text-white">About the Instructor</h3>
            {instructor ? (
              <div className="flex flex-col items-start space-y-4">
                {instructor.profileImage && (
                  <Image
                    src={instructor.profileImage || "/placeholder.svg"}
                    alt={instructor.name}
                    width={120}
                    height={120}
                    className="rounded-full mb-4 object-cover border-2 border-gray-600"
                  />
                )}
                <p className="font-medium text-lg text-white">{instructor.name}</p>
                {instructor.title && <p className="text-gray-400 text-sm">{instructor.title}</p>}
                {instructor.bio && <p className="text-gray-300">{instructor.bio}</p>}
              </div>
            ) : (
              <p className="text-gray-500">Instructor details not available</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default CourseView

