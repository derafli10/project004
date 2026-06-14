import React from "react";
import { Card } from "@/components/ui/Card";

export function CourseListSkeleton() {
  return (
    <div className="w-full animate-pulse">
      {/* Desktop View: Table Skeleton */}
      <div className="hidden md:block border-brutal border-brutal-border bg-brutal-black shadow-brutal overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-brutal border-brutal-border bg-brutal-border/5">
              <th className="p-4"><div className="h-4 bg-brutal-border/20 w-24"></div></th>
              <th className="p-4"><div className="h-4 bg-brutal-border/20 w-12"></div></th>
              <th className="p-4"><div className="h-4 bg-brutal-border/20 w-16"></div></th>
              <th className="p-4"><div className="h-4 bg-brutal-border/20 w-20 ml-auto"></div></th>
              <th className="p-4"><div className="h-4 bg-brutal-border/20 w-20 ml-auto"></div></th>
              <th className="p-4"><div className="h-4 bg-brutal-border/20 w-24 mx-auto"></div></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brutal-border">
            {[1, 2, 3].map((i) => (
              <tr key={i} className="hover:bg-brutal-border/5">
                <td className="p-4"><div className="h-5 bg-brutal-border/10 w-48"></div></td>
                <td className="p-4"><div className="h-5 bg-brutal-border/10 w-8"></div></td>
                <td className="p-4"><div className="h-5 bg-brutal-border/10 w-12"></div></td>
                <td className="p-4"><div className="h-5 bg-brutal-border/10 w-16 ml-auto"></div></td>
                <td className="p-4"><div className="h-5 bg-brutal-border/10 w-16 ml-auto"></div></td>
                <td className="p-4"><div className="h-6 bg-brutal-border/10 w-24 mx-auto rounded-full"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Vertical Card Stack Skeleton */}
      <div className="flex flex-col space-y-4 md:hidden">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="h-6 bg-brutal-border/10 w-40 mb-2"></div>
                <div className="h-4 bg-brutal-border/10 w-32"></div>
              </div>
              <div className="h-6 bg-brutal-border/10 w-20 rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-brutal-border">
              <div>
                <div className="h-3 bg-brutal-border/10 w-16 mb-2"></div>
                <div className="h-6 bg-brutal-border/10 w-16"></div>
              </div>
              <div>
                <div className="h-3 bg-brutal-border/10 w-16 mb-2"></div>
                <div className="h-6 bg-brutal-border/10 w-16"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
