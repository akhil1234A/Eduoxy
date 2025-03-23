"use client";

import React, { useState } from "react";
import { useGetUserEnrolledCoursesQuery } from "@/state/redux"; // Update path
import Chat from "@/components/Chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";

export default function StudentChatPage() {
  const userId = Cookies.get("userId"); // Student ID: 67c5f17c6fffa8e9b21034b9
  const [selectedCourse, setSelectedCourse] = useState<{
    courseId: string;
    instructorId: string;
    title: string;
  } | null>(null);

  const { data: courses, isLoading } = useGetUserEnrolledCoursesQuery(userId || "", {
    skip: !userId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1B1C22]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-[#1B1C22] min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Chat with Instructors</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Course List */}
        <Card className="md:col-span-1 bg-[#2D2E36] shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-200">Your Enrolled Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {courses?.data?.length > 0 ? (
                courses.data.map((course) => (
                  <Button
                    key={course._id}
                    variant={selectedCourse?.courseId === course.courseId ? "default" : "ghost"}
                    className="w-full text-left justify-start py-3 mb-2 text-gray-300 hover:bg-[#3A3B45]"
                    onClick={() =>
                      setSelectedCourse({
                        courseId: course.courseId, // Use courseId from response
                        instructorId: course.teacherId,
                        title: course.title,
                      })
                    }
                  >
                    {course.title}
                  </Button>
                ))
              ) : (
                <p className="text-gray-400 text-center">No enrolled courses found.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <div className="md:col-span-3">
          {selectedCourse ? (
            <Card className="bg-[#2D2E36] shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-200">
                  Chat for {selectedCourse.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Chat
                  courseId={selectedCourse.courseId}
                  userId={userId || ""}
                  instructorId={selectedCourse.instructorId}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#2D2E36] shadow-lg">
              <CardContent className="p-6 text-center text-gray-400">
                <p>Select a course from the list to start chatting with your instructor.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}