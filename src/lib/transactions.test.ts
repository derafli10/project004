/**
 * Unit Tests for Transaction Management Utilities
 * 
 * Tests cover:
 * - Successful transaction execution
 * - Automatic rollback on error
 * - Error logging with sanitization
 * - Result type discrimination
 * - Field error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeTransaction, type Result } from './transactions';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
vi.mock('@prisma/client', () => {
  const mockPrismaClient = vi.fn();
  mockPrismaClient.prototype.$transaction = vi.fn();
  mockPrismaClient.prototype.$disconnect = vi.fn();
  
  return {
    PrismaClient: mockPrismaClient,
  };
});

describe('executeTransaction', () => {
  let mockPrisma: PrismaClient;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('Successful Transactions', () => {
    it('should return success Result with data when transaction succeeds', async () => {
      const testData = { id: '123', name: 'Test Course' };
      
      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
        async (fn: (tx: PrismaClient) => Promise<unknown>) => {
          return await fn(mockPrisma);
        }
      );

      const result = await executeTransaction(async () => testData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(testData);
      }
      expect(mockPrisma.$disconnect).toHaveBeenCalledOnce();
    });

    it('should handle complex nested data structures', async () => {
      const complexData = {
        course: { id: '1', name: 'Database Systems', sks: 3 },
        components: [
          { id: 'c1', name: 'Quiz', weight: 2000 },
          { id: 'c2', name: 'Midterm', weight: 3000 },
        ],
      };

      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
        async (fn: (tx: PrismaClient) => Promise<unknown>) => {
          return await fn(mockPrisma);
        }
      );

      const result = await executeTransaction(async () => complexData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(complexData);
      }
    });

    it('should pass transaction-scoped client to the callback', async () => {
      let receivedClient: PrismaClient | null = null;

      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
        async (fn: (tx: PrismaClient) => Promise<unknown>) => {
          return await fn(mockPrisma);
        }
      );

      await executeTransaction(async (tx) => {
        receivedClient = tx;
        return { success: true };
      });

      expect(receivedClient).toBe(mockPrisma);
    });
  });

  describe('Transaction Failures and Rollback', () => {
    it('should return error Result when transaction fails', async () => {
      const errorMessage = 'Database constraint violation';

      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error(errorMessage)
      );

      const result = await executeTransaction(async () => {
        throw new Error(errorMessage);
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(errorMessage);
      }
      expect(mockPrisma.$disconnect).toHaveBeenCalledOnce();
    });

    it('should handle non-Error exceptions', async () => {
      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        'String error'
      );

      const result = await executeTransaction(async () => {
        throw 'String error';
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unknown transaction error');
      }
    });

    it('should automatically rollback on validation error', async () => {
      const validationError = new Error('Total weight exceeds 100%');

      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        validationError
      );

      const result = await executeTransaction(async () => {
        throw validationError;
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Total weight exceeds 100%');
      }
    });
  });

  describe('Error Logging', () => {
    it('should log error message when transaction fails', async () => {
      const errorMessage = 'Transaction failed';

      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error(errorMessage)
      );

      await executeTransaction(async () => {
        throw new Error(errorMessage);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Transaction Error]',
        errorMessage
      );
    });

    it('should log stack trace when available', async () => {
      const error = new Error('Test error');

      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        error
      );

      await executeTransaction(async () => {
        throw error;
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Stack Trace]',
        expect.stringContaining('Error: Test error')
      );
    });
  });

  describe('Sensitive Data Sanitization', () => {
    it('should sanitize password in error messages', async () => {
      const error = new Error('Authentication failed: password incorrect');

      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        error
      );

      await executeTransaction(async () => {
        throw error;
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Transaction Error]',
        expect.stringContaining('[REDACTED]')
      );
    });

    it('should sanitize token in error messages', async () => {
      const error = new Error('Invalid token: abc123xyz');

      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        error
      );

      await executeTransaction(async () => {
        throw error;
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Transaction Error]',
        expect.stringContaining('[REDACTED]')
      );
    });

    it('should sanitize API key in error messages', async () => {
      const error = new Error('API_KEY validation failed');

      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        error
      );

      await executeTransaction(async () => {
        throw error;
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Transaction Error]',
        expect.stringContaining('[REDACTED]')
      );
    });

    it('should preserve non-sensitive error messages', async () => {
      const error = new Error('Course not found');

      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        error
      );

      await executeTransaction(async () => {
        throw error;
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Transaction Error]',
        'Course not found'
      );
    });
  });

  describe('Field Error Handling', () => {
    it('should include field errors when available', async () => {
      const errorWithFields = Object.assign(new Error('Validation failed'), {
        fieldErrors: {
          name: ['Name is required', 'Name must be at least 3 characters'],
          sks: ['SKS must be between 1 and 6'],
        },
      });

      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        errorWithFields
      );

      const result = await executeTransaction(async () => {
        throw errorWithFields;
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fieldErrors).toBeDefined();
        expect(result.fieldErrors?.['name']).toContain('Name is required');
        expect(result.fieldErrors?.['sks']).toContain('SKS must be between 1 and 6');
      }
    });

    it('should sanitize sensitive field names in field errors', async () => {
      const errorWithFields = Object.assign(new Error('Validation failed'), {
        fieldErrors: {
          password: ['Password is too short'],
          token: ['Token is invalid'],
          email: ['Email is required'],
        },
      });

      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        errorWithFields
      );

      const result = await executeTransaction(async () => {
        throw errorWithFields;
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fieldErrors?.['password']).toBe('[REDACTED]');
        expect(result.fieldErrors?.['token']).toBe('[REDACTED]');
        expect(result.fieldErrors?.['email']).toContain('Email is required');
      }
    });
  });

  describe('Result Type Discrimination', () => {
    it('should allow TypeScript narrowing on success', async () => {
      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
        async (fn: (tx: PrismaClient) => Promise<unknown>) => {
          return await fn(mockPrisma);
        }
      );

      const result: Result<{ id: string }> = await executeTransaction(
        async () => ({ id: '123' })
      );

      if (result.success) {
        // TypeScript should know result.data exists
        expect(result.data.id).toBe('123');
        // @ts-expect-error - error should not exist on success case
        expect(result.error).toBeUndefined();
      }
    });

    it('should allow TypeScript narrowing on failure', async () => {
      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed')
      );

      const result: Result<{ id: string }> = await executeTransaction(
        async () => {
          throw new Error('Failed');
        }
      );

      if (!result.success) {
        // TypeScript should know result.error exists
        expect(result.error).toBe('Failed');
        // @ts-expect-error - data should not exist on failure case
        expect(result.data).toBeUndefined();
      }
    });
  });

  describe('Connection Management', () => {
    it('should disconnect after successful transaction', async () => {
      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
        async (fn: (tx: PrismaClient) => Promise<unknown>) => {
          return await fn(mockPrisma);
        }
      );

      await executeTransaction(async () => ({ success: true }));

      expect(mockPrisma.$disconnect).toHaveBeenCalledOnce();
    });

    it('should disconnect after failed transaction', async () => {
      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed')
      );

      await executeTransaction(async () => {
        throw new Error('Failed');
      });

      expect(mockPrisma.$disconnect).toHaveBeenCalledOnce();
    });

    it('should disconnect even if transaction throws', async () => {
      (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Unexpected error')
      );

      await executeTransaction(async () => {
        throw new Error('Unexpected error');
      });

      expect(mockPrisma.$disconnect).toHaveBeenCalledOnce();
    });
  });
});
