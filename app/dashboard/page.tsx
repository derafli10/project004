import React from "react";
import Link from "next/link";
import type { Route } from "next";
import { getCourses } from "@/lib/actions/course";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Plus, BookOpen } from "lucide-react";
import { ExportButton } from "@/components/courses/ExportButton";
import { ImportButton } from "@/components/courses/ImportButton";

export const metadata = {
  title: "Dashboard - Grade Optimizer",
};

export default async function DashboardPage() {
  const result = await getCourses();
  const courses = result.success ? result.data : [];

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
              <Plus size={20} strokeWidth={2.5}  aria-hidden="true" />
              <span>Create Course</span>
            </Button>
          </Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <BookOpen size={48} strokeWidth={1.5} className="text-brutal-text-muted mb-4"  aria-hidden="true" />
          <h3 className="text-xl font-heading font-bold mb-2">No courses found</h3>
          <p className="text-brutal-text-secondary max-w-md mb-6">
            You haven't added any courses yet. Create your first course to start optimizing your grades.
          </p>
          <Link href={"/courses/new" as Route}>
            <Button variant="secondary">Add Your First Course</Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Desktop View: Table */}
          <div className="hidden md:block">
            <div className="border-brutal border-brutal-border bg-brutal-black overflow-x-auto shadow-brutal">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-brutal border-brutal-border bg-brutal-border/5">
                    <th className="p-4 font-heading font-bold uppercase tracking-wide text-xs">Course Name</th>
                    <th className="p-4 font-heading font-bold uppercase tracking-wide text-xs">SKS</th>
                    <th className="p-4 font-heading font-bold uppercase tracking-wide text-xs">Target</th>
                    <th className="p-4 font-heading font-bold uppercase tracking-wide text-xs text-right">Cumulative</th>
                    <th className="p-4 font-heading font-bold uppercase tracking-wide text-xs text-right">Required</th>
                    <th className="p-4 font-heading font-bold uppercase tracking-wide text-xs text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brutal-border">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-brutal-border/5 transition-colors">
                      <td className="p-4 font-bold">
                        <Link href={`/courses/${course.id}` as Route} className="hover:underline hover:text-brutal-orange transition-colors">
                          {course.name}
                        </Link>
                      </td>
                      <td className="p-4 font-numeric">{course.sks}</td>
                      <td className="p-4 font-numeric font-bold">{course.targetGrade}</td>
                      <td className="p-4 font-numeric text-right">{course.analytics.cumulativeActual.toFixed(2)}%</td>
                      <td className="p-4 font-numeric text-right">
                        {course.analytics.requiredScore !== null 
                          ? `${course.analytics.requiredScore.toFixed(2)}%` 
                          : "N/A"}
                      </td>
                      <td className="p-4 text-center">
                        <Badge level={course.analytics.alertLevel}>
                          {course.analytics.alertLevel}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile View: Vertical Card Stack */}
          <div className="flex flex-col space-y-4 md:hidden">
            {courses.map((course) => (
              <Card key={course.id} className="p-0 overflow-hidden group">
                <Link href={`/courses/${course.id}` as Route} className="block p-5 active:bg-brutal-border/5 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-heading font-bold text-lg leading-tight group-hover:text-brutal-orange transition-colors">{course.name}</h3>
                      <div className="text-sm text-brutal-text-secondary mt-1 flex items-center gap-2">
                        <span>{course.sks} SKS</span>
                        <span className="text-brutal-text-muted">•</span>
                        <span>Target: <span className="font-bold font-numeric">{course.targetGrade}</span></span>
                      </div>
                    </div>
                    <Badge level={course.analytics.alertLevel}>
                      {course.analytics.alertLevel}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-brutal-border">
                    <div>
                      <div className="text-xs text-brutal-text-muted uppercase font-heading tracking-wide mb-1">Cumulative</div>
                      <div className="font-numeric font-bold text-lg">{course.analytics.cumulativeActual.toFixed(2)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-brutal-text-muted uppercase font-heading tracking-wide mb-1">Required</div>
                      <div className="font-numeric font-bold text-lg">
                        {course.analytics.requiredScore !== null 
                          ? `${course.analytics.requiredScore.toFixed(2)}%` 
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
