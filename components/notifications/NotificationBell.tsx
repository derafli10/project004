"use client";

import React, { useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/lib/store/notification-store";
import { NotificationPanel } from "./NotificationPanel";

export function NotificationBell() {
  const { unreadCount, togglePanel, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          togglePanel();
        }}
        className="relative flex items-center justify-center min-w-[44px] min-h-[44px] text-brutal-text-secondary hover:text-brutal-text active:bg-brutal-border/10 transition-colors rounded-none outline-none focus:ring-2 focus:ring-brutal-orange focus:ring-offset-2 focus:ring-offset-brutal-black"
        aria-label="Toggle notifications"
      >
        <Bell size={20} strokeWidth={2.5} className="text-brutal-orange" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center border border-brutal-black bg-brutal-orange text-[10px] font-bold text-white font-numeric">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* On desktop the panel will slide out next to the sidebar, on mobile it will pop up above the nav */}
      {/* Since the bell is used in both places, the NotificationPanel inside it will use absolute positioning */}
      {/* However, for mobile nav we might need to adjust the panel position to pop UP instead of DOWN. */}
      {/* We can do this with CSS or by wrapping it differently. I've designed NotificationPanel to handle standard absolute flow. */}
      {/* Let's pass a custom className if needed, but for now NotificationPanel is standard */}
      <NotificationPanel />
    </div>
  );
}
