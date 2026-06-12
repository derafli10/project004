"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { exportData } from "@/lib/actions/export";

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportData();
      
      if (result.success && result.data) {
        // Create a blob from the JSON string
        const blob = new Blob([result.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link element to trigger the download
        const a = document.createElement("a");
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        a.download = `grade-optimizer-export-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (!result.success) {
        console.error("Export failed:", result.error);
        alert(`Failed to export data: ${result.error}`);
      }
    } catch (error) {
      console.error("Export exception:", error);
      alert("An unexpected error occurred during export.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="secondary" 
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 bg-brutal-black"
    >
      {isExporting ? (
        <Loader2 size={20} strokeWidth={2.5} className="animate-spin text-brutal-text-muted" />
      ) : (
        <Download size={20} strokeWidth={2.5} />
      )}
      <span>{isExporting ? "Exporting..." : "Export Data"}</span>
    </Button>
  );
}
