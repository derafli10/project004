"use client";

import React, { useTransition, useState, useOptimistic } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type Route } from "next";
import { CourseSchema, CourseInput } from "@/lib/validations";
import { updateCourse } from "@/lib/actions/course";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface CourseEditFormProps {
  course: {
    id: string;
    name: string;
    sks: number;
    targetGrade: "A" | "AB" | "B" | "BC" | "C" | "D" | "E";
    version: number;
  };
}

export function CourseEditForm({ course }: CourseEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Optimistic UI updates
  const [optimisticCourse, addOptimisticCourse] = useOptimistic<CourseInput | null, CourseInput>(
    null,
    (_state, newCourse) => newCourse
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseInput>({
    resolver: zodResolver(CourseSchema),
    defaultValues: {
      name: course.name,
      sks: course.sks,
      targetGrade: course.targetGrade,
    },
  });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const onSubmit = (data: CourseInput) => {
    startTransition(async () => {
      // Instantly add course to UI
      addOptimisticCourse(data);

      try {
        // Implement 10-second timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Request timeout")), 10000)
        );
        
        const result = await Promise.race([
          updateCourse(course.id, { ...data, version: course.version }),
          timeoutPromise
        ]) as any;

        if (result.success) {
          showToast("success", "Course updated successfully!");
          router.push(`/courses/${course.id}` as Route);
          router.refresh();
        } else {
          if (result.error && result.error.includes("Concurrent modification")) {
             showToast("error", "Version conflict: " + result.error);
          } else {
             showToast("error", result.error || "Failed to update course");
          }
        }
      } catch (error) {
        showToast("error", error instanceof Error ? error.message : "An unexpected error occurred");
      }
    });
  };

  return (
    <Card className={`max-w-xl mx-auto ${isPending ? 'opacity-70 border-dashed' : ''}`}>
      <h2 className="text-2xl font-heading font-bold uppercase mb-6 border-b-brutal border-brutal-border pb-4">
        Edit Course
      </h2>

      {toast && (
        <div className={`mb-6 p-4 border-brutal flex items-start gap-3 ${
          toast.type === "error" 
            ? "bg-brutal-orange/10 border-brutal-orange text-brutal-orange" 
            : "bg-brutal-success/10 border-brutal-success text-brutal-success"
        }`} role={toast.type === "error" ? "alert" : "status"} aria-live="polite">
          {toast.type === "error" ? <AlertCircle size={20} aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
          <p className="font-bold">{toast.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-heading font-bold text-brutal-text-secondary uppercase mb-2">
            Course Name
          </label>
          <Input
            id="name"
            placeholder="e.g., Database Systems"
            {...register("name")}
            disabled={isPending}
            className={errors.name ? "border-brutal-orange focus:ring-brutal-orange" : ""}
          />
          {errors.name && (
            <p className="mt-2 text-sm text-brutal-orange font-bold flex items-center gap-1" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="sks" className="block text-sm font-heading font-bold text-brutal-text-secondary uppercase mb-2">
            SKS (Credits)
          </label>
          <select
            id="sks"
            {...register("sks", { valueAsNumber: true })}
            disabled={isPending}
            className={`flex h-11 w-full border-brutal border-brutal-border bg-brutal-black px-3 py-2 text-base text-brutal-text focus:outline-none focus:ring-2 focus:ring-brutal-orange min-h-[44px] ${
              errors.sks ? "border-brutal-orange" : ""
            }`}
          >
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'Credit' : 'Credits'}
              </option>
            ))}
          </select>
          {errors.sks && (
            <p className="mt-2 text-sm text-brutal-orange font-bold flex items-center gap-1" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              {errors.sks.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="targetGrade" className="block text-sm font-heading font-bold text-brutal-text-secondary uppercase mb-2">
            Target Grade
          </label>
          <select
            id="targetGrade"
            {...register("targetGrade")}
            disabled={isPending}
            className={`flex h-11 w-full border-brutal border-brutal-border bg-brutal-black px-3 py-2 text-base text-brutal-text focus:outline-none focus:ring-2 focus:ring-brutal-orange min-h-[44px] font-numeric font-bold ${
              errors.targetGrade ? "border-brutal-orange" : ""
            }`}
          >
            <option value="A">A (80.00% - 100%)</option>
            <option value="AB">AB (75.00% - 79.99%)</option>
            <option value="B">B (70.00% - 74.99%)</option>
            <option value="BC">BC (65.00% - 69.99%)</option>
            <option value="C">C (60.00% - 64.99%)</option>
            <option value="D">D (55.00% - 59.99%)</option>
            <option value="E">E (0.00% - 54.99%)</option>
          </select>
          {errors.targetGrade && (
            <p className="mt-2 text-sm text-brutal-orange font-bold flex items-center gap-1" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              {errors.targetGrade.message}
            </p>
          )}
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full"
            disabled={isPending}
          >
            {isPending ? "Updating Course..." : "Update Course"}
          </Button>
        </div>
      </form>

      {optimisticCourse && (
        <div className="mt-8 border-t-brutal border-brutal-border pt-6 animate-pulse" aria-live="polite">
          <h3 className="text-sm font-heading font-bold text-brutal-text-secondary uppercase mb-4">
            Saving Changes...
          </h3>
          <Card className="p-0 overflow-hidden opacity-70 border-dashed border-brutal-orange bg-brutal-border/5">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-heading font-bold text-lg leading-tight text-brutal-orange">
                    {optimisticCourse.name}
                  </h3>
                  <div className="text-sm text-brutal-text-secondary mt-1 flex items-center gap-2">
                    <span>{optimisticCourse.sks} SKS</span>
                    <span className="text-brutal-text-muted">•</span>
                    <span>Target: <span className="font-bold font-numeric">{optimisticCourse.targetGrade}</span></span>
                  </div>
                </div>
                <Badge level="NORMAL">Pending</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}
