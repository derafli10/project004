"use client";

import React, { useEffect, useRef } from "react";
import { X, CheckCircle2, Clock } from "lucide-react";
import { useNotificationStore } from "@/lib/store/notification-store";
import { Badge } from "@/components/ui/Badge";

function RelativeTime({ date }: { date: Date | string }) {
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    const d = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diffInSeconds < 60) setText("Just now");
    else if (diffInSeconds < 3600) setText(`${Math.floor(diffInSeconds / 60)}m ago`);
    else if (diffInSeconds < 86400) setText(`${Math.floor(diffInSeconds / 3600)}h ago`);
    else setText(`${Math.floor(diffInSeconds / 86400)}d ago`);
  }, [date]);

  return <span className="text-xs font-mono text-brutal-text-muted flex items-center gap-1"><Clock size={12} /> {text}</span>;
}

export function NotificationPanel() {
  const { 
    notifications, 
    isOpen, 
    closePanel, 
    markAsRead, 
    markAllAsRead
  } = useNotificationStore();
  
  const panelRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        closePanel();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, closePanel]);

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="absolute right-0 md:right-auto md:left-full md:ml-2 top-full md:top-0 mt-2 md:mt-0 w-[calc(100vw-2rem)] md:w-96 bg-brutal-black border-brutal border-brutal-border shadow-brutal z-50 flex flex-col max-h-[80vh] sm:max-h-[60vh] max-w-sm right-2"
      style={{
        // For mobile we adjust positioning 
        position: 'absolute'
      }}
    >
      <div className="p-4 border-b-brutal border-brutal-border flex justify-between items-center bg-brutal-border/5">
        <h3 className="font-heading font-bold uppercase tracking-wider text-sm flex items-center gap-2">
          Notifications
          <Badge level="NORMAL" className="scale-75">{notifications.filter(n => !n.isRead).length}</Badge>
        </h3>
        <div className="flex gap-3 items-center">
          {notifications.some(n => !n.isRead) && (
            <button 
              onClick={markAllAsRead}
              className="text-xs text-brutal-text-secondary hover:text-brutal-text underline transition-colors font-body"
            >
              Mark all read
            </button>
          )}
          <button onClick={closePanel} className="text-brutal-text-muted hover:text-brutal-orange transition-colors" aria-label="Close notifications">
            <X size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-brutal-text-muted">
            <CheckCircle2 size={32} strokeWidth={1.5} className="mx-auto mb-2 opacity-50" />
            <p className="font-body text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-brutal-border">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 transition-colors ${
                  notification.isRead 
                    ? 'bg-brutal-black opacity-70' 
                    : 'bg-brutal-border/5 hover:bg-brutal-border/10 cursor-pointer'
                }`}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge level={notification.alertLevel} className="scale-90 origin-left">
                    {notification.alertLevel}
                  </Badge>
                  <RelativeTime date={notification.createdAt} />
                </div>
                <p className="text-sm font-body mb-2 leading-relaxed text-brutal-text">
                  {notification.message}
                </p>
                <p className="text-xs font-heading font-bold text-brutal-text-secondary uppercase tracking-wider">
                  {notification.course.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
