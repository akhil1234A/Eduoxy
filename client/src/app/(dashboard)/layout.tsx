"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import ChaptersSidebar from "./user/courses/[courseId]/ChaptersSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [courseId, setCourseId] = useState<string | null>(null);
  const isCoursePage = /^\/user\/courses\/[^\/]+(?:\/chapters\/[^\/]+)?$/.test(pathname);

  useEffect(() => {
    if (isCoursePage) {
      const match = pathname.match(/\/user\/courses\/([^\/]+)/);
      setCourseId(match ? match[1] : null);
    } else {
      setCourseId(null);
    }
  }, [isCoursePage, pathname]);

  return (
    <SidebarProvider>
      <div className="dashboard">
        <AppSidebar />
        <div className="dashboard__content">
          {courseId && <ChaptersSidebar courseId={courseId} />} 
          <div
            className={cn("dashboard__main", isCoursePage && "dashboard__main--not-course")}
            style={{ height: "100vh" }}
          >
            <Navbar isCoursePage={isCoursePage} />
            <main className="dashboard__body">{children}</main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}