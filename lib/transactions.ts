/**
 * Transaction Management Utilities
 * 
 * This module provides a robust wrapper around Prisma's transaction API with:
 * - Type-safe Result discriminated union for error handling
 * - Automatic rollback on error (ACID compliance)
 * - Comprehensive error logging with stack traces
 * - Sensitive data sanitization before logging
 * 
 * Requirements: 9.1-9.3, 9.5, Guardrail 4.4-4.5
 * 
 * @module transactions
 */

import { PrismaClient } from '@prisma/client';

/**
 * Result discriminated union for type-safe error handling.
 * 
 * Success case contains the data, failure case contains error messages.
 * The `success` field acts as the type discriminant for TypeScript narrowing.
 * 
 * @template T - The type of data returned on success
 * 
 * @example
 * ```typescript
 * const result = await executeTransaction(async (tx) => {
 *   return await tx.course.create({ data: courseData });
 * });
 * 
 * if (result.success) {
 *   console.log('Course created:', result.data);
 * } else {
 *   console.error('Error:', result.error);
 *   if (result.fieldErrors) {
 *     console.error('Field errors:', result.fieldErrors);
 *   }
 * }
 * ```
 */
export type Result<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

/**
 * Patterns for detecting sensitive data in error messages and objects.
 * Used for sanitization before logging.
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
];

/**
 * Sanitizes sensitive data from error messages and objects before logging.
 * 
 * Replaces values for fields matching sensitive patterns with '[REDACTED]'.
 * Handles both string messages and structured error objects.
 * 
 * @param data - The data to sanitize (string, object, or unknown)
 * @returns Sanitized version safe for logging
 * 
 * @example
 * ```typescript
 * sanitizeSensitiveData({ password: 'secret123', name: 'John' });
 * // Returns: { password: '[REDACTED]', name: 'John' }
 * 
 * sanitizeSensitiveData('Error: Invalid password for user@example.com');
 * // Returns: 'Error: Invalid [REDACTED] for user@example.com'
 * ```
 */
function sanitizeSensitiveData(data: unknown): unknown {
  if (typeof data === 'string') {
    let sanitized = data;
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(sanitized)) {
        // Replace sensitive values in string messages
        sanitized = sanitized.replace(
          new RegExp(`(${pattern.source}[:\\s=]+)([^\\s,;]+)`, 'gi'),
          '$1[REDACTED]'
        );
      }
    }
    return sanitized;
  }

  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map((item) => sanitizeSensitiveData(item));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const isSensitive = SENSITIVE_PATTERNS.some((pattern) =>
        pattern.test(key)
      );
      sanitized[key] = isSensitive ? '[REDACTED]' : sanitizeSensitiveData(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * Executes a database transaction with automatic rollback on error.
 * 
 * Wraps Prisma's $transaction API to provide:
 * - Type-safe Result return type
 * - Automatic rollback on any error (ACID compliance)
 * - Comprehensive error logging with sanitized stack traces
 * - Field-level validation error support
 * 
 * The transaction function receives a Prisma Client instance that is scoped
 * to the transaction. All operations using this client are automatically
 * rolled back if any error occurs.
 * 
 * @template T - The type of data returned by the transaction
 * @param fn - Async function that receives a transaction-scoped Prisma client
 * @returns Promise resolving to Result<T> with success data or error details
 * 
 * @example
 * ```typescript
 * // Simple transaction
 * const result = await executeTransaction(async (tx) => {
 *   const course = await tx.course.create({
 *     data: { name: 'Database Systems', sks: 3, tenantId: '...' }
 *   });
 *   await tx.component.create({
 *     data: { name: 'Midterm', weight: 3000, courseId: course.id }
 *   });
 *   return course;
 * });
 * 
 * // Complex transaction with validation
 * const result = await executeTransaction(async (tx) => {
 *   const components = await tx.component.findMany({
 *     where: { courseId: 'course-id' }
 *   });
 *   
 *   const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
 *   if (totalWeight > 10000) {
 *     throw new Error('Total component weight exceeds 100%');
 *   }
 *   
 *   return await tx.course.update({
 *     where: { id: 'course-id' },
 *     data: { version: { increment: 1 } }
 *   });
 * });
 * ```
 */
export async function executeTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<Result<T>> {
  const prisma = new PrismaClient();

  try {
    // Execute the transaction function with Prisma's $transaction API
    // Prisma automatically handles rollback if any error occurs
    const data = await prisma.$transaction(async (tx) => {
      return await fn(tx as PrismaClient);
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    // Extract error message and stack trace
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown transaction error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Sanitize sensitive data before logging
    const sanitizedMessage = sanitizeSensitiveData(errorMessage) as string;
    const sanitizedStack = errorStack
      ? (sanitizeSensitiveData(errorStack) as string)
      : undefined;

    // Log error with stack trace (in production, use proper logging service)
    console.error('[Transaction Error]', sanitizedMessage);
    if (sanitizedStack) {
      console.error('[Stack Trace]', sanitizedStack);
    }

    // Extract field-level validation errors if available (e.g., from Zod or Prisma)
    let fieldErrors: Record<string, string[]> | undefined;
    if (error && typeof error === 'object' && 'fieldErrors' in error) {
      fieldErrors = sanitizeSensitiveData(
        error.fieldErrors
      ) as Record<string, string[]>;
    }

    return {
      success: false,
      error: errorMessage,
      fieldErrors,
    };
  } finally {
    // Always disconnect to prevent connection leaks
    await prisma.$disconnect();
  }
}
