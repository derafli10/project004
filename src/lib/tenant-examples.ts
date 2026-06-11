/**
 * Example implementations using Tenant Isolation Helper Functions
 * 
 * This file provides practical examples of how to use the tenant isolation
 * functions in Server Actions and API routes.
 */

import { PrismaClient } from '@prisma/client';
import {
  extractTenantIdFromHeaders,
  createTenantFilter,
  assertTenantOwnership,
  createScopedPrismaClient,
  TenantValidationError,
  tenantErrorToResponse,
} from './tenant-isolation';
import { executeTransaction } from './transactions';

const prisma = new PrismaClient();

/**
 * Example 1: Basic Server Action with tenant isolation
 */
export async function getCoursesServerAction(request: Request) {
  try {
    // Extract tenantId from request headers (set by middleware)
    const tenantId = extractTenantIdFromHeaders(request.headers);
    
    // Create tenant-scoped Prisma client
    const scopedPrisma = createScopedPrismaClient(prisma, tenantId);
    
    // Query courses - tenant filter automatically applied
    const courses = await scopedPrisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        components: true,
      },
    });
    
    return {
      success: true,
      data: courses,
    };
  } catch (error) {
    if (error instanceof TenantValidationError) {
      // Convert to proper HTTP response
      return tenantErrorToResponse(error);
    }
    
    return {
      success: false,
      error: 'Failed to fetch courses',
    };
  }
}

/**
 * Example 2: Server Action with explicit tenant validation
 */
export async function updateCourseServerAction(
  request: Request,
  courseId: string,
  updateData: { name?: string; sks?: number; targetGrade?: string }
) {
  try {
    const tenantId = extractTenantIdFromHeaders(request.headers);
    
    // First, get the course to check ownership
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tenantId: true },
    });
    
    if (!existingCourse) {
      return {
        success: false,
        error: 'Course not found',
      };
    }
    
    // Explicit tenant ownership validation
    assertTenantOwnership(existingCourse.tenantId, tenantId, 'COURSE', courseId);
    
    // Update the course
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
    });
    
    return {
      success: true,
      data: updatedCourse,
    };
  } catch (error) {
    if (error instanceof TenantValidationError) {
      return tenantErrorToResponse(error);
    }
    
    return {
      success: false,
      error: 'Failed to update course',
    };
  }
}

/**
 * Example 3: Transaction with tenant validation
 */
export async function createCourseWithComponentsServerAction(
  request: Request,
  courseData: {
    name: string;
    sks: number;
    targetGrade: string;
    components: Array<{
      name: string;
      weight: number;
    }>;
  }
) {
  const tenantId = extractTenantIdFromHeaders(request.headers);
  
  const result = await executeTransaction(async (tx) => {
    // Create course with tenantId
    const course = await tx.course.create({
      data: {
        ...courseData,
        tenantId,
      },
    });
    
    // Create components with automatic tenantId through course relation
    const components = await Promise.all(
      courseData.components.map((component) =>
        tx.component.create({
          data: {
            ...component,
            courseId: course.id,
          },
        })
      )
    );
    
    return { course, components };
  });
  
  return {
    success: true,
    data: result,
  };
}

/**
 * Example 4: Batch operation with tenant validation
 */
export async function deleteMultipleCoursesServerAction(
  request: Request,
  courseIds: string[]
) {
  try {
    const tenantId = extractTenantIdFromHeaders(request.headers);
    
    // First, get all courses to validate ownership
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
      },
      select: { id: true, tenantId: true },
    });
    
    // Check if all courses belong to the requesting tenant
    for (const course of courses) {
      assertTenantOwnership(course.tenantId, tenantId, 'COURSE', course.id);
    }
    
    // Delete all courses (cascade will delete components)
    await prisma.course.deleteMany({
      where: {
        id: { in: courseIds },
      },
    });
    
    return {
      success: true,
      data: { deletedCount: courses.length },
    };
  } catch (error) {
    if (error instanceof TenantValidationError) {
      return tenantErrorToResponse(error);
    }
    
    return {
      success: false,
      error: 'Failed to delete courses',
    };
  }
}

/**
 * Example 5: Using tenant filter in complex queries
 */
export async function getCourseAnalyticsServerAction(
  request: Request,
  courseId: string
) {
  try {
    const tenantId = extractTenantIdFromHeaders(request.headers);
    
    // Use tenant filter explicitly
    const course = await prisma.course.findFirst({
      where: {
        AND: [
          { id: courseId },
          createTenantFilter(tenantId), // Explicit tenant filter
        ],
      },
      include: {
        components: true,
      },
    });
    
    if (!course) {
      return {
        success: false,
        error: 'Course not found',
      };
    }
    
    // Calculate analytics
    const analytics = {
      courseId: course.id,
      componentCount: course.components.length,
      totalWeight: course.components.reduce((sum, c) => sum + c.weight, 0),
      hasScores: course.components.some((c) => c.achievedScore !== null),
    };
    
    return {
      success: true,
      data: { course, analytics },
    };
  } catch (error) {
    if (error instanceof TenantValidationError) {
      return tenantErrorToResponse(error);
    }
    
    return {
      success: false,
      error: 'Failed to get course analytics',
    };
  }
}

/**
 * Example 6: Error handling wrapper for Server Actions
 */
export function withTenantValidation<T>(
  handler: (tenantId: string, ...args: any[]) => Promise<T>
) {
  return async (request: Request, ...args: any[]) => {
    try {
      const tenantId = extractTenantIdFromHeaders(request.headers);
      return await handler(tenantId, ...args);
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return tenantErrorToResponse(error);
      }
      throw error;
    }
  };
}

/**
 * Example 7: Scoped query helper
 */
export async function executeTenantScopedQuery<T>(
  request: Request,
  query: (scopedPrisma: PrismaClient, tenantId: string) => Promise<T>
) {
  const tenantId = extractTenantIdFromHeaders(request.headers);
  const scopedPrisma = createScopedPrismaClient(prisma, tenantId);
  return await query(scopedPrisma, tenantId);
}