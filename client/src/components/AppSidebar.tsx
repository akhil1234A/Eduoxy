"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BookOpen,
  Briefcase,
  DollarSign,
  LogOut,
  PanelLeft,
  Settings,
  User,
  Users,
  BarChart,
  MessageCircle,
  MessageSquareMore,
  Code
} from "lucide-react";
import Loading from "./Loading";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useLogoutMutation } from "@/state/api/authApi";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const AppSidebar = () => {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const router = useRouter();
  const [userType, setUserType] = useState<string | null>(null); 

  useEffect(() => {
    const type = Cookies.get("userType") || "student"; 
    setUserType(type);
  }, []);

  const navLinks = {
    student: [
      { icon: BookOpen, label: "Courses", href: "/user/courses" },
      { icon: Briefcase, label: "Purchases", href: "/user/purchases" },
      { icon: User, label: "Profile", href: "/user/profile" },
      { icon: Settings, label: "Settings", href: "/user/settings" },
      { icon: MessageCircle, label: "Chat", href: "/user/chat" },
      { icon: MessageSquareMore, label: "Forum", href: "/user/forum" },
      { icon: BookOpen, label: "Roadmaps", href: "/user/roadmaps" },
    ],
    teacher: [
      { icon: BarChart, label: "Dashboard", href: "/teacher/dashboard" },
      { icon: BookOpen, label: "Courses", href: "/teacher/courses" },
      { icon: DollarSign, label: "Earnings", href: "/teacher/earnings" },
      { icon: User, label: "Profile", href: "/teacher/profile" },
      { icon: Settings, label: "Settings", href: "/teacher/settings" },
      { icon: MessageCircle, label: "Chat", href: "/teacher/chat" },
    ],
    admin: [
      { icon: BarChart, label: "Dashboard", href: "/admin/dashboard" },
      { icon: DollarSign, label: "Earnings", href: "/admin/earnings" },
      { icon: Users, label: "Users", href: "/admin/users" },
      { icon: User, label: "Instructors", href: "/admin/instructors" },
      { icon: BookOpen, label: "Courses", href: "/admin/courses" },
      { icon: Settings, label: "Settings", href: "/admin/settings" },
      { icon: BookOpen, label: "Roadmaps", href: "/admin/roadmaps" },
    ],
  };

  const handleSignOut = async () => {
    try {
      await logout().unwrap();
      router.push("/signin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoggingOut) return <Loading />;
  if (!userType) return <Loading />; 

  const currentNavLinks = navLinks[userType as keyof typeof navLinks] || navLinks.student;

  return (
    <Sidebar
      collapsible="icon"
      style={{ height: "100vh" }}
      className="bg-customgreys-primarybg border-none shadow-lg"
    >
      <SidebarHeader>
        <SidebarMenu className="app-sidebar__menu">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => toggleSidebar()}
              className="group hover:bg-customgreys-secondarybg"
            >
              <div className="app-sidebar__logo-container group">
                <div className="app-sidebar__logo-wrapper">
                  <p className="app-sidebar__title">EDUOXY</p>
                </div>
                <PanelLeft className="app-sidebar__collapse-icon" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="app-sidebar__nav-menu">
          {currentNavLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <SidebarMenuItem
                key={link.href}
                className={cn(
                  "app-sidebar__nav-item",
                  isActive && "bg-gray-800"
                )}
              >
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className={cn(
                    "app-sidebar__nav-button",
                    !isActive && "text-customgreys-dirtyGrey"
                  )}
                >
                  <Link
                    href={link.href}
                    className="app-sidebar__nav-link"
                    scroll={false}
                  >
                    <link.icon
                      className={isActive ? "text-white-50" : "text-gray-500"}
                    />
                    <span
                      className={cn(
                        "app-sidebar__nav-text",
                        isActive ? "text-white-50" : "text-gray-500"
                      )}
                    >
                      {link.label}
                    </span>
                  </Link>
                </SidebarMenuButton>
                {isActive && <div className="app-sidebar__active-indicator" />}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={handleSignOut}
                className="app-sidebar__signout"
                disabled={isLoggingOut}
              >
                <LogOut className="mr-2 h-6 w-6" />
                <span>Sign out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;