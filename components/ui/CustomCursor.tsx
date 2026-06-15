"use client";

import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        window.getComputedStyle(target).cursor === "pointer" ||
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "button" ||
        target.closest("a") ||
        target.closest("button")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  return (
    <>
      {/* Background Mask Layer (turns white text orange) */}
      <div
        className="pointer-events-none fixed left-0 top-0 z-[100] rounded-full transition-all duration-100 ease-out"
        style={{
          width: isHovering ? "80px" : "40px",
          height: isHovering ? "80px" : "40px",
          transform: `translate3d(${position.x - (isHovering ? 40 : 20)}px, ${
            position.y - (isHovering ? 40 : 20)
          }px, 0)`,
          backgroundColor: "#FF4500",
          mixBlendMode: "darken",
        }}
      />
      
      {/* Hollow Outline Layer */}
      <div
        className="pointer-events-none fixed left-0 top-0 z-[101] rounded-full transition-all duration-100 ease-out"
        style={{
          width: isHovering ? "80px" : "40px",
          height: isHovering ? "80px" : "40px",
          transform: `translate3d(${position.x - (isHovering ? 40 : 20)}px, ${
            position.y - (isHovering ? 40 : 20)
          }px, 0)`,
          border: "2px solid #FF4500",
          backgroundColor: "transparent",
        }}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        * {
          cursor: none !important;
        }
      `}} />
    </>
  );
}
