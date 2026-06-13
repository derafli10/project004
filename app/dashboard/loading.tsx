import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Loader } from "lucide-react";

export default function DashboardLoading(): React.JSX.Element {
  return (
    <PageContainer>
      <div className="flex flex-col gap-8 min-h-[50vh]">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-brutal border-brutal-border pb-6 animate-pulse">
          <div>
            <div className="h-10 w-64 bg-brutal-black border-brutal border-brutal-border mb-2"></div>
            <div className="h-6 w-48 bg-brutal-black border-brutal border-brutal-border"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-11 w-32 bg-brutal-black border-brutal border-brutal-border"></div>
            <div className="h-11 w-40 bg-brutal-black border-brutal border-brutal-border"></div>
          </div>
        </div>

        {/* Loading Spinner Area */}
        <div className="flex flex-col items-center justify-center py-12 flex-grow">
          <Loader size={48} strokeWidth={2.5} className="text-brutal-orange animate-spin mb-4" />
          <h2 className="text-xl font-heading font-bold uppercase text-brutal-text-secondary tracking-widest animate-pulse">
            Loading Dashboard Data...
          </h2>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-brutal-black border-brutal border-brutal-border p-5 flex flex-col justify-between">
              <div>
                <div className="h-8 w-3/4 bg-brutal-border/20 mb-4"></div>
                <div className="h-4 w-1/2 bg-brutal-border/10 mb-2"></div>
                <div className="h-4 w-1/3 bg-brutal-border/10"></div>
              </div>
              <div className="flex justify-between items-center mt-6 pt-4 border-t-brutal border-brutal-border/30">
                <div className="h-6 w-1/4 bg-brutal-border/20"></div>
                <div className="h-6 w-1/4 bg-brutal-border/20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
