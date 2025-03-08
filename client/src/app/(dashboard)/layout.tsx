"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading"; 
import { useSelector, useDispatch } from "react-redux"; 
import { RootState } from "@/state/redux";
import { useRefreshMutation } from "@/state/api/authApi";
import { setToken } from "@/state/reducer/auth.reducer";
 
// import ChaptersSidebar from "./user/courses/[courseId]/ChaptersSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [courseId, setCourseId] = useState<string | null>(null);
  const { token } = useSelector((state: RootState) => state.auth); 
  const dispatch = useDispatch();
  const [refresh, { isLoading: isRefreshing }] = useRefreshMutation();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isCoursePage = /^\/user\/courses\/[^\/]+(?:\/chapters\/[^\/]+)?$/.test(pathname);

  useEffect(() => {
    if (isCoursePage) {
      const match = pathname.match(/\/user\/courses\/([^\/]+)/);
      setCourseId(match ? match[1] : null);
    } else {
      setCourseId(null);
    }
  }, [isCoursePage, pathname]);

  useEffect(() => {
    const restoreAuth = async () => {
      if (!token) {
        try {
          const response = await refresh().unwrap();
          if (response) {
            dispatch(
              setToken({
                token: response?.data?.accessToken,
                user: response.data.user as UserResponse,
              })
            );
          }
        } catch (error) {
          console.error("Failed to restore token on reload:", error);
        }
      }
      setIsInitialLoad(false);
    };

    restoreAuth();
  }, [token, refresh, dispatch]);

  if (isInitialLoad || isRefreshing) return <Loading />;


  if (!token) return <div>Please sign in to access this page.</div>;

  return (
    <SidebarProvider>
      <div className="dashboard">
        <AppSidebar />
        <div className="dashboard__content">
          {courseId && <ChaptersSidebar />}
          <div
            className={cn(
              "dashboard__main",
              isCoursePage && "dashboard__main--not-course"
            )}
            style={{ height: "100vh" }}
          >
            <Navbar isCoursePage={isCoursePage} />
            <main className="dashboard__body">{children}</main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};