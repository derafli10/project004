/**
 * Zod Validation Schemas
 * 
 * This module defines runtime validation schemas for all user inputs and data structures.
 * All schemas enforce the Integer-Based Precision Mathematics guardrail and Production-Ready
 * Code Standards guardrail with strict type safety and comprehensive validation rules.
 * 
 * @module validations
 */

import { z } from "zod";

/**
 * Target Grade Enum Schema
 * 
 * Validates academic target grades according to IPB University grading system.
 * Maps to targetThreshold values:
 * - A: 8000 (80.00%)
 * - AB: 7500 (75.00%)
 * - B: 7000 (70.00%)
 * - BC: 6500 (65.00%)
 * - C: 6000 (60.00%)
 * - D: 5500 (55.00%)
 * - E: 0 (0.00% - failing grade)
 */
export const TargetGradeEnum = z.enum(["A", "AB", "B", "BC", "C", "D", "E"]);

/**
 * Course Schema
 * 
 * Validates course creation and update data.
 * Enforces requirements 1.5, 1.6, and 14.3.
 * 
 * @property name - Course name, 1-100 characters (e.g., "Database Systems")
 * @property sks - SKS credits, integer 1-6
 * @property targetGrade - Desired grade, one of A, AB, B, BC, C, D, E
 * 
 * @example
 * ```typescript
 * const courseData = {
 *   name: "Database Systems",
 *   sks: 3,
 *   targetGrade: "A"
 * };
 * const result = CourseSchema.safeParse(courseData);
 * if (result.success) {
 *   console.log("Valid course data:", result.data);
 * }
 * ```
 */
export const CourseSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Course name must be at least 1 character" })
    .max(100, { message: "Course name must not exceed 100 characters" })
    .trim(),
  sks: z
    .number()
    .int({ message: "SKS must be an integer" })
    .min(1, { message: "SKS must be at least 1" })
    .max(6, { message: "SKS must not exceed 6" }),
  targetGrade: TargetGradeEnum,
});

/**
 * Component Schema
 * 
 * Validates individual grading component data.
 * Enforces requirements 2.2, 3.2, and 14.5.
 * 
 * Uses integer storage format (0-10000) for weight and achievedScore:
 * - weight: 1-10000 representing 0.01% to 100.00%
 * - achievedScore: 0-10000 representing 0.00 to 100.00, nullable for incomplete components
 * 
 * @property name - Component name, 1-100 characters (e.g., "Midterm Exam")
 * @property weight - Component weight as integer (1-10000), multiply display value by 100
 * @property achievedScore - Achieved score as integer (0-10000) or null, multiply display value by 100
 * 
 * @example
 * ```typescript
 * const componentData = {
 *   name: "Midterm Exam",
 *   weight: 3000,      // 30.00%
 *   achievedScore: 8500 // 85.00
 * };
 * const result = ComponentSchema.safeParse(componentData);
 * ```
 */
export const ComponentSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Component name must be at least 1 character" })
    .max(100, { message: "Component name must not exceed 100 characters" })
    .trim(),
  weight: z
    .number()
    .int({ message: "Weight must be an integer" })
    .min(1, { message: "Weight must be at least 1 (0.01%)" })
    .max(10000, { message: "Weight must not exceed 10000 (100.00%)" }),
  achievedScore: z
    .number()
    .int({ message: "Achieved score must be an integer" })
    .min(0, { message: "Achieved score must be at least 0 (0.00)" })
    .max(10000, { message: "Achieved score must not exceed 10000 (100.00)" })
    .nullable(),
});

/**
 * Components Array Schema with Weight Sum Validation
 * 
 * Validates an array of components and enforces the critical weight sum invariant:
 * Component weights must sum to exactly 10000 (representing 100.00%) with ±10 tolerance (0.10%).
 * 
 * Enforces requirements 2.3, 2.5, 2.6, and 14.4.
 * 
 * The tolerance accounts for rounding scenarios when auto-balancing weights.
 * For example, distributing 100% across 3 components yields 33.33%, 33.33%, 33.34%
 * which converts to 3333, 3333, 3334 = 10000 (exact).
 * 
 * @example
 * ```typescript
 * const components = [
 *   { name: "Quiz", weight: 2000, achievedScore: 9000 },
 *   { name: "Midterm", weight: 3000, achievedScore: 8500 },
 *   { name: "Final", weight: 5000, achievedScore: null }
 * ];
 * const result = ComponentsArraySchema.safeParse(components);
 * // result.success === true (sum is 10000)
 * 
 * const invalidComponents = [
 *   { name: "Quiz", weight: 2000, achievedScore: 9000 },
 *   { name: "Midterm", weight: 3000, achievedScore: 8500 }
 * ];
 * const invalidResult = ComponentsArraySchema.safeParse(invalidComponents);
 * // invalidResult.success === false (sum is 5000, not within 9990-10010)
 * ```
 */
export const ComponentsArraySchema = z
  .array(ComponentSchema)
  .refine(
    (components) => {
      const sum = components.reduce((acc, component) => acc + component.weight, 0);
      return Math.abs(sum - 10000) <= 10;
    },
    {
      message:
        "Component weights must sum to 100.00% (10000 in integer format, ±10 tolerance for rounding)",
    }
  );

/**
 * Score Update Schema
 * 
 * Validates score update mutations for individual components.
 * Enforces requirements 3.2 and 14.5.
 * 
 * Used when updating a single component's achieved score without modifying
 * the entire component structure.
 * 
 * @property componentId - UUID of the component to update
 * @property achievedScore - New achieved score as integer (0-10000) or null to clear
 * 
 * @example
 * ```typescript
 * const scoreUpdate = {
 *   componentId: "550e8400-e29b-41d4-a716-446655440000",
 *   achievedScore: 8750 // 87.50
 * };
 * const result = ScoreUpdateSchema.safeParse(scoreUpdate);
 * 
 * // Clearing a score
 * const clearScore = {
 *   componentId: "550e8400-e29b-41d4-a716-446655440000",
 *   achievedScore: null
 * };
 * const clearResult = ScoreUpdateSchema.safeParse(clearScore);
 * ```
 */
export const ScoreUpdateSchema = z.object({
  componentId: z
    .string()
    .min(1, { message: "Component ID must be provided" }),
  achievedScore: z
    .number()
    .int({ message: "Achieved score must be an integer" })
    .min(0, { message: "Achieved score must be at least 0 (0.00)" })
    .max(10000, { message: "Achieved score must not exceed 10000 (100.00)" })
    .nullable(),
});

/**
 * Type exports for use in Server Actions and components
 */
export type CourseInput = z.infer<typeof CourseSchema>;
export type ComponentInput = z.infer<typeof ComponentSchema>;
export type ComponentsArrayInput = z.infer<typeof ComponentsArraySchema>;
export type ScoreUpdateInput = z.infer<typeof ScoreUpdateSchema>;
export type TargetGrade = z.infer<typeof TargetGradeEnum>;
