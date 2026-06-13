"use client";

import React, { useEffect, useState } from "react";

interface RelativeTimeProps {
  timestamp: Date | string;
  className?: string;
}

export function RelativeTime({ timestamp, className = "" }: RelativeTimeProps): React.JSX.Element {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const date = new Date(timestamp);
  
  // Format as ISO 8601 string for title/tooltip
  const isoString = date.toISOString();

  // Calculate relative time
  const getRelativeTime = (date: Date): string => {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const diffInMs = date.getTime() - new Date().getTime();
    const diffInSeconds = Math.round(diffInMs / 1000);
    const diffInMinutes = Math.round(diffInSeconds / 60);
    const diffInHours = Math.round(diffInMinutes / 60);
    const diffInDays = Math.round(diffInHours / 24);
    const diffInWeeks = Math.round(diffInDays / 7);
    const diffInMonths = Math.round(diffInDays / 30);
    const diffInYears = Math.round(diffInDays / 365);

    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(diffInSeconds, "second");
    } else if (Math.abs(diffInMinutes) < 60) {
      return rtf.format(diffInMinutes, "minute");
    } else if (Math.abs(diffInHours) < 24) {
      return rtf.format(diffInHours, "hour");
    } else if (Math.abs(diffInDays) < 7) {
      return rtf.format(diffInDays, "day");
    } else if (Math.abs(diffInWeeks) < 4) {
      return rtf.format(diffInWeeks, "week");
    } else if (Math.abs(diffInMonths) < 12) {
      return rtf.format(diffInMonths, "month");
    } else {
      return rtf.format(diffInYears, "year");
    }
  };

  const relativeString = getRelativeTime(date);

  if (!mounted) {
    // Avoid hydration mismatch by rendering a generic or empty string initially
    // or just the ISO string which is deterministic (but we'd need it to be server-time consistent)
    // Using suppressHydrationWarning on the time element is better
  }

  return (
    <time
      dateTime={isoString}
      title={isoString}
      className={`font-numeric ${className}`}
      suppressHydrationWarning
    >
      {mounted ? relativeString : "Loading..."}
    </time>
  );
}
