"use client";

import React, { useState } from "react";
import { useGetTeacherCoursesQuery } from "@/state/redux"; 
import Chat from "@/components/Chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";


interface StudentData {
  userId: string;
  courseId: string;
  courseTitle: string;
  name: string;
}

export default function InstructorChatPage() {
  const {userId} = useUser();
  const senderId = userId; 
  const [selectedChat, setSelectedChat] = useState<{
    courseId: string;
    receiverId: string; 
    courseTitle: string;
    studentName: string;
  } | null>(null);

  const { data: courses, isLoading } = useGetTeacherCoursesQuery({}, {
    skip: !senderId,
  });

  console.log(courses);

 
  const students = courses?.data?.courses?.reduce<StudentData[]>((acc, course) => {
    if (course.enrollments) {
      course.enrollments.forEach((enrollment) => {
       
        if (!acc.find((s) => s.userId === enrollment.userId)) {
          acc.push({
            userId: enrollment.userId,
            courseId: course.courseId,
            courseTitle: course.title,
            name: enrollment.studentName || "Unknown",
          });
        }
      });
    }
    return acc;
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1B1C22]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-[#1B1C22] min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Chat with Students</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Student List */}
        <Card className="md:col-span-1 bg-[#2D2E36] shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-200">Your Students</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {students && students.length > 0 ? (
                students.map((student) => (
                  <Button
                    key={`${student.userId}-${student.courseId}`}
                    variant={
                      selectedChat?.receiverId === student.userId &&
                      selectedChat?.courseId === student.courseId
                        ? "default"
                        : "ghost"
                    }
                    className="w-full text-left justify-start py-3 mb-2 text-gray-300 hover:bg-[#3A3B45]"
                    onClick={() =>
                      setSelectedChat({
                        courseId: student.courseId,
                        receiverId: student.userId, 
                        courseTitle: student.courseTitle,
                        studentName: student.name,
                      })
                    }
                  >
                    {student.name}
                  </Button>
                ))
              ) : (
                <p className="text-gray-400 text-center">No students enrolled yet.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <div className="md:col-span-3">
          {selectedChat ? (
            <Card className="bg-[#2D2E36] shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-200">
                  Chat with {selectedChat.studentName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Chat
                  courseId={selectedChat.courseId}
                  senderId={senderId || ""} 
                  receiverId={selectedChat.receiverId} 
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#2D2E36] shadow-lg">
              <CardContent className="p-6 text-center text-gray-400">
                <p>Select a student to start chatting.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}