import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseById } from "@/lib/actions/course";
import { PageContainer } from "@/components/layout/PageContainer";
import { ComponentMatrix } from "@/components/courses/ComponentMatrix";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Edit, Settings } from "lucide-react";
import { DeleteCourseButton } from "@/components/courses/DeleteCourseButton";
import { RelativeTime } from "@/components/ui/RelativeTime";
import type { Route } from "next";

export const metadata = {
  title: "Course Details - Grade Optimizer",
};

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const resolvedParams = await params;
  const { courseId } = resolvedParams;

  const result = await getCourseById(courseId);

  if (!result.success || !result.data) {
    notFound();
  }

  const course = result.data;

  return (
    <PageContainer>
      <div className="mb-6">
        <Link
          href={"/dashboard" as Route}
          className="inline-flex items-center gap-2 text-brutal-text-secondary hover:text-brutal-orange font-bold uppercase text-sm tracking-wide transition-colors min-h-[44px]"
        >
          <ArrowLeft size={16} strokeWidth={2.5} aria-hidden="true" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase tracking-tight text-brutal-orange">
            {course.name}
          </h1>
          <div className="text-brutal-text-secondary mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:text-base">
            <span className="font-bold bg-brutal-border/10 px-3 py-1 border border-brutal-border">
              {course.sks} SKS
            </span>
            <span className="font-bold bg-brutal-border/10 px-3 py-1 border border-brutal-border">
              Target Grade: <span className="text-brutal-text font-numeric">{course.targetGrade}</span>
            </span>
          </div>
          
          <div className="text-brutal-text-muted mt-4 text-xs md:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 uppercase font-bold tracking-wide">
            <div>
              Created: <RelativeTime timestamp={course.createdAt} className="text-brutal-text" />
            </div>
            <div className="hidden sm:block text-brutal-border/30">•</div>
            <div>
              Last updated: <RelativeTime timestamp={course.updatedAt} className="text-brutal-text" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/courses/${course.id}/components` as Route}>
            <Button variant="secondary" className="flex items-center gap-2">
              <Settings size={16} strokeWidth={3} aria-hidden="true" />
              <span>Manage Components</span>
            </Button>
          </Link>
          <Link href={`/courses/${course.id}/edit` as Route}>
            <Button variant="secondary" className="flex items-center gap-2">
              <Edit size={16} strokeWidth={3} aria-hidden="true" />
              <span>Edit Course</span>
            </Button>
          </Link>
          <DeleteCourseButton courseId={course.id} />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-heading font-bold uppercase mb-4 border-b-brutal border-brutal-border pb-2">
          Component Matrix
        </h2>
        <ComponentMatrix
          courseId={course.id}
          targetThreshold={course.targetThreshold}
          initialComponents={course.components}
          initialAnalytics={course.analytics}
        />
      </div>
    </PageContainer>
  );
}
