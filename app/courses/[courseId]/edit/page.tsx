import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseById } from "@/lib/actions/course";
import { PageContainer } from "@/components/layout/PageContainer";
import { CourseEditForm } from "@/components/courses/CourseEditForm";
import { ArrowLeft } from "lucide-react";
import type { Route } from "next";

export const metadata = {
  title: "Edit Course - Grade Optimizer",
};

interface EditCoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const resolvedParams = await params;
  const { courseId } = resolvedParams;
  
  const result = await getCourseById(courseId);

  if (!result.success || !result.data) {
    notFound();
  }

  const course = result.data;

  // We only pass the fields required by CourseEditForm
  const editCourseData = {
    id: course.id,
    name: course.name,
    sks: course.sks,
    targetGrade: course.targetGrade,
    version: course.version,
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <Link 
          href={`/courses/${course.id}` as Route} 
          className="inline-flex items-center gap-2 text-brutal-text-secondary hover:text-brutal-orange font-bold uppercase text-sm tracking-wide transition-colors min-h-[44px]"
        >
          <ArrowLeft size={16} strokeWidth={2.5}  aria-hidden="true" />
          Back to Course
        </Link>
      </div>

      <CourseEditForm course={editCourseData} />
    </PageContainer>
  );
}
