"use client";

import React, { useState, useMemo } from "react";
import { useGetUserEnrolledCoursesQuery } from "@/state/redux";
import Chat from "@/components/Chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";

export default function StudentChatPage() {
  const senderId = Cookies.get("userId");
  const [selectedCourse, setSelectedCourse] = useState<{
    courseId: string;
    receiverId: string;
    teacherName: string;
  } | null>(null);

  const { data: courses, isLoading } = useGetUserEnrolledCoursesQuery(senderId || "", {
    skip: !senderId,
  });



  const uniqueTeachers = useMemo(() => {
    if (!courses?.data?.length) return [];

    const teacherMap = new Map<string, { courseId: string; receiverId: string; teacherName: string }>();
    courses.data.forEach((course: Course) => {
      if (!teacherMap.has(course.teacherName)) {
        teacherMap.set(course.teacherName, {
          courseId: course.courseId,
          receiverId: course.teacherId,
          teacherName: course.teacherName,
        });
      }
    });
    const teachers = Array.from(teacherMap.values());
    return teachers;
  }, [courses]);

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
        {/* Teacher List */}
        <Card className="md:col-span-1 bg-[#2D2E36] shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-200">Your Instructors</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {uniqueTeachers.length > 0 ? (
                uniqueTeachers.map((teacher) => (
                  <Button
                    key={teacher.receiverId}
                    variant={selectedCourse?.receiverId === teacher.receiverId ? "default" : "ghost"}
                    className="w-full text-left justify-start py-3 mb-2 text-gray-300 hover:bg-[#3A3B45]"
                    onClick={() =>
                      setSelectedCourse({
                        courseId: teacher.courseId,
                        receiverId: teacher.receiverId,
                        teacherName: teacher.teacherName,
                      })
                    }
                  >
                    {teacher.teacherName}
                  </Button>
                ))
              ) : (
                <p className="text-gray-400 text-center">No instructors found.</p>
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
                  Chat with {selectedCourse.teacherName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Chat
                  courseId={selectedCourse.courseId}
                  senderId={senderId || ""}
                  receiverId={selectedCourse.receiverId}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#2D2E36] shadow-lg">
              <CardContent className="p-6 text-center text-gray-400">
                <p>Select an instructor from the list to start chatting.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}