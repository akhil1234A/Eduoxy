"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const ScheduleLiveClass = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const userId = Cookies.get("userId");

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(""); // Keep raw input format
  const [endTime, setEndTime] = useState("");

  const handleScheduleClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) {
      toast.error("Please fill in all fields.");
      return;
    }

    const formattedStartTime = new Date(startTime).toISOString(); 
    const formattedEndTime = new Date(endTime).toISOString();

    const response = await fetch("http://localhost:8000/api/live-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        teacherId: userId,
        title,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
      }),
      credentials: "include",
    });

    if (response.ok) {
      toast.success("Live class scheduled successfully!");
      router.push(`/search/${courseId}`);
    } else {
      const error = await response.json();
      toast.error(error.message || "Failed to schedule class.");
    }
  };

  return (
    <div className="min-h-screen p-8">
      <Card className="max-w-lg mx-auto bg-[#2D2E36] border-none">
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold text-white mb-6">Schedule a Live Class</h1>
          <form onSubmit={handleScheduleClass} className="space-y-4">
            <div>
              <label className="text-gray-300 block mb-1">Class Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter class title"
                className="bg-[#3A3B45] text-white border-none"
              />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Start Time</label>
              <Input
                type="datetime-local"
                value={startTime} // Direct value, no formatting
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-[#3A3B45] text-white border-none"
              />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">End Time</label>
              <Input
                type="datetime-local"
                value={endTime} // Direct value, no formatting
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-[#3A3B45] text-white border-none"
              />
            </div>
            <Button type="submit" className="w-full bg-[#6366F1] hover:bg-[#4f46e5] text-white">
              Schedule Class
            </Button>
          </form>
          <Button
            variant="outline"
            className="w-full mt-4 bg-transparent border-gray-600 text-gray-300 hover:bg-[#3A3B45]"
            onClick={() => router.push(`/course/${courseId}`)}
          >
            Back to Course
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleLiveClass;
