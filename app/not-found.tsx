import React from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, SearchX } from "lucide-react";
import type { Route } from "next";

export default function NotFound(): React.JSX.Element {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-brutal-black border-brutal border-brutal-border flex items-center justify-center mb-8 shadow-[8px_8px_0px_0px_rgba(226,232,240,1)]">
          <SearchX size={48} className="text-brutal-text-secondary" strokeWidth={2.5}  aria-hidden="true" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase text-brutal-text mb-4 tracking-tight">
          Course Not Found
        </h1>
        
        <p className="text-brutal-text-secondary text-lg mb-8 font-body max-w-md">
          The requested resource could not be located. It may have been deleted or the URL might be incorrect.
        </p>

        <Link href={"/dashboard" as Route}>
          <Button 
            className="flex items-center gap-2 px-8 py-4 text-lg bg-brutal-border text-brutal-black hover:bg-brutal-text shadow-[4px_4px_0px_0px_rgba(255,69,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(255,69,0,1)]"
          >
            <ArrowLeft size={20} strokeWidth={2.5}  aria-hidden="true" />
            <span>Back to Dashboard</span>
          </Button>
        </Link>
      </div>
    </PageContainer>
  );
}
