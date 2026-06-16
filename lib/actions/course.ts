"use server";

import { Course, Component } from "@prisma/client";
import { 
  CourseSchema, 
  CourseInput, 
} from "../validations";
import { executeTransaction, Result } from "../transactions";
import { getTenantIdFromRequest } from "../server-context";
import { calculateCourseAnalytics, CourseAnalytics } from "../analytics";
import { z } from "zod";
import { mapTargetGradeToThreshold } from "../converters";

import { prisma } from "../db";

const UUIDSchema = z.string().min(1);



export async function createCourse(data: CourseInput): Promise<Result<Course>> {
  try {
    const tenantId = await getTenantIdFromRequest();
    
    // Validate input data
    const validatedData = CourseSchema.parse(data);
    
    const targetThreshold = mapTargetGradeToThreshold(validatedData.targetGrade);

    return await executeTransaction(async (tx) => {
      return await tx.course.create({
        data: {
          name: validatedData.name,
          sks: validatedData.sks,
          targetGrade: validatedData.targetGrade,
          targetThreshold,
          tenantId,
        },
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create course",
    };
  }
}

export async function getCourses(
  page: number = 1,
  pageSize: number = 50
): Promise<Result<{ courses: CourseWithComponentsAndAnalytics[], totalCount: number, hasMore: boolean }>> {
  try {
    const tenantId = await getTenantIdFromRequest();

    const [courses, totalCount] = await Promise.all([
      prisma.course.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          sks: true,
          targetGrade: true,
          targetThreshold: true,
          tenantId: true,
          version: true,
          createdAt: true,
          updatedAt: true,
          components: {
            select: {
              id: true,
              name: true,
              weight: true,
              achievedScore: true,
              courseId: true,
              version: true,
              createdAt: true,
              updatedAt: true,
            }
          }
        },
      }),
      prisma.course.count({ where: { tenantId } })
    ]);

    const coursesWithAnalytics = courses.map(course => ({
      ...course,
      analytics: calculateCourseAnalytics(course.components, course.targetThreshold)
    })) as CourseWithComponentsAndAnalytics[];

    return { 
      success: true, 
      data: { 
        courses: coursesWithAnalytics, 
        totalCount,
        hasMore: page * pageSize < totalCount
      } 
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch courses",
    };
  }
}

export type CourseWithComponentsAndAnalytics = Course & {
  components: Component[];
  analytics: CourseAnalytics;
};

export async function getCourseById(courseId: string): Promise<Result<CourseWithComponentsAndAnalytics>> {
  try {
    const tenantId = await getTenantIdFromRequest();
    UUIDSchema.parse(courseId);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { components: true },
    });

    if (!course || course.tenantId !== tenantId) {
      return { success: false, error: "Course not found or access denied" };
    }

    const analytics = calculateCourseAnalytics(course.components, course.targetThreshold);

    return {
      success: true,
      data: {
        ...course,
        analytics,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid course ID" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch course",
    };
  }
}

const UpdateCourseSchema = CourseSchema.partial().extend({
  version: z.number().int().min(1),
});

export async function updateCourse(
  courseId: string, 
  data: z.infer<typeof UpdateCourseSchema>
): Promise<Result<Course>> {
  try {
    const tenantId = await getTenantIdFromRequest();
    UUIDSchema.parse(courseId);
    
    const validatedData = UpdateCourseSchema.parse(data);

    // Verify ownership
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tenantId: true, version: true },
    });

    if (!existingCourse || existingCourse.tenantId !== tenantId) {
      return { success: false, error: "Course not found or access denied" };
    }

    if (existingCourse.version !== validatedData.version) {
      return { success: false, error: "Concurrent modification detected. Please refresh and try again." };
    }

    const updateData: any = { ...validatedData };
    delete updateData.version;
    
    if (updateData.targetGrade) {
      updateData.targetThreshold = mapTargetGradeToThreshold(updateData.targetGrade);
    }

    return await executeTransaction(async (tx) => {
      return await tx.course.update({
        where: { id: courseId },
        data: {
          ...updateData,
          version: { increment: 1 },
        },
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update course",
    };
  }
}

export async function deleteCourse(courseId: string): Promise<Result<void>> {
  try {
    const tenantId = await getTenantIdFromRequest();
    UUIDSchema.parse(courseId);

    // Verify ownership
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tenantId: true },
    });

    if (!existingCourse || existingCourse.tenantId !== tenantId) {
      return { success: false, error: "Course not found or access denied" };
    }

    return await executeTransaction(async (tx) => {
      // Manually cascade delete components first
      await tx.component.deleteMany({
        where: { courseId },
      });
      
      await tx.course.delete({
        where: { id: courseId },
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid course ID" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete course",
    };
  }
}
