"use client";

import React, { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { type Route } from "next";
import { saveComponents } from "@/lib/actions/component";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Plus, Trash2, Save, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Component } from "@prisma/client";

interface ComponentEditorProps {
  courseId: string;
  initialComponents: Component[];
}

interface ComponentRow {
  id: string; // Real UUID or temp ID
  name: string;
  weight: string; // string for input
  achievedScore: string; // string for input
  isNew?: boolean;
}

export function ComponentEditor({ courseId, initialComponents }: ComponentEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Map initial components to form row states (converting integer representations back to decimals/strings)
  const [rows, setRows] = useState<ComponentRow[]>(() => {
    if (initialComponents.length === 0) {
      // Default to one empty row if no components
      return [{ id: `temp_${Date.now()}`, name: "", weight: "", achievedScore: "", isNew: true }];
    }
    return initialComponents.map((c) => ({
      id: c.id,
      name: c.name,
      weight: (c.weight / 100).toString(),
      achievedScore: c.achievedScore !== null ? (c.achievedScore / 100).toString() : "",
    }));
  });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Calculate weight sum in integer representation to avoid floating point issues
  const calculateWeightSum = (): number => {
    return rows.reduce((sum, row) => {
      const parsed = parseFloat(row.weight);
      if (isNaN(parsed) || parsed < 0) return sum;
      return sum + Math.round(parsed * 100);
    }, 0);
  };

  const weightSum = calculateWeightSum();
  // Valid sum is within 99.90% to 100.10% (9990 to 10010)
  const isWeightSumValid = Math.abs(weightSum - 10000) <= 10;

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      { id: `temp_${Date.now()}_${Math.random()}`, name: "", weight: "", achievedScore: "", isNew: true },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setRows((prev) => {
      const filtered = prev.filter((row) => row.id !== id);
      if (filtered.length === 0) {
        return [{ id: `temp_${Date.now()}`, name: "", weight: "", achievedScore: "", isNew: true }];
      }
      return filtered;
    });
  };

  const handleFieldChange = (id: string, field: keyof ComponentRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Requirement 15.2: Weight auto-balancing helper
  const handleAutoBalance = () => {
    const count = rows.length;
    if (count === 0) return;

    // Distribute weights evenly: 10000 / count
    const baseWeight = Math.floor(10000 / count);
    const remainder = 10000 - baseWeight * count;

    setRows((prev) =>
      prev.map((row, index) => {
        // Distribute remainder adding 1 (0.01%) to the first 'remainder' components
        const adjustedIntWeight = baseWeight + (index < remainder ? 1 : 0);
        return {
          ...row,
          weight: (adjustedIntWeight / 100).toFixed(2),
        };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWeightSumValid) {
      showToast("error", "Cannot save: Total weight must equal exactly 100.00% (±0.10% tolerance)");
      return;
    }

    // Validate name and parse values
    const formattedComponents: { name: string; weight: number; achievedScore: number | null }[] = [];
    for (const row of rows) {
      const trimmedName = row.name.trim();
      if (!trimmedName) {
        showToast("error", "All components must have a name");
        return;
      }

      const parsedWeight = parseFloat(row.weight);
      if (isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight > 100) {
        showToast("error", `Invalid weight for component "${trimmedName}": must be between 0.01% and 100%`);
        return;
      }

      const weightInt = Math.round(parsedWeight * 100);

      let achievedScoreInt: number | null = null;
      if (row.achievedScore.trim() !== "") {
        const parsedScore = parseFloat(row.achievedScore);
        if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
          showToast("error", `Invalid score for component "${trimmedName}": must be between 0.00 and 100.00`);
          return;
        }
        achievedScoreInt = Math.round(parsedScore * 100);
      }

      formattedComponents.push({
        name: trimmedName,
        weight: weightInt,
        achievedScore: achievedScoreInt,
      });
    }

    startTransition(async () => {
      try {
        const result = await saveComponents(courseId, formattedComponents);

        if (result.success) {
          showToast("success", "Components saved successfully!");
          router.push(`/courses/${courseId}` as Route);
          router.refresh();
        } else {
          showToast("error", result.error || "Failed to save components");
        }
      } catch (error) {
        showToast("error", error instanceof Error ? error.message : "An unexpected error occurred");
      }
    });
  };

  return (
    <Card className={isPending ? "opacity-75 border-dashed" : ""}>
      <div className="flex justify-between items-center mb-6 border-b-brutal border-brutal-border pb-4 flex-wrap gap-4">
        <h2 className="text-2xl font-heading font-bold uppercase">Configure Components</h2>
        <Button
          type="button"
          variant="secondary"
          onClick={handleAutoBalance}
          disabled={isPending}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} strokeWidth={2.5} />
          <span>Auto-balance weights</span>
        </Button>
      </div>

      {toast && (
        <div
          className={`mb-6 p-4 border-brutal flex items-start gap-3 ${
            toast.type === "error"
              ? "bg-brutal-orange/10 border-brutal-orange text-brutal-orange"
              : "bg-brutal-success/10 border-brutal-success text-brutal-success"
          }`}
        >
          {toast.type === "error" ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <p className="font-bold">{toast.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="overflow-x-auto border border-brutal-border mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-brutal border-brutal-border bg-brutal-border/5">
                <th className="p-4 font-heading font-bold uppercase tracking-wide text-xs">Component Name</th>
                <th className="p-4 font-heading font-bold uppercase tracking-wide text-xs w-36">Weight (%)</th>
                <th className="p-4 font-heading font-bold uppercase tracking-wide text-xs w-40">Score (Optional)</th>
                <th className="p-4 font-heading font-bold uppercase tracking-wide text-xs w-20 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brutal-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-brutal-border/5 transition-colors">
                  <td className="p-4">
                    <Input
                      placeholder="e.g., Midterm Exam"
                      value={row.name}
                      onChange={(e) => handleFieldChange(row.id, "name", e.target.value)}
                      disabled={isPending}
                      required
                      className="w-full"
                    />
                  </td>
                  <td className="p-4">
                    <Input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      placeholder="e.g., 30"
                      value={row.weight}
                      onChange={(e) => handleFieldChange(row.id, "weight", e.target.value)}
                      disabled={isPending}
                      required
                      className="w-full text-right font-numeric font-bold"
                    />
                  </td>
                  <td className="p-4">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="--"
                      value={row.achievedScore}
                      onChange={(e) => handleFieldChange(row.id, "achievedScore", e.target.value)}
                      disabled={isPending}
                      className="w-full text-right font-numeric font-bold"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleRemoveRow(row.id)}
                      disabled={isPending}
                      className="text-brutal-orange border-brutal-orange hover:bg-brutal-orange hover:text-brutal-black p-2 min-w-[44px] min-h-[44px]"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brutal-black p-6 border border-brutal-border">
          <div>
            <div className="text-xs text-brutal-text-muted uppercase font-heading tracking-wide mb-1">
              Total Weight Sum
            </div>
            <div
              className={`font-numeric font-bold text-3xl transition-colors ${
                isWeightSumValid ? "text-brutal-success" : "text-brutal-orange"
              }`}
            >
              {(weightSum / 100).toFixed(2)}% <span className="text-lg text-brutal-text-muted">/ 100.00%</span>
            </div>
            {!isWeightSumValid && (
              <p className="text-xs text-brutal-orange mt-1 font-bold">
                Must sum to 100.00% (currently {(weightSum / 100).toFixed(2)}%)
              </p>
            )}
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddRow}
              disabled={isPending}
              className="flex items-center gap-2 flex-1 sm:flex-initial"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add Row</span>
            </Button>

            <Button
              type="submit"
              disabled={isPending || !isWeightSumValid}
              className="flex items-center gap-2 flex-1 sm:flex-initial"
            >
              <Save size={16} strokeWidth={2.5} />
              <span>{isPending ? "Saving..." : "Save Components"}</span>
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
