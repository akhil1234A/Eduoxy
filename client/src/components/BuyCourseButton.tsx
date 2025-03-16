"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function BuyCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter();

  const handlePurchase = () => {
    router.push(`/payment/${courseId}`);
  };

  return (
    <Button 
      onClick={handlePurchase}
      className="bg-primary-700 hover:bg-primary-600"
    >
      Purchase Course
    </Button>
  );
} 