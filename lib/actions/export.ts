"use server";

import { prisma } from "../db";
import { Result } from "../transactions";
import { getTenantIdFromRequest } from "../server-context";
import { calculateCourseAnalytics } from "../analytics";



export async function exportData(): Promise<Result<string>> {
  try {
    const tenantId = await getTenantIdFromRequest();

    const courses = await prisma.course.findMany({
      where: { tenantId },
      include: {
        components: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const dataWithAnalytics = courses.map((course) => {
      const analytics = calculateCourseAnalytics(
        course.components,
        course.targetThreshold
      );
      
      return {
        id: course.id,
        name: course.name,
        sks: course.sks,
        targetGrade: course.targetGrade,
        targetThreshold: course.targetThreshold,
        version: course.version,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        components: course.components.map(c => ({
          id: c.id,
          name: c.name,
          weight: c.weight,
          achievedScore: c.achievedScore,
          version: c.version,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
        analytics: {
          cumulativeActual: analytics.cumulativeActual,
          requiredScore: analytics.requiredScore,
          remainingWeight: analytics.remainingWeight,
          alertLevel: analytics.alertLevel,
          isTargetAchievable: analytics.isTargetAchievable,
        }
      };
    });

    const exportPayload = {
      metadata: {
        tenantId,
        exportTimestamp: new Date().toISOString(),
        version: "1.0",
      },
      courses: dataWithAnalytics,
    };

    return {
      success: true,
      data: JSON.stringify(exportPayload, null, 2),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export data",
    };
  }
}
