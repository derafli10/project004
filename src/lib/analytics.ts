/**
 * Analytics Calculation Engine
 * 
 * This module provides pure functions for calculating academic performance metrics
 * using integer-based precision mathematics to avoid floating-point errors.
 * 
 * All weights and scores are stored as integers (0-10000 representing 0.00%-100.00%).
 * Calculations are performed in integer space and converted to decimals only for display.
 * 
 * @module analytics
 */

import { AlertLevel } from "@prisma/client";

/**
 * Unified course analytics result containing all calculated metrics.
 * 
 * This interface represents the complete analytics state for a course,
 * calculated in a single pass through the components array for optimal performance.
 */
export interface CourseAnalytics {
  /** Cumulative actual score from completed components (decimal 0.00-100.00+) */
  cumulativeActual: number;
  
  /** Required score on remaining components to achieve target (decimal, can be negative or >100), null if no remaining components */
  requiredScore: number | null;
  
  /** Sum of weights for incomplete components (decimal 0.00-100.00) */
  remainingWeight: number;
  
  /** Risk classification based on required score (NORMAL, WARNING, DANGER) */
  alertLevel: AlertLevel;
  
  /** Whether the target grade is mathematically achievable (requiredScore <= 100 or null) */
  isTargetAchievable: boolean;
}

/**
 * Calculate cumulative actual score for a course.
 * 
 * The cumulative actual score represents the sum of weighted scores for all 
 * completed components (those with non-null achieved scores).
 * 
 * Formula: CumulativeActual = Σ(achievedScore_i × weight_i / 10000) for all non-null scores
 * 
 * This function uses integer arithmetic throughout to avoid floating-point precision
 * errors. The calculation is performed as follows:
 * 1. For each component with non-null achievedScore, multiply achievedScore × weight
 * 2. Sum all weighted scores in integer space
 * 3. Divide the sum by 10000 to get the final weighted percentage
 * 4. Convert to decimal (divide by 100) and round to 2 decimal places
 * 
 * @param components - Array of components with integer weight (0-10000) and 
 *                     nullable integer achievedScore (0-10000)
 * @returns Decimal cumulative score (0.00 - 100.00+), rounded to 2 decimal places.
 *          Returns 0.00 when all achievedScore values are null.
 * 
 * @example
 * ```typescript
 * // Example: 3 components with mixed completion status
 * const components = [
 *   { weight: 3000, achievedScore: 8500 },  // 30% weight, 85% achieved
 *   { weight: 3000, achievedScore: 9000 },  // 30% weight, 90% achieved
 *   { weight: 4000, achievedScore: null }   // 40% weight, not yet graded
 * ];
 * 
 * const result = calculateCumulativeActual(components);
 * // Calculation: (8500 * 3000 + 9000 * 3000) / 10000 = 52500000 / 10000 = 5250
 * // Convert to decimal: 5250 / 100 = 52.50
 * console.log(result); // 52.50
 * ```
 * 
 * @example
 * ```typescript
 * // Example: All scores are null (no components graded yet)
 * const components = [
 *   { weight: 5000, achievedScore: null },
 *   { weight: 5000, achievedScore: null }
 * ];
 * 
 * const result = calculateCumulativeActual(components);
 * console.log(result); // 0.00
 * ```
 * 
 * @example
 * ```typescript
 * // Example: All components completed
 * const components = [
 *   { weight: 2000, achievedScore: 8000 },  // 20% weight, 80% achieved
 *   { weight: 3000, achievedScore: 8500 },  // 30% weight, 85% achieved
 *   { weight: 5000, achievedScore: 9000 }   // 50% weight, 90% achieved
 * ];
 * 
 * const result = calculateCumulativeActual(components);
 * // Calculation: (8000*2000 + 8500*3000 + 9000*5000) / 10000 = 86500000 / 10000 = 8650
 * // Convert to decimal: 8650 / 100 = 86.50
 * console.log(result); // 86.50
 * ```
 */
export function calculateCumulativeActual(
  components: Array<{ weight: number; achievedScore: number | null }>
): number {
  // Sum weighted scores in integer space for components with non-null scores
  let sumWeightedScores = 0;
  
  for (const component of components) {
    if (component.achievedScore !== null) {
      // Integer arithmetic: achievedScore (0-10000) × weight (0-10000)
      sumWeightedScores += component.achievedScore * component.weight;
    }
  }
  
  // Divide by 10000 to get the percentage in integer format (0-10000)
  // Example: 52500000 / 10000 = 5250 (representing 52.50%)
  const cumulativeInteger = sumWeightedScores / 10000;
  
  // Convert to decimal by dividing by 100 and round to 2 decimal places
  const cumulativeDecimal = cumulativeInteger / 100;
  
  // Round to 2 decimal places to handle any floating-point residuals
  return Math.round(cumulativeDecimal * 100) / 100;
}

/**
 * Calculate the minimum required score on remaining components to achieve the target grade.
 * 
 * The required score represents the average score needed across all remaining (ungraded)
 * components to reach the target threshold. This calculation helps students understand
 * how well they need to perform on upcoming assessments.
 * 
 * Formula: RequiredScore = (TargetThreshold - CumulativeActual) / (RemainingWeight / 100)
 * where:
 * - TargetThreshold is the minimum score for target grade (integer 0-10000)
 * - CumulativeActual is the sum of weighted completed scores (decimal)
 * - RemainingWeight is the sum of weights for components with null achievedScore (integer)
 * 
 * This function uses integer arithmetic for weight calculations and performs the
 * final division in decimal space to produce the required score.
 * 
 * @param components - Array of components with integer weight (0-10000) and 
 *                     nullable integer achievedScore (0-10000)
 * @param targetThreshold - Integer target threshold (e.g., 8000 for 80.00% or grade "A")
 * @returns Decimal required score (can be negative, > 100, or any value), rounded to 
 *          2 decimal places. Returns null when remainingWeight equals 0 (all components graded).
 * 
 * @example
 * ```typescript
 * // Example 1: Student needs moderate score on remaining work
 * const components = [
 *   { weight: 3000, achievedScore: 8500 },  // 30% weight, 85% achieved
 *   { weight: 3000, achievedScore: null },  // 30% weight, not graded
 *   { weight: 4000, achievedScore: null }   // 40% weight, not graded
 * ];
 * 
 * const targetThreshold = 8000;  // Target grade "A" = 80.00%
 * const result = calculateRequiredScore(components, targetThreshold);
 * 
 * // Step 1: Calculate cumulative actual
 * // cumulativeActual = (8500 * 3000) / 10000 / 100 = 25.50
 * 
 * // Step 2: Calculate remaining weight
 * // remainingWeight = 3000 + 4000 = 7000 (70.00%)
 * 
 * // Step 3: Apply formula
 * // requiredScore = (8000 / 100 - 25.50) / (7000 / 100)
 * //               = (80.00 - 25.50) / 70.00
 * //               = 54.50 / 70.00
 * //               = 77.86 (rounded to 2 decimals)
 * 
 * console.log(result); // 77.86
 * ```
 * 
 * @example
 * ```typescript
 * // Example 2: All components completed (remainingWeight = 0)
 * const components = [
 *   { weight: 5000, achievedScore: 8500 },
 *   { weight: 5000, achievedScore: 9000 }
 * ];
 * 
 * const targetThreshold = 8000;
 * const result = calculateRequiredScore(components, targetThreshold);
 * 
 * console.log(result); // null (no remaining components)
 * ```
 * 
 * @example
 * ```typescript
 * // Example 3: Target already exceeded (negative required score)
 * const components = [
 *   { weight: 6000, achievedScore: 9500 },  // 60% weight, 95% achieved
 *   { weight: 4000, achievedScore: null }   // 40% weight, not graded
 * ];
 * 
 * const targetThreshold = 8000;  // Target grade "A" = 80.00%
 * const result = calculateRequiredScore(components, targetThreshold);
 * 
 * // Step 1: cumulativeActual = (9500 * 6000) / 10000 / 100 = 57.00
 * // Step 2: remainingWeight = 4000 (40.00%)
 * // Step 3: requiredScore = (80.00 - 57.00) / 40.00 = 23.00 / 40.00 = 57.50
 * 
 * console.log(result); // 57.50 (can score low and still hit target)
 * ```
 * 
 * @example
 * ```typescript
 * // Example 4: Target no longer achievable (requiredScore > 100)
 * const components = [
 *   { weight: 5000, achievedScore: 5000 },  // 50% weight, 50% achieved
 *   { weight: 5000, achievedScore: null }   // 50% weight, not graded
 * ];
 * 
 * const targetThreshold = 8000;  // Target grade "A" = 80.00%
 * const result = calculateRequiredScore(components, targetThreshold);
 * 
 * // Step 1: cumulativeActual = (5000 * 5000) / 10000 / 100 = 25.00
 * // Step 2: remainingWeight = 5000 (50.00%)
 * // Step 3: requiredScore = (80.00 - 25.00) / 50.00 = 55.00 / 50.00 = 110.00
 * 
 * console.log(result); // 110.00 (impossible to achieve target)
 * ```
 * 
 * @example
 * ```typescript
 * // Example 5: Target already exceeded, negative required score
 * const components = [
 *   { weight: 7000, achievedScore: 9000 },  // 70% weight, 90% achieved
 *   { weight: 3000, achievedScore: null }   // 30% weight, not graded
 * ];
 * 
 * const targetThreshold = 8000;  // Target grade "A" = 80.00%
 * const result = calculateRequiredScore(components, targetThreshold);
 * 
 * // Step 1: cumulativeActual = (9000 * 7000) / 10000 / 100 = 63.00
 * // Step 2: remainingWeight = 3000 (30.00%)
 * // Step 3: requiredScore = (80.00 - 63.00) / 30.00 = 17.00 / 30.00 = 56.67
 * 
 * console.log(result); // 56.67
 * ```
 */
export function calculateRequiredScore(
  components: Array<{ weight: number; achievedScore: number | null }>,
  targetThreshold: number
): number | null {
  // Step 1: Calculate remaining weight (sum of weights for components with null scores)
  let remainingWeight = 0;
  
  for (const component of components) {
    if (component.achievedScore === null) {
      remainingWeight += component.weight;
    }
  }
  
  // Step 2: Return null if no remaining components (avoid division by zero)
  if (remainingWeight === 0) {
    return null;
  }
  
  // Step 3: Calculate cumulative actual using the existing function
  const cumulativeActual = calculateCumulativeActual(components);
  
  // Step 4: Convert targetThreshold from integer to decimal (divide by 100)
  const targetThresholdDecimal = targetThreshold / 100;
  
  // Step 5: Apply the formula from Requirement 5.1
  // RequiredScore = (Target_Threshold - Cumulative_Actual) / (Remaining_Weight / 100)
  // Where:
  // - Target_Threshold is in decimal percentage (e.g., 80.00 for 80%)
  // - Cumulative_Actual is in decimal percentage (e.g., 25.50 for 25.5%)
  // - Remaining_Weight / 100 converts percentage to fraction
  //   Example: remainingWeight=7000 (70%) -> 7000/10000 = 0.70 (fraction)
  // Formula: (80.00 - 25.50) / 0.70 = 54.50 / 0.70 = 77.86
  const remainingWeightFraction = remainingWeight / 10000;
  const requiredScore = (targetThresholdDecimal - cumulativeActual) / remainingWeightFraction;
  
  // Step 6: Round to 2 decimal places
  return Math.round(requiredScore * 100) / 100;
}

/**
 * Calculate the alert level based on the required score for remaining components.
 * 
 * The alert level classifies the feasibility of achieving the target grade into
 * three categories: NORMAL (achievable with reasonable effort), WARNING (requires
 * excellent performance), and DANGER (mathematically impossible or extremely difficult).
 * 
 * Classification Rules (per Requirements 6.1-6.4):
 * - DANGER: requiredScore > 100.00 (impossible to achieve, scores capped at 100)
 * - WARNING: 90.00 <= requiredScore <= 100.00 (requires near-perfect performance)
 * - NORMAL: requiredScore < 90.00, null, or negative (achievable or already achieved)
 * 
 * @param requiredScore - Decimal required score calculated by calculateRequiredScore,
 *                        or null if no remaining components exist. Can be negative
 *                        (target already exceeded), positive (work still needed), or
 *                        greater than 100 (target unachievable).
 * @returns AlertLevel enum value (NORMAL, WARNING, or DANGER)
 * 
 * @example
 * ```typescript
 * // Example 1: DANGER - Target impossible to achieve
 * const requiredScore = 110.00;
 * const alertLevel = calculateAlertLevel(requiredScore);
 * console.log(alertLevel); // "DANGER"
 * ```
 * 
 * @example
 * ```typescript
 * // Example 2: WARNING - Requires excellent performance (exactly 90.00)
 * const requiredScore = 90.00;
 * const alertLevel = calculateAlertLevel(requiredScore);
 * console.log(alertLevel); // "WARNING"
 * ```
 * 
 * @example
 * ```typescript
 * // Example 3: WARNING - Requires near-perfect performance (100.00)
 * const requiredScore = 100.00;
 * const alertLevel = calculateAlertLevel(requiredScore);
 * console.log(alertLevel); // "WARNING"
 * ```
 * 
 * @example
 * ```typescript
 * // Example 4: NORMAL - Achievable with reasonable effort
 * const requiredScore = 77.86;
 * const alertLevel = calculateAlertLevel(requiredScore);
 * console.log(alertLevel); // "NORMAL"
 * ```
 * 
 * @example
 * ```typescript
 * // Example 5: NORMAL - All components completed
 * const requiredScore = null;
 * const alertLevel = calculateAlertLevel(requiredScore);
 * console.log(alertLevel); // "NORMAL"
 * ```
 * 
 * @example
 * ```typescript
 * // Example 6: NORMAL - Target already exceeded (negative required score)
 * const requiredScore = -10.50;
 * const alertLevel = calculateAlertLevel(requiredScore);
 * console.log(alertLevel); // "NORMAL"
 * ```
 * 
 * @example
 * ```typescript
 * // Example 7: DANGER - Boundary case just above 100
 * const requiredScore = 100.01;
 * const alertLevel = calculateAlertLevel(requiredScore);
 * console.log(alertLevel); // "DANGER"
 * ```
 * 
 * @example
 * ```typescript
 * // Example 8: NORMAL - Boundary case just below 90
 * const requiredScore = 89.99;
 * const alertLevel = calculateAlertLevel(requiredScore);
 * console.log(alertLevel); // "NORMAL"
 * ```
 */
export function calculateAlertLevel(
  requiredScore: number | null
): AlertLevel {
  // Handle null case (no remaining components) - return NORMAL
  if (requiredScore === null) {
    return AlertLevel.NORMAL;
  }
  
  // Handle negative case (target already exceeded) - return NORMAL
  if (requiredScore < 0) {
    return AlertLevel.NORMAL;
  }
  
  // DANGER: requiredScore > 100.00 (impossible to achieve)
  if (requiredScore > 100.00) {
    return AlertLevel.DANGER;
  }
  
  // WARNING: 90.00 <= requiredScore <= 100.00 (requires excellent performance)
  if (requiredScore >= 90.00 && requiredScore <= 100.00) {
    return AlertLevel.WARNING;
  }
  
  // NORMAL: requiredScore < 90.00 (achievable with reasonable effort)
  return AlertLevel.NORMAL;
}

/**
 * Calculate all course analytics in a single optimized pass.
 * 
 * This function performs single-pass optimization by calculating all metrics
 * (cumulative actual, required score, remaining weight, alert level, and 
 * target achievability) in one iteration through the components array.
 * This is more efficient than calling individual functions separately,
 * especially for real-time dashboard updates (Requirement 19.1).
 * 
 * Performance requirement: Must complete within 200ms for up to 20 components.
 * 
 * The function uses integer arithmetic throughout for precision, following
 * Guardrail 1: Integer-Based Precision Mathematics.
 * 
 * Algorithm:
 * 1. Single pass through components to calculate:
 *    - Sum of weighted scores for completed components
 *    - Sum of weights for incomplete components (remainingWeight)
 * 2. Calculate cumulative actual from weighted scores
 * 3. Calculate required score from cumulative and remaining weight
 * 4. Determine alert level from required score
 * 5. Determine target achievability from required score
 * 
 * @param components - Array of components with integer weight (0-10000) and 
 *                     nullable integer achievedScore (0-10000)
 * @param targetThreshold - Integer target threshold (e.g., 8000 for 80.00% or grade "A")
 * @returns CourseAnalytics object containing all calculated metrics
 * 
 * @example
 * ```typescript
 * // Example 1: Typical course with mixed completion
 * const components = [
 *   { weight: 3000, achievedScore: 8500 },  // 30% weight, 85% achieved
 *   { weight: 3000, achievedScore: 9000 },  // 30% weight, 90% achieved
 *   { weight: 4000, achievedScore: null }   // 40% weight, not graded
 * ];
 * 
 * const analytics = calculateCourseAnalytics(components, 8000);
 * console.log(analytics);
 * // {
 * //   cumulativeActual: 52.50,
 * //   requiredScore: 68.75,
 * //   remainingWeight: 40.00,
 * //   alertLevel: 'NORMAL',
 * //   isTargetAchievable: true
 * // }
 * ```
 * 
 * @example
 * ```typescript
 * // Example 2: All components completed
 * const components = [
 *   { weight: 5000, achievedScore: 8500 },
 *   { weight: 5000, achievedScore: 9000 }
 * ];
 * 
 * const analytics = calculateCourseAnalytics(components, 8000);
 * console.log(analytics);
 * // {
 * //   cumulativeActual: 87.50,
 * //   requiredScore: null,
 * //   remainingWeight: 0.00,
 * //   alertLevel: 'NORMAL',
 * //   isTargetAchievable: true
 * // }
 * ```
 * 
 * @example
 * ```typescript
 * // Example 3: Target no longer achievable
 * const components = [
 *   { weight: 5000, achievedScore: 5000 },  // 50% weight, 50% achieved
 *   { weight: 5000, achievedScore: null }   // 50% weight, not graded
 * ];
 * 
 * const analytics = calculateCourseAnalytics(components, 8000);
 * console.log(analytics);
 * // {
 * //   cumulativeActual: 25.00,
 * //   requiredScore: 110.00,
 * //   remainingWeight: 50.00,
 * //   alertLevel: 'DANGER',
 * //   isTargetAchievable: false
 * // }
 * ```
 * 
 * @example
 * ```typescript
 * // Example 4: Requires excellent performance (WARNING level)
 * const components = [
 *   { weight: 5000, achievedScore: 7000 },  // 50% weight, 70% achieved
 *   { weight: 5000, achievedScore: null }   // 50% weight, not graded
 * ];
 * 
 * const analytics = calculateCourseAnalytics(components, 8000);
 * console.log(analytics);
 * // {
 * //   cumulativeActual: 35.00,
 * //   requiredScore: 90.00,
 * //   remainingWeight: 50.00,
 * //   alertLevel: 'WARNING',
 * //   isTargetAchievable: true
 * // }
 * ```
 * 
 * @example
 * ```typescript
 * // Example 5: Target already exceeded
 * const components = [
 *   { weight: 7000, achievedScore: 9000 },  // 70% weight, 90% achieved
 *   { weight: 3000, achievedScore: null }   // 30% weight, not graded
 * ];
 * 
 * const analytics = calculateCourseAnalytics(components, 8000);
 * console.log(analytics);
 * // {
 * //   cumulativeActual: 63.00,
 * //   requiredScore: 56.67,
 * //   remainingWeight: 30.00,
 * //   alertLevel: 'NORMAL',
 * //   isTargetAchievable: true
 * // }
 * ```
 */
export function calculateCourseAnalytics(
  components: Array<{ weight: number; achievedScore: number | null }>,
  targetThreshold: number
): CourseAnalytics {
  // Step 1: Single pass through components to calculate both metrics
  let sumWeightedScores = 0;
  let remainingWeightInteger = 0;
  
  for (const component of components) {
    if (component.achievedScore !== null) {
      // Component is completed - add to weighted score sum
      // Integer arithmetic: achievedScore (0-10000) × weight (0-10000)
      sumWeightedScores += component.achievedScore * component.weight;
    } else {
      // Component is incomplete - add to remaining weight
      remainingWeightInteger += component.weight;
    }
  }
  
  // Step 2: Calculate cumulative actual
  // Divide by 10000 to get the percentage in integer format (0-10000)
  const cumulativeInteger = sumWeightedScores / 10000;
  // Convert to decimal by dividing by 100 and round to 2 decimal places
  const cumulativeDecimal = cumulativeInteger / 100;
  const cumulativeActual = Math.round(cumulativeDecimal * 100) / 100;
  
  // Step 3: Convert remaining weight to decimal and round to 2 decimal places
  const remainingWeightDecimal = remainingWeightInteger / 100;
  const remainingWeight = Math.round(remainingWeightDecimal * 100) / 100;
  
  // Step 4: Calculate required score
  let requiredScore: number | null = null;
  
  if (remainingWeightInteger > 0) {
    // Convert targetThreshold from integer to decimal
    const targetThresholdDecimal = targetThreshold / 100;
    
    // Apply the formula: RequiredScore = (Target - Cumulative) / (RemainingWeight / 100)
    const remainingWeightFraction = remainingWeightInteger / 10000;
    requiredScore = (targetThresholdDecimal - cumulativeActual) / remainingWeightFraction;
    
    // Round to 2 decimal places
    requiredScore = Math.round(requiredScore * 100) / 100;
  }
  
  // Step 5: Calculate alert level based on required score
  let alertLevel: AlertLevel;
  
  if (requiredScore === null || requiredScore < 0) {
    alertLevel = AlertLevel.NORMAL;
  } else if (requiredScore > 100.00) {
    alertLevel = AlertLevel.DANGER;
  } else if (requiredScore >= 90.00) {
    alertLevel = AlertLevel.WARNING;
  } else {
    alertLevel = AlertLevel.NORMAL;
  }
  
  // Step 6: Determine target achievability
  const isTargetAchievable = requiredScore === null || requiredScore <= 100.00;
  
  return {
    cumulativeActual,
    requiredScore,
    remainingWeight,
    alertLevel,
    isTargetAchievable
  };
}
