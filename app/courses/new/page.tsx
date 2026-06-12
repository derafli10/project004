import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { CourseForm } from "@/components/courses/CourseForm";
import Link from "next/link";
import { type Route } from "next";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Create Course - Grade Optimizer",
};

export default function NewCoursePage() {
  return (
    <PageContainer>
      <div className="mb-6">
        <Link 
          href={"/dashboard" as Route} 
          className="inline-flex items-center gap-2 text-brutal-text-secondary hover:text-brutal-orange font-bold uppercase text-sm tracking-wide transition-colors min-h-[44px]"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Back to Dashboard
        </Link>
      </div>
      
      <CourseForm />
    </PageContainer>
  );
}
