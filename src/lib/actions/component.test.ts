import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { saveComponents } from './component';
import * as serverContext from '../server-context';

// Mock server context
vi.mock('../server-context', () => ({
  getTenantIdFromRequest: vi.fn().mockResolvedValue('tenant-123'),
}));

// Mock the transactions module
vi.mock('../transactions', async () => {
  const actual = await vi.importActual('../transactions');
  return {
    ...actual,
    executeTransaction: vi.fn(async (fn) => {
      const mockTx = {
        component: {
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
          create: vi.fn().mockImplementation(async (args) => {
            return {
              id: `mock-component-${Math.random()}`,
              ...args.data,
              version: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }),
        },
        course: {
          update: vi.fn().mockResolvedValue(true),
        }
      };
      
      try {
        const result = await fn(mockTx);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }),
  };
});

// Mock PrismaClient
vi.mock('@prisma/client', () => {
  const mockFindUnique = vi.fn();
  
  const PrismaClientMock = vi.fn(() => ({
    course: {
      findUnique: mockFindUnique,
    },
    component: {
      findUnique: mockFindUnique,
    }
  }));
  
  return {
    PrismaClient: PrismaClientMock,
  };
});

import { PrismaClient } from '@prisma/client';
const prismaMock = new PrismaClient();

describe('Component Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 5: Component Weight Sum Invariant', () => {
    beforeEach(() => {
      (prismaMock.course.findUnique as any).mockResolvedValue({
        tenantId: 'tenant-123'
      });
    });

    it('should succeed when weight sum is exactly 10000', async () => {
      // Create components summing exactly to 10000
      const components = [
        { name: 'Midterm', weight: 3000, achievedScore: null },
        { name: 'Final', weight: 4000, achievedScore: null },
        { name: 'Quiz', weight: 3000, achievedScore: null },
      ];
      
      const result = await saveComponents('550e8400-e29b-41d4-a716-446655440000', components);
      expect(result.success).toBe(true);
    });

    it('should succeed when weight sum is within tolerance (e.g., 10005)', async () => {
      const components = [
        { name: 'Part 1', weight: 3335, achievedScore: null },
        { name: 'Part 2', weight: 3335, achievedScore: null },
        { name: 'Part 3', weight: 3335, achievedScore: null }, // Sum is 10005
      ];
      
      const result = await saveComponents('550e8400-e29b-41d4-a716-446655440000', components);
      expect(result.success).toBe(true);
    });

    it('should fail validation and rollback transaction when sum is outside tolerance (e.g., 9500)', async () => {
      const components = [
        { name: 'Midterm', weight: 4500, achievedScore: null },
        { name: 'Final', weight: 5000, achievedScore: null }, // Sum is 9500
      ];
      
      const result = await saveComponents('550e8400-e29b-41d4-a716-446655440000', components);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Validation error');
        // Because of the mock, executeTransaction is never called (Zod fails first), 
        // which prevents any db operations effectively 'rolling back' by not even starting
      }
    });

    it('property-based test: weights summing to 10000 +/- 10 are valid, others are invalid', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.trim() || 'Comp'),
              weight: fc.integer({ min: 1, max: 10000 }),
              achievedScore: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: null }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (components) => {
            const sum = components.reduce((acc, c) => acc + c.weight, 0);
            const isValidSum = Math.abs(sum - 10000) <= 10;

            const result = await saveComponents('550e8400-e29b-41d4-a716-446655440000', components);

            if (isValidSum) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
              if (!result.success) {
                expect(result.error).toBe('Validation error');
              }
            }
          }
        )
      );
    });
  });
});
