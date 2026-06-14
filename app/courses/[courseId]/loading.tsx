import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Loader } from "lucide-react";

export default function CourseDetailLoading(): React.JSX.Element {
  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        {/* Back Button Skeleton */}
        <div className="mb-2 animate-pulse">
          <div className="h-6 w-40 bg-brutal-black border-brutal border-brutal-border"></div>
        </div>

        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 animate-pulse">
          <div>
            <div className="h-12 w-80 bg-brutal-black border-brutal border-brutal-border mb-4"></div>
            <div className="flex gap-4">
              <div className="h-8 w-24 bg-brutal-black border-brutal border-brutal-border"></div>
              <div className="h-8 w-40 bg-brutal-black border-brutal border-brutal-border"></div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-11 w-48 bg-brutal-black border-brutal border-brutal-border"></div>
            <div className="h-11 w-36 bg-brutal-black border-brutal border-brutal-border"></div>
            <div className="h-11 w-40 bg-brutal-black border-brutal border-brutal-border"></div>
          </div>
        </div>

        {/* Loading Spinner Area */}
        <div className="flex flex-col items-center justify-center py-16 bg-brutal-black border-brutal border-brutal-border shadow-[4px_4px_0px_0px_rgba(226,232,240,1)]">
          <Loader size={48} strokeWidth={2.5} className="text-brutal-orange animate-spin mb-6"  aria-hidden="true" />
          <h2 className="text-xl font-heading font-bold uppercase text-brutal-text-secondary tracking-widest animate-pulse">
            Loading Course Data...
          </h2>
        </div>
      </div>
    </PageContainer>
  );
}
