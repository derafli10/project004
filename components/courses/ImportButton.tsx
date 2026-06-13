"use client";

import React, { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { importData } from "@/lib/actions/import";
import { useRouter } from "next/navigation";

export function ImportButton() {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = await importData(text);
      
      if (result.success) {
        alert(`Successfully imported ${result.data?.length || 0} courses!`);
        router.refresh();
      } else {
        console.error("Import failed:", result.error);
        alert(`Failed to import data: ${result.error}`);
      }
    } catch (error) {
      console.error("Import exception:", error);
      alert("An unexpected error occurred during import.");
    } finally {
      setIsImporting(false);
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input 
        type="file" 
        accept=".json,application/json" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
      <Button 
        variant="secondary" 
        onClick={handleImportClick}
        disabled={isImporting}
        className="flex items-center gap-2 bg-brutal-black"
      >
        {isImporting ? (
          <Loader2 size={20} strokeWidth={2.5} className="animate-spin text-brutal-text-muted" />
        ) : (
          <Upload size={20} strokeWidth={2.5} />
        )}
        <span>{isImporting ? "Importing..." : "Import Data"}</span>
      </Button>
    </>
  );
}
