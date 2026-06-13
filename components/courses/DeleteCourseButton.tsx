"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Route } from "next";
import { deleteCourse } from "@/lib/actions/course";
import { Button } from "@/components/ui/Button";
import { Trash2, AlertCircle } from "lucide-react";

interface DeleteCourseButtonProps {
  courseId: string;
}

export function DeleteCourseButton({ courseId }: DeleteCourseButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    startTransition(async () => {
      setError(null);
      const result = await deleteCourse(courseId);
      
      if (result.success) {
        router.push("/dashboard" as Route);
        router.refresh();
      } else {
        setError(result.error || "Failed to delete course");
      }
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isPending) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending]);

  return (
    <>
      <Button 
        variant="secondary" 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-brutal-orange border-brutal-orange hover:bg-brutal-orange hover:text-brutal-black"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Trash2 size={16} strokeWidth={3} aria-hidden="true" />
        <span>Delete Course</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#09090B] border-2 border-[#FF4500] p-6 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(255,69,0,1)] flex flex-col gap-4">
            <h3 className="text-xl font-heading font-bold uppercase text-[#FF4500] border-b-2 border-[#E2E8F0] pb-2">
              Delete Course
            </h3>
            
            <p className="text-[#FAFAFA] font-body text-base">
              Are you sure you want to delete this course? This action cannot be undone and will cascade delete all associated components and scores.
            </p>

            {error && (
              <div className="bg-[#FF4500]/10 border-2 border-[#FF4500] text-[#FF4500] p-3 flex items-start gap-2" role="alert">
                <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span className="font-bold text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-4 mt-2">
              <Button 
                variant="secondary" 
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 bg-[#FF4500] text-[#09090B] hover:bg-[#FF4500]/90"
              >
                {isPending ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
