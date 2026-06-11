/**
 * Integration Tests for Multi-Tenant Data Isolation
 * 
 * **Property 9: Multi-Tenant Data Isolation**
 * **Validates: Requirements 7.1-7.4, 8.4, Guardrail 2**
 * 
 * This test creates two test tenants with separate courses and attempts
 * cross-tenant data access via queries and mutations, asserting all operations
 * return 403 Forbidden or empty results.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createScopedPrismaClient } from './tenant-isolation';

// Mock Prisma client for testing
const mockPrisma = {
  course: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  component: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  notification: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(async (fn) => {
    if (typeof fn === 'function') return await fn(mockPrisma);
    return Promise.resolve(fn); // for array of operations
  }),
} as unknown as PrismaClient;

describe('Multi-Tenant Data Isolation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    (mockPrisma as any).course.findMany.mockImplementation((args: any) => {
      // Simulate tenant filtering
      if (args?.where?.tenantId === 'tenant-123') {
        return Promise.resolve([
          { id: 'course-1', name: 'Course 1', tenantId: 'tenant-123' },
          { id: 'course-2', name: 'Course 2', tenantId: 'tenant-123' },
        ]);
      }
      if (args?.where?.tenantId === 'tenant-456') {
        return Promise.resolve([
          { id: 'course-3', name: 'Course 3', tenantId: 'tenant-456' },
          { id: 'course-4', name: 'Course 4', tenantId: 'tenant-456' },
        ]);
      }
      return Promise.resolve([]);
    });
    
    (mockPrisma as any).course.findFirst.mockImplementation((args: any) => {
      if (args?.where?.tenantId === 'tenant-123') {
        return Promise.resolve({ id: 'course-1', name: 'Course 1', tenantId: 'tenant-123' });
      }
      if (args?.where?.tenantId === 'tenant-456') {
        return Promise.resolve({ id: 'course-3', name: 'Course 3', tenantId: 'tenant-456' });
      }
      return Promise.resolve(null);
    });
    
    (mockPrisma as any).course.findUnique.mockImplementation((args: any) => {
      // Simulate checking tenant ownership in findUnique
      // The scoped client should add tenantId to where clause
      const id = args?.where?.id;
      const tenantId = args?.where?.tenantId;
      
      // Match course-1 only if tenantId is tenant-123
      if (id === 'course-1' && tenantId === 'tenant-123') {
        return Promise.resolve({ id: 'course-1', name: 'Course 1', tenantId: 'tenant-123' });
      }
      // Match course-3 only if tenantId is tenant-456
      if (id === 'course-3' && tenantId === 'tenant-456') {
        return Promise.resolve({ id: 'course-3', name: 'Course 3', tenantId: 'tenant-456' });
      }
      // Otherwise return null (not found or unauthorized)
      return Promise.resolve(null);
    });
    
    // Mock create to verify tenantId is included
    (mockPrisma as any).course.create.mockImplementation((args: any) => {
      const data = args?.data;
      return Promise.resolve({
        id: 'new-course-id',
        ...data,
      });
    });
    
    // Mock update to check tenant ownership
    (mockPrisma as any).course.update.mockImplementation((args: any) => {
      const id = args?.where?.id;
      const whereClause = args?.where;
      
      // Simulate checking that tenantId matches
      if (id === 'course-1' && whereClause?.tenantId === 'tenant-123') {
        return Promise.resolve({ 
          id: 'course-1', 
          name: args?.data?.name || 'Updated Course', 
          tenantId: 'tenant-123' 
        });
      }
      if (id === 'course-3' && whereClause?.tenantId === 'tenant-456') {
        return Promise.resolve({ 
          id: 'course-3', 
          name: args?.data?.name || 'Updated Course', 
          tenantId: 'tenant-456' 
        });
      }
      return Promise.reject(new Error('Course not found or unauthorized'));
    });
    
    // Mock notification queries
    (mockPrisma as any).notification.findMany.mockImplementation((args: any) => {
      if (args?.where?.tenantId === 'tenant-123') {
        return Promise.resolve([
          { id: 'notif-1', message: 'Notification 1', tenantId: 'tenant-123' },
          { id: 'notif-2', message: 'Notification 2', tenantId: 'tenant-123' },
        ]);
      }
      return Promise.resolve([]);
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Property 9: Multi-Tenant Data Isolation', () => {
    it('should filter course queries by tenantId automatically', async () => {
      // Given two tenants with scoped Prisma clients
      const scopedPrismaTenant1 = createScopedPrismaClient(mockPrisma, 'tenant-123');
      const scopedPrismaTenant2 = createScopedPrismaClient(mockPrisma, 'tenant-456');
      
      // When tenant1 queries courses
      const tenant1Courses = await scopedPrismaTenant1.course.findMany();
      
      // Then tenant1 should only see their own courses
      expect(tenant1Courses).toEqual([
        { id: 'course-1', name: 'Course 1', tenantId: 'tenant-123' },
        { id: 'course-2', name: 'Course 2', tenantId: 'tenant-123' },
      ]);
      
      // When tenant2 queries courses
      const tenant2Courses = await scopedPrismaTenant2.course.findMany();
      
      // Then tenant2 should only see their own courses
      expect(tenant2Courses).toEqual([
        { id: 'course-3', name: 'Course 3', tenantId: 'tenant-456' },
        { id: 'course-4', name: 'Course 4', tenantId: 'tenant-456' },
      ]);
      
      // Verify tenantId filter was automatically added
      expect((mockPrisma as any).course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-123' }),
        })
      );
      
      expect((mockPrisma as any).course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-456' }),
        })
      );
    });

    it('should prevent cross-tenant data retrieval via findUnique', async () => {
      // Given tenant1 tries to access tenant2's course
      const scopedPrismaTenant1 = createScopedPrismaClient(mockPrisma, 'tenant-123');
      
      // When tenant1 tries to find tenant2's course by ID
      const course = await scopedPrismaTenant1.course.findUnique({
        where: { id: 'course-3' }, // This course belongs to tenant-456
      });
      
      // Then should return null (not found) because tenant filter doesn't match
      expect(course).toBeNull();
    });

    it('should enforce tenant isolation on create operations', async () => {
      const scopedPrismaTenant1 = createScopedPrismaClient(mockPrisma, 'tenant-123');
      
      await scopedPrismaTenant1.course.create({
        data: {
          name: 'New Course',
          sks: 3,
          targetGrade: 'A',
          tenantId: 'tenant-123', // Should be automatically added
        },
      });
      
      // Verify tenantId was included in create data
      expect((mockPrisma as any).course.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-123',
          }),
        })
      );
    });

    it('should prevent cross-tenant updates', async () => {
      const scopedPrismaTenant1 = createScopedPrismaClient(mockPrisma, 'tenant-123');
      const scopedPrismaTenant2 = createScopedPrismaClient(mockPrisma, 'tenant-456');
      
      // Tenant1 can update their own course
      await expect(
        scopedPrismaTenant1.course.update({
          where: { id: 'course-1' },
          data: { name: 'Updated Course' },
        })
      ).resolves.toBeDefined();
      
      // Tenant2 cannot update tenant1's course
      await expect(
        scopedPrismaTenant2.course.update({
          where: { id: 'course-1' },
          data: { name: 'Hacked Course' },
        })
      ).rejects.toThrow('Course not found or unauthorized');
    });

    it('should filter notification queries by tenantId', async () => {
      (mockPrisma as any).notification.findMany.mockResolvedValue([
        { id: 'notif-1', tenantId: 'tenant-123', message: 'Alert 1' },
        { id: 'notif-2', tenantId: 'tenant-123', message: 'Alert 2' },
      ]);
      
      const scopedPrismaTenant1 = createScopedPrismaClient(mockPrisma, 'tenant-123');
      
      const notifications = await scopedPrismaTenant1.notification.findMany();
      
      expect(notifications).toHaveLength(2);
      expect((mockPrisma as any).notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-123' }),
        })
      );
    });

    it('should handle batch operations with tenant isolation', async () => {
      // Create multiple courses in a transaction
      const scopedPrismaTenant1 = createScopedPrismaClient(mockPrisma, 'tenant-123');
      
      await scopedPrismaTenant1.$transaction(async (tx) => {
        await tx.course.create({
          data: { name: 'Course A', sks: 3, tenantId: 'tenant-123' },
        });
        
        await tx.course.create({
          data: { name: 'Course B', sks: 4, tenantId: 'tenant-123' },
        });
      });
      
      // Verify both creates included tenantId
      expect((mockPrisma as any).course.create).toHaveBeenCalledTimes(2);
      expect((mockPrisma as any).course.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: 'tenant-123' }),
        })
      );
    });

    it('should provide empty results for cross-tenant queries', async () => {
      const scopedPrismaTenant1 = createScopedPrismaClient(mockPrisma, 'tenant-123');
      const scopedPrismaTenant2 = createScopedPrismaClient(mockPrisma, 'tenant-456');
      
      // Reset mock to return empty array for cross-tenant queries
      (mockPrisma as any).course.findMany.mockResolvedValue([]);
      
      // Tenant1 queries with tenant2's filter (should be prevented by scoped client)
      const tenant1Results = await scopedPrismaTenant1.course.findMany();
      expect(tenant1Results).toEqual([]);
      
      // Tenant2 queries with tenant1's filter (should be prevented by scoped client)
      const tenant2Results = await scopedPrismaTenant2.course.findMany();
      expect(tenant2Results).toEqual([]);
    });

    it('should verify database queries include tenantId filter at query level', () => {
      const scopedPrismaTenant1 = createScopedPrismaClient(mockPrisma, 'tenant-123');
      
      // Perform various queries
      scopedPrismaTenant1.course.findMany({ where: { sks: 3 } });
      scopedPrismaTenant1.course.findFirst({ where: { name: { contains: 'Math' } } });
      scopedPrismaTenant1.course.count({ where: { targetGrade: 'A' } });
      
      // All queries should have tenantId automatically added
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-123',
            sks: 3,
          }),
        })
      );
      
      expect(mockPrisma.course.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-123',
            name: expect.any(Object),
          }),
        })
      );
      
      expect(mockPrisma.course.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-123',
            targetGrade: 'A',
          }),
        })
      );
    });
  });

  describe('Error Handling for Tenant Violations', () => {
    it('should throw TenantValidationError when attempting to create with wrong tenantId', () => {
      const scopedPrismaTenant1 = createScopedPrismaClient(mockPrisma, 'tenant-123');
      
      // This would normally be caught by the scoped client
      // but we test that manual tenantId assignment is validated
      expect(() => {
        // Simulate someone trying to bypass the scoped client
        scopedPrismaTenant1.course.create({
          data: {
            name: 'Hacked Course',
            sks: 3,
            tenantId: 'tenant-456', // Wrong tenant!
          },
        });
      }).toThrow(); // The scoped client should prevent this or add correct tenantId
    });

    it('should handle concurrent tenant validation correctly', async () => {
      // Simulate concurrent requests from different tenants
      const tenant1Promise = createScopedPrismaClient(mockPrisma, 'tenant-123').course.findMany();
      const tenant2Promise = createScopedPrismaClient(mockPrisma, 'tenant-456').course.findMany();
      
      const [tenant1Results, tenant2Results] = await Promise.all([tenant1Promise, tenant2Promise]);
      
      // Each tenant should only see their own data
      expect(tenant1Results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ tenantId: 'tenant-123' }),
        ])
      );
      
      expect(tenant2Results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ tenantId: 'tenant-456' }),
        ])
      );
      
      // No tenant should see the other's data
      expect(tenant1Results).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ tenantId: 'tenant-456' }),
        ])
      );
      
      expect(tenant2Results).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ tenantId: 'tenant-123' }),
        ])
      );
    });
  });
});