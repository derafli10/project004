import React, { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/courses/ExportButton";
import { ImportButton } from "@/components/courses/ImportButton";
import { CourseList } from "@/components/courses/CourseList";
import { CourseListSkeleton } from "@/components/courses/CourseListSkeleton";

export const metadata = {
  title: "Dashboard - Grade Optimizer",
};

interface DashboardPageProps {
  searchParams: { page?: string };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;

  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Dashboard</h1>
          <p className="text-brutal-text-secondary mt-1">Overview of your academic performance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <ImportButton />
          <ExportButton />
          <Link href={"/courses/new" as Route}>
            <Button className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
              <span>Create Course</span>
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<CourseListSkeleton />}>
        <CourseList page={page} />
      </Suspense>
    </PageContainer>
  );
}
