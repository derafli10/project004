"use client";

import React, { useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { AlertOctagon, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application Error:", error);
  }, [error]);

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-brutal-orange/10 border-brutal border-brutal-orange flex items-center justify-center mb-8 shadow-[8px_8px_0px_0px_rgba(255,69,0,1)]">
          <AlertOctagon size={48} className="text-brutal-orange" strokeWidth={2.5} />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase text-brutal-orange mb-4 tracking-tight">
          System Failure
        </h1>
        
        <p className="text-brutal-text-secondary text-lg mb-8 font-body">
          An unexpected error occurred in the application. The system has logged the incident and our engineers have been notified.
        </p>

        <div className="bg-brutal-black border-brutal border-brutal-border p-4 mb-8 w-full text-left overflow-auto max-h-48">
          <p className="font-numeric text-brutal-text text-sm text-red-400 font-bold mb-2 uppercase border-b-brutal border-brutal-border pb-2">Error Details</p>
          <code className="font-numeric text-sm text-brutal-text-muted break-all">
            {error.message || "Unknown Error"}
          </code>
        </div>

        <Button 
          onClick={() => reset()}
          className="flex items-center gap-2 px-8 py-4 text-lg bg-brutal-orange text-brutal-black hover:bg-brutal-orange/90 shadow-[4px_4px_0px_0px_rgba(250,250,250,1)] hover:shadow-[6px_6px_0px_0px_rgba(250,250,250,1)]"
        >
          <RefreshCw size={20} strokeWidth={2.5} />
          <span>Try Again</span>
        </Button>
      </div>
    </PageContainer>
  );
}
