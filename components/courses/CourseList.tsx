import React from "react";
import Link from "next/link";
import type { Route } from "next";
import { getCourses } from "@/lib/actions/course";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

interface CourseListProps {
  page?: number;
}

export async function CourseList({ page = 1 }: CourseListProps) {
  const result = await getCourses(page, 50);
  
  if (!result.success) {
    return (
      <Card className="p-8 text-center border-brutal-red bg-brutal-red/10">
        <h3 className="text-xl font-bold text-brutal-red mb-2">Error loading courses</h3>
        <p>{result.error}</p>
      </Card>
    );
  }

  const { courses, totalCount, hasMore } = result.data;

  if (courses.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
        <BookOpen size={48} strokeWidth={1.5} className="text-brutal-text-muted mb-4" aria-hidden="true" />
        <h3 className="text-xl font-heading font-bold mb-2">No courses found</h3>
        <p className="text-brutal-text-secondary max-w-md mb-6">
          {page > 1 ? "No courses on this page." : "You haven't added any courses yet. Create your first course to start optimizing your grades."}
        </p>
        {page === 1 && (
          <Link href={"/courses/new" as Route}>
            <Button variant="secondary">Add Your First Course</Button>
          </Link>
        )}
      </Card>
    );
  }

  return (
    <>
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

      {(page > 1 || hasMore) && (
        <div className="flex justify-between items-center mt-6">
          <Link href={page > 1 ? (`/dashboard?page=${page - 1}` as Route) : "#"} passHref legacyBehavior>
            <Button variant="secondary" disabled={page <= 1} className="flex items-center gap-2">
              <ChevronLeft size={16} aria-hidden="true" />
              Previous
            </Button>
          </Link>
          <span className="font-numeric text-brutal-text-secondary text-sm">
            Showing {((page - 1) * 50) + 1}-{Math.min(page * 50, totalCount)} of {totalCount}
          </span>
          <Link href={hasMore ? (`/dashboard?page=${page + 1}` as Route) : "#"} passHref legacyBehavior>
            <Button variant="secondary" disabled={!hasMore} className="flex items-center gap-2">
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}
