"use client";

import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification._id);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative w-10 h-10 rounded-full bg-customgreys-darkGrey hover:bg-customgreys-darkerGrey"
        >
          <Bell className="h-5 w-5 text-customgreys-dirtyGrey" size={24}/>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary-700 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4 bg-customgreys-darkGrey border border-customgreys-secondarybg shadow-xl"
        align="end"
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-white">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-primary-500 hover:text-primary-400 hover:bg-customgreys-darkerGrey"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px] -mx-4 px-4">
          {notifications.length === 0 ? (
            <p className="text-center text-customgreys-dirtyGrey py-8">
              No notifications
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-3 cursor-pointer rounded-lg transition-colors
                    ${!notification.isRead 
                      ? "bg-customgreys-primarybg hover:bg-customgreys-secondarybg" 
                      : "hover:bg-customgreys-secondarybg"
                    }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        getNotificationTypeColor(notification.type)
                      }`}
                    />
                    <div>
                      <p className="font-medium text-white mb-1">{notification.title}</p>
                      <p className="text-sm text-customgreys-dirtyGrey">
                        {notification.message}
                      </p>
                      <p className="text-xs text-customgreys-dirtyGrey/70 mt-2">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function getNotificationTypeColor(type: string) {
  switch (type) {
    case "success":
      return "bg-green-500";
    case "error":
      return "bg-red-500";
    case "warning":
      return "bg-yellow-500";
    default:
      return "bg-primary-500";
  }
}

function formatTimeAgo(date: Date) {
  const now = Date.now();
  const past = new Date(date).getTime();
  const diffInSeconds = Math.round((past - now) / 1000);

  const units: { [key: string]: number } = {
    year: 60 * 60 * 24 * 365,
    month: 60 * 60 * 24 * 30,
    week: 60 * 60 * 24 * 7,
    day: 60 * 60 * 24,
    hour: 60 * 60,
    minute: 60,
    second: 1,
  };

  for (const [unit, secondsInUnit] of Object.entries(units)) {
    if (Math.abs(diffInSeconds) >= secondsInUnit || unit === "second") {
      const value = Math.round(diffInSeconds / secondsInUnit);
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(value, unit as Intl.RelativeTimeFormatUnit);
    }
  }
}
