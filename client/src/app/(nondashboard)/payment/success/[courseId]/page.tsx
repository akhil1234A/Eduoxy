"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { coursesApi } from "@/state/redux"; // Import coursesApi
import Cookies from "js-cookie";

export default function SuccessPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const userId = Cookies.get("userId") || localStorage.getItem("userId");

  // Trigger refetch of enrolled courses on mount
  useEffect(() => {
    if (userId) {
      dispatch(
        coursesApi.util.invalidateTags([
          { type: "Courses" },
          { type: "UserCourseProgress" },
        ])
      );
    }
  }, [dispatch, userId]);

  const handleStartLearning = () => {
    router.push(`/user/courses`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
        <p className="mb-8">Thank you for your purchase. Your course is now available.</p>
        <Button
          onClick={handleStartLearning}
          className="bg-primary-700"
        >
          Start Learning
        </Button>
      </div>
    </div>
  );
}