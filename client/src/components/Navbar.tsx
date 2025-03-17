"use client";

import React, { useState } from "react";
import { BookOpen, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useLogoutMutation } from "@/state/redux";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';
import { NotificationBell } from "@/components/NotificationBell";

const Navbar = ({ isCoursePage }: { isCoursePage: boolean }) => {
  const userType = Cookies.get("userType");
  const router = useRouter();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      router.push("/signin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleProfileCard = () => {
    setIsProfileOpen((prev) => !prev);
  };

  const profileRoute = userType === "teacher" ? "/teacher/profile" : "/user/profile";

  return (
    <nav className="dashboard-navbar">
      <div className="dashboard-navbar__container">
        <div className="dashboard-navbar__search">
          <div className="md:hidden">
            <SidebarTrigger className="dashboard-navbar__sidebar-trigger" />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Link
                href="/search"
                className={cn("dashboard-navbar__search-input", {
                  "!bg-customgreys-secondarybg": isCoursePage,
                })}
                scroll={false}
              >
                <span className="hidden sm:inline">Search Courses</span>
                <span className="sm:hidden">Search</span>
              </Link>
              <BookOpen className="dashboard-navbar__search-icon" size={18} />
            </div>
          </div>
        </div>

        <div className="dashboard-navbar__actions">
          <NotificationBell />

          {/* Profile Icon with Dropdown Card */}
          <div className="relative">
            <button
              onClick={toggleProfileCard}
              className="dashboard-navbar__profile-button"
              disabled={isLoggingOut}
              aria-label="Toggle profile menu"
            >
              <UserIcon className="text-customgreys-dirtyGrey" size={24} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-customgreys-primarybg border border-gray-700 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <Link
                    href={profileRoute}
                    className="block px-4 py-2 text-sm text-customgreys-dirtyGrey hover:bg-customgreys-secondarybg"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Manage Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-customgreys-dirtyGrey hover:bg-customgreys-secondarybg"
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;