/**
 * Integer-Decimal Conversion Utilities
 * 
 * These utilities handle conversion between display format (decimals) and 
 * storage format (integers) for the Integer-Based Precision Mathematics guardrail.
 * 
 * All decimal values (scores, weights, thresholds) are stored as integers in the 
 * database by multiplying by 100 to avoid JavaScript floating-point precision errors.
 * 
 * @module converters
 */

/**
 * Converts a decimal number to an integer for database storage.
 * Multiplies the decimal value by 100 to preserve two decimal places.
 * 
 * @param decimal - The decimal value to convert (e.g., 85.50)
 * @returns The integer representation (e.g., 8550)
 * 
 * @example
 * ```typescript
 * toInteger(85.50);  // Returns 8550
 * toInteger(20.00);  // Returns 2000
 * toInteger(100.00); // Returns 10000
 * toInteger(0.01);   // Returns 1
 * ```
 */
export function toInteger(decimal: number): number {
  return Math.round(decimal * 100);
}

/**
 * Converts an integer from database storage to a decimal for display.
 * Divides the integer value by 100 to restore the original decimal format.
 * 
 * @param integer - The integer value from storage (e.g., 8550)
 * @returns The decimal representation (e.g., 85.50)
 * 
 * @example
 * ```typescript
 * toDecimal(8550);  // Returns 85.50
 * toDecimal(2000);  // Returns 20.00
 * toDecimal(10000); // Returns 100.00
 * toDecimal(1);     // Returns 0.01
 * ```
 */
export function toDecimal(integer: number): number {
  return integer / 100;
}

/**
 * Formats an integer value as a percentage string with two decimal places.
 * Converts the integer to decimal and appends the "%" symbol.
 * 
 * @param integer - The integer value from storage (e.g., 8550)
 * @returns The formatted percentage string (e.g., "85.50%")
 * 
 * @example
 * ```typescript
 * formatPercentage(8550);  // Returns "85.50%"
 * formatPercentage(2000);  // Returns "20.00%"
 * formatPercentage(10000); // Returns "100.00%"
 * formatPercentage(1);     // Returns "0.01%"
 * formatPercentage(0);     // Returns "0.00%"
 * ```
 */
export function formatPercentage(integer: number): string {
  const decimal = toDecimal(integer);
  return `${decimal.toFixed(2)}%`;
}

/**
 * Formats an integer value as a score string with two decimal places.
 * Converts the integer to decimal without any suffix.
 * 
 * @param integer - The integer value from storage (e.g., 8550)
 * @returns The formatted score string (e.g., "85.50")
 * 
 * @example
 * ```typescript
 * formatScore(8550);  // Returns "85.50"
 * formatScore(2000);  // Returns "20.00"
 * formatScore(10000); // Returns "100.00"
 * formatScore(1);     // Returns "0.01"
 * formatScore(0);     // Returns "0.00"
 * ```
 */
export function formatScore(integer: number): string {
  const decimal = toDecimal(integer);
  return decimal.toFixed(2);
}
