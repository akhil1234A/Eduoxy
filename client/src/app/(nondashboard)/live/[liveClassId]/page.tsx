"use client";

import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import LiveClass from "@/components/LiveClass";
import Cookies from "js-cookie";
import Loading from "@/components/Loading";

const LiveClassPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const liveClassId = params.liveClassId as string;
  const userId = searchParams.get("userId") ?? Cookies.get("userId");
  const courseId = searchParams.get("courseId") as string;
  const teacherId = searchParams.get("teacherId") as string;

  if (!liveClassId || !userId || !courseId || !teacherId) {
    console.error("Missing parameters:", { liveClassId, userId, courseId, teacherId });
    return <Loading />;
  }

  return (
    <LiveClass
      liveClassId={liveClassId}
      courseId={courseId}
      userId={userId}
      teacherId={teacherId}
    />
  );
};

export default LiveClassPage;