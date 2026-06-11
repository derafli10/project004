import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { 
  createCourse, 
  deleteCourse,
  getCourses
} from './course';


// Mock server context
vi.mock('../server-context', () => ({
  getTenantIdFromRequest: vi.fn().mockResolvedValue('tenant-123'),
  validateTenantAccess: vi.fn(),
}));

// Mock the transactions module so it doesn't try to use a real Prisma client
vi.mock('../transactions', async () => {
  const actual = await vi.importActual('../transactions');
  return {
    ...actual,
    executeTransaction: vi.fn(async (fn) => {
      // Create a mock tx object that has the methods we use
      const mockTx = {
        course: {
          create: vi.fn().mockImplementation(async (args) => {
            return {
              id: 'mock-course-id',
              ...args.data,
              version: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }),
          update: vi.fn().mockImplementation(async (args) => {
            return {
              id: args.where.id,
              ...args.data,
              version: 2, // simulated increment
              updatedAt: new Date(),
            };
          }),
          delete: vi.fn().mockResolvedValue(true),
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

// Mock PrismaClient to handle direct queries in getCourseById and getCourses
vi.mock('@prisma/client', () => {
  const mockFindUnique = vi.fn();
  const mockFindMany = vi.fn();
  
  const PrismaClientMock = vi.fn(() => ({
    course: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
    },
  }));
  
  return {
    PrismaClient: PrismaClientMock,
    AlertLevel: {
      NORMAL: 'NORMAL',
      WARNING: 'WARNING',
      DANGER: 'DANGER'
    }
  };
});

// Get the mocked Prisma client instance
import { PrismaClient } from '@prisma/client';
const prismaMock = new PrismaClient();

describe('Course Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 1: Course CRUD Preservation', () => {
    it('should preserve all course fields across create operation', async () => {
      // We test that createCourse passes the right data to tx.course.create
      // and that the validation allows valid data
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.trim() || 'Course'),
            sks: fc.integer({ min: 1, max: 6 }),
            targetGrade: fc.constantFrom('A', 'AB', 'B', 'BC', 'C', 'D', 'E') as fc.Arbitrary<"A"|"AB"|"B"|"BC"|"C"|"D"|"E">,
          }),
          async (courseData) => {
            const result = await createCourse(courseData);
            
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data).toMatchObject({
                name: courseData.name,
                sks: courseData.sks,
                targetGrade: courseData.targetGrade,
                tenantId: 'tenant-123',
              });
              
              // Verify integer mapping
              if (courseData.targetGrade === 'A') {
                expect(result.data.targetThreshold).toBe(8000);
              }
            }
          }
        )
      );
    });
  });

  describe('Property 2: Cascade Deletion Completeness', () => {
    it('should delete course and implicitly cascade components (handled by DB schema)', async () => {
      // Mock findUnique to pass the ownership check
      (prismaMock.course.findUnique as any).mockResolvedValue({
        tenantId: 'tenant-123'
      });
      
      const courseId = '550e8400-e29b-41d4-a716-446655440000';
      const result = await deleteCourse(courseId);
      
      expect(result.success).toBe(true);
      // We assume Prisma's cascade delete works as configured in schema.prisma
    });
    
    it('should prevent deletion if course belongs to different tenant', async () => {
      (prismaMock.course.findUnique as any).mockResolvedValue({
        tenantId: 'different-tenant'
      });
      
      const courseId = '550e8400-e29b-41d4-a716-446655440000';
      const result = await deleteCourse(courseId);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Course not found or access denied');
      }
    });
  });

  describe('getCourses', () => {
    it('should return courses for the current tenant', async () => {
      (prismaMock.course.findMany as any).mockResolvedValue([
        { id: '1', name: 'Course 1', components: [], targetThreshold: 8000 },
        { id: '2', name: 'Course 2', components: [], targetThreshold: 8000 }
      ]);

      const result = await getCourses();
      console.log('Result:', result);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });
  });
});
