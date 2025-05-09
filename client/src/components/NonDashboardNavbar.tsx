"use client";
import { BookOpen, User as UserIcon } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { useLogoutMutation } from "@/state/redux";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/NotificationBell";

const NonDashboardNavbar = () => {
  const [userId, setUserId] = useState<string | null>(null); 
  const [userType, setUserType] = useState<string | undefined>(undefined);
  const router = useRouter();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const id = Cookies.get("userId");
    setUserId(id || null); 
    setUserType(Cookies.get("userType"));
  }, []);


  const handleLogout = async () => {
    try {
      await logout().unwrap();
      ["userId", "userName", "userType"].forEach((item) => {
        Cookies.remove(item);
        localStorage.removeItem(item);
      });
      router.push("/signin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleProfileCard = () => {
    setIsProfileOpen((prev) => !prev);
  };

  const profileRoute = `/${userType}/profile`;

  return (
    <nav className="nondashboard-navbar">
      <div className="nondashboard-navbar__container">
        <div className="nondashboard-navbar__search">
          <Link href="/" className="nondashboard-navbar__brand" scroll={false}>
            EDUOXY
          </Link>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Link
                href="/search"
                className="nondashboard-navbar__search-input"
                scroll={false}
              >
                <span className="hidden sm:inline">Search Courses</span>
                <span className="sm:hidden">Search</span>
              </Link>
              <BookOpen className="nondashboard-navbar__search-icon" size={18} />
            </div>
          </div>
        </div>
        <div className="nondashboard-navbar__actions">
          {userId ? (
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleProfileCard}
                  className="w-10 h-10 rounded-full bg-customgreys-darkGrey hover:bg-customgreys-darkerGrey flex items-center justify-center"
                  disabled={isLoggingOut}
                  aria-label="Toggle profile menu"
                >
                  <UserIcon className="text-customgreys-dirtyGrey" size={24} />
                </Button>
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
          ) : (
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                asChild
                className="nondashboard-navbar__auth-button--login"
              >
                <Link href="/signin" scroll={false}>
                  Log in
                </Link>
              </Button>
              <Button
                variant="default"
                asChild
                className="nondashboard-navbar__auth-button--signup"
              >
                <Link href="/signup" scroll={false}>
                  Sign up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NonDashboardNavbar;