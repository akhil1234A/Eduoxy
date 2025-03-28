"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetCourseQuery, useGetProfileQuery } from "@/state/redux";
import Cookies from "js-cookie";
import Loading from "@/components/Loading";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";
import AccordionSections from "@/components/AccordionSections";
import Image from "next/image";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface Instructor {
  _id: string;
  name: string;
  bio?: string;
  profileImage?: string;
  title?: string;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

interface LiveClass {
  _id: string; // Changed from "id" to "_id" to match API
  courseId: string;
  teacherId: string;
  title: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const dummyReviews: Review[] = [
  { id: "1", userName: "Sarah J.", rating: 5, comment: "Amazing course!", date: "2025-03-15" },
  { id: "2", userName: "Michael R.", rating: 4, comment: "Great content.", date: "2025-03-10" },
  { id: "3", userName: "Priya K.", rating: 5, comment: "Highly recommend!", date: "2025-03-05" },
];

const CourseView = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const userId = Cookies.get("userId");
  const userType = Cookies.get("userType");

  const { data: courseData, isLoading: isCourseLoading, isError: isCourseError } = useGetCourseQuery(courseId);
  const course = courseData?.data;

  const { data: instructorData, isLoading: isInstructorLoading } = useGetProfileQuery(course?.teacherId || "", {
    skip: !course?.teacherId,
  });
  const instructor: Instructor | undefined = instructorData?.data;

  const [reviews, setReviews] = useState<Review[]>(dummyReviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);

  const isTeacher = course?.teacherId === userId;
  const isEnrolled = course?.enrollments?.some((enrollment) => enrollment.userId === userId);

  useEffect(() => {
    if (courseId) {
      fetch(`http://localhost:8000/api/live-classes/${courseId}`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          console.log("Live classes response:", data);
          setLiveClasses(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error("Failed to fetch live classes:", err);
          setLiveClasses([]);
        });
    }
  }, [courseId]);

  const handleCourseAction = () => {
    if (isEnrolled) {
      if (course?.sections && course.sections.length > 0 && course.sections[0].chapters.length > 0) {
        const firstChapter = course.sections[0].chapters[0];
        router.push(`/user/courses/${course.courseId}/chapters/${firstChapter.chapterId}`, { scroll: false });
      } else {
        router.push(`/user/courses/${course.courseId}`, { scroll: false });
      }
    } else {
      router.push(`/payment/${course.courseId}`, { scroll: false });
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReview.rating > 0 && newReview.comment.trim()) {
      const review: Review = {
        id: Date.now().toString(),
        userName: "Current User",
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toISOString().split("T")[0],
      };
      setReviews([review, ...reviews]);
      setNewReview({ rating: 0, comment: "" });
      setShowReviewForm(false);
    }
  };

  const handleJoinClass = (liveClassId: string) => {
    router.push(`/live/${liveClassId}?userId=${userId}&courseId=${courseId}&teacherId=${course?.teacherId}`);
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
        setLiveClasses((prev) =>
          prev.map((cls) => (cls._id === liveClassId ? { ...cls, isActive: true } : cls))
        );
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

  if (isCourseLoading || isInstructorLoading) return <Loading />;
  if (isCourseError || !course) return <div className="text-center py-10 text-gray-300">Course not found</div>;

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
              <p className="text-gray-400">No upcoming live classes.</p>
            ) : (
              liveClasses.map((cls) => {
                const now = new Date();
                const start = new Date(cls.startTime);
                const end = new Date(cls.endTime);
                const canJoin = now >= start && now <= end && cls.isActive;
                const canStart = isTeacher && now >= start && now <= end && !cls.isActive;

                return (
                  <div key={cls._id} className="mb-4 p-4 bg-[#3A3B45] rounded-lg">
                    <h3 className="text-white">{cls.title}</h3>
                    <p className="text-gray-300">
                      {start.toLocaleString()} - {end.toLocaleString()}
                    </p>
                    <p className="text-gray-400">{cls.isActive ? "Active" : "Scheduled"}</p>
                    {canJoin && (
                      <Button
                        onClick={() => handleJoinClass(cls._id)}
                        className="mt-2 bg-[#6366F1] hover:bg-[#4f46e5]"
                      >
                        Join Class
                      </Button>
                    )}
                    {canStart && (
                      <Button
                        onClick={() => handleStartClass(cls._id)}
                        className="mt-2 bg-green-600 hover:bg-green-700"
                      >
                        Start Class
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </section>

          {/* Reviews */}
          <section className="ml-4 md:ml-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">Student Reviews</h2>
              <Button
                variant="outline"
                className="bg-[#6366F1] hover:bg-[#4f46e5] text-white border-none"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                {showReviewForm ? "Cancel" : "Add Review"}
              </Button>
            </div>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacityusers: 0, height: 0 }}
                className="mb-6 bg-[#2D2E36] p-4 rounded-lg"
              >
                <form onSubmit={handleAddReview}>
                  <div className="flex mb-4">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 cursor-pointer ${
                          i < newReview.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-500"
                        }`}
                        onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                      />
                    ))}
                  </div>
                  <Textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Write your review..."
                    className="mb-4 bg-[#1B1C22] text-gray-300 border-gray-600"
                  />
                  <Button type="submit" className="bg-[#6366F1] hover:bg-[#4f46e5] text-white">
                    Submit Review
                  </Button>
                </form>
              </motion.div>
            )}
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-700 pb-4">
                  <div className="flex items-center mb-2">
                    <p className="font-medium text-white">{review.userName}</p>
                    <div className="flex ml-3">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-500"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-500 text-sm ml-3">{review.date}</p>
                  </div>
                  <p className="text-gray-300">{review.comment}</p>
                </div>
              ))}
            </div>
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
          </div>
          <div className="bg-[#2D2E36] p-8 rounded-lg shadow-md border border-gray-700">
            <h3 className="text-xl font-semibold mb-6 text-white">About the Instructor</h3>
            {instructor ? (
              <div className="flex flex-col items-start space-y-4">
                {instructor.profileImage && (
                  <Image
                    src={instructor.profileImage}
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
  );
};

export default CourseView;