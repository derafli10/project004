import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseById } from "@/lib/actions/course";
import { PageContainer } from "@/components/layout/PageContainer";
import { ComponentEditor } from "@/components/courses/ComponentEditor";
import { ArrowLeft } from "lucide-react";
import type { Route } from "next";

export const metadata = {
  title: "Manage Components - Grade Optimizer",
};

interface ManageComponentsPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function ManageComponentsPage({ params }: ManageComponentsPageProps) {
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
          href={`/courses/${courseId}` as Route} 
          className="inline-flex items-center gap-2 text-brutal-text-secondary hover:text-brutal-orange font-bold uppercase text-sm tracking-wide transition-colors min-h-[44px]"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Back to Course Details
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold uppercase tracking-tight text-brutal-orange">
          {course.name}
        </h1>
        <p className="text-brutal-text-secondary mt-1 text-sm uppercase font-heading font-bold">
          Manage Grading Components
        </p>
      </div>

      <ComponentEditor 
        courseId={courseId} 
        initialComponents={course.components} 
      />
    </PageContainer>
  );
}
