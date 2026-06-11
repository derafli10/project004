"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Component } from "@prisma/client";
import { updateComponentScore } from "@/lib/actions/component";
import { calculateCourseAnalytics, CourseAnalytics } from "@/lib/analytics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ComponentMatrixProps {
  courseId: string;
  targetThreshold: number;
  initialComponents: Component[];
  initialAnalytics: CourseAnalytics;
}

export function ComponentMatrix({
  courseId,
  targetThreshold,
  initialComponents,
  initialAnalytics,
}: ComponentMatrixProps) {
  const [components, setComponents] = useState<Component[]>(initialComponents);
  const [analytics, setAnalytics] = useState<CourseAnalytics>(initialAnalytics);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Track updating state for individual components
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  
  // Debounce timers
  const debounceTimers = useRef<{ [componentId: string]: NodeJS.Timeout }>({});

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleScoreChange = (componentId: string, value: string) => {
    // Determine new score: empty string means null, otherwise parse float and convert to integer representation (x 100)
    let newAchievedScore: number | null = null;
    if (value.trim() !== "") {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        // Enforce 0-100 constraint before converting to integer
        const clamped = Math.max(0, Math.min(100, parsed));
        newAchievedScore = Math.round(clamped * 100);
      }
    }

    // Optimistically update the UI components list
    const updatedComponents = components.map((c) =>
      c.id === componentId ? { ...c, achievedScore: newAchievedScore } : c
    );
    setComponents(updatedComponents);

    // Requirement 13.3: Recalculate analytics in real-time (instant/200ms)
    const newAnalytics = calculateCourseAnalytics(updatedComponents, targetThreshold);
    setAnalytics(newAnalytics);

    // Requirement 13.2: Debounce score updates (300ms) before calling updateComponentScore
    if (debounceTimers.current[componentId]) {
      clearTimeout(debounceTimers.current[componentId]);
    }

    // Set updating status
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.add(componentId);
      return next;
    });

    debounceTimers.current[componentId] = setTimeout(async () => {
      try {
        const result = await updateComponentScore({
          componentId,
          achievedScore: newAchievedScore,
        });

        if (result.success) {
          // Reconcile if needed, but optimistic update is already done
          // We can remove the updating status
        } else {
          // Revert optimistic update on failure
          setComponents(components); // revert to previous state
          setAnalytics(calculateCourseAnalytics(components, targetThreshold));
          showToast("error", result.error || "Failed to update score");
        }
      } catch (err) {
        setComponents(components);
        setAnalytics(calculateCourseAnalytics(components, targetThreshold));
        showToast("error", "An unexpected error occurred");
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(componentId);
          return next;
        });
      }
    }, 300);
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <Card className="p-0 overflow-hidden">
      {toast && (
        <div className={`m-4 p-4 border-brutal flex items-start gap-3 ${
          toast.type === "error" 
            ? "bg-brutal-orange/10 border-brutal-orange text-brutal-orange" 
            : "bg-brutal-success/10 border-brutal-success text-brutal-success"
        }`}>
          {toast.type === "error" ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <p className="font-bold">{toast.message}</p>
        </div>
      )}

      <div className="overflow-x-auto border-b-brutal border-brutal-border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-brutal border-brutal-border bg-brutal-border/5">
              <th className="p-4 font-heading font-bold uppercase tracking-wide text-xs">Component Name</th>
              <th className="p-4 font-heading font-bold uppercase tracking-wide text-xs text-right">Weight</th>
              <th className="p-4 font-heading font-bold uppercase tracking-wide text-xs text-center">Achieved Score</th>
              <th className="p-4 font-heading font-bold uppercase tracking-wide text-xs text-right">Contribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brutal-border">
            {components.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-brutal-text-secondary">
                  No components added yet.
                </td>
              </tr>
            ) : (
              components.map((comp) => {
                const weightDisplay = (comp.weight / 100).toFixed(2);
                
                // Controlled input value
                const inputValue = comp.achievedScore !== null 
                  ? (comp.achievedScore / 100).toString() 
                  : "";

                // Contribution = weight * score
                const contribution = comp.achievedScore !== null
                  ? ((comp.achievedScore * comp.weight) / 1000000).toFixed(2)
                  : "0.00";

                const isUpdating = updatingIds.has(comp.id);

                return (
                  <tr key={comp.id} className="hover:bg-brutal-border/5 transition-colors">
                    <td className="p-4 font-bold">{comp.name}</td>
                    <td className="p-4 font-numeric text-right">{weightDisplay}%</td>
                    <td className="p-4 text-center">
                      <div className="relative inline-block w-24">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={inputValue}
                          onChange={(e) => handleScoreChange(comp.id, e.target.value)}
                          placeholder="--"
                          className={`w-full border-brutal border-brutal-border bg-brutal-black px-3 py-1 text-center font-numeric font-bold focus:outline-none focus:ring-2 focus:ring-brutal-orange transition-all ${
                            isUpdating ? "opacity-50 border-dashed" : ""
                          }`}
                        />
                      </div>
                    </td>
                    <td className="p-4 font-numeric text-right">{contribution}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Summary Row */}
      <div className="bg-brutal-black p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-xs text-brutal-text-muted uppercase font-heading tracking-wide mb-1">Cumulative Actual</div>
          <div className="font-numeric font-bold text-3xl">{analytics.cumulativeActual.toFixed(2)}%</div>
        </div>
        
        <div>
          <div className="text-xs text-brutal-text-muted uppercase font-heading tracking-wide mb-1">Required Score</div>
          <div className="font-numeric font-bold text-3xl">
            {analytics.requiredScore !== null 
              ? `${analytics.requiredScore.toFixed(2)}%` 
              : "N/A"}
          </div>
        </div>

        <div className="flex flex-col justify-center items-start md:items-end">
          <div className="text-xs text-brutal-text-muted uppercase font-heading tracking-wide mb-1">Alert Level</div>
          <Badge level={analytics.alertLevel} className="text-lg py-1 px-3">
            {analytics.alertLevel}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
