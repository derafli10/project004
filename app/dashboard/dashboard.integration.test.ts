import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCourses } from "@/lib/actions/course";
import { PrismaClient } from "@prisma/client";

// Mock server context to avoid next/headers issues
vi.mock("@/lib/server-context", () => ({
  getTenantIdFromRequest: vi.fn().mockResolvedValue("dashboard-tenant-id"),
}));

const prisma = new PrismaClient();

describe("Dashboard Data Fetching Integration", () => {
  beforeEach(async () => {
    // Ensure user exists for foreign key constraint
    await prisma.user.upsert({
      where: { tenantId: "dashboard-tenant-id" },
      update: {},
      create: {
        email: "dashboard-test@example.com",
        name: "Test User",
        tenantId: "dashboard-tenant-id",
      }
    });

    // Clean up test data
    await prisma.component.deleteMany({
      where: { course: { tenantId: "dashboard-tenant-id" } }
    });
    await prisma.course.deleteMany({
      where: { tenantId: "dashboard-tenant-id" }
    });
  });

  it("should fetch courses with correctly calculated analytics", async () => {
    // 1. Create a test course with components
    const course = await prisma.course.create({
      data: {
        name: "Test Course for Dashboard",
        sks: 3,
        targetGrade: "A",
        targetThreshold: 8000, // 80%
        tenantId: "dashboard-tenant-id",
        components: {
          create: [
            { name: "Assignment 1", weight: 3000, achievedScore: 8500 }, // 30% weight, 85% score
            { name: "Assignment 2", weight: 3000, achievedScore: 9000 }, // 30% weight, 90% score
            { name: "Final Exam", weight: 4000, achievedScore: null },   // 40% weight, not graded
          ]
        }
      }
    });

    // 2. Call the action that the dashboard uses
    const result = await getCourses();
    
    expect(result.success).toBe(true);
    if (!result.success) throw new Error("Expected success");
    
    expect(result.data.courses).toHaveLength(1);
    
    const fetchedCourse = result.data.courses[0]!;
    expect(fetchedCourse.id).toBe(course.id);
    
    // 3. Assert cumulative actual and required score
    // cumulativeActual = (85 * 0.3) + (90 * 0.3) = 25.5 + 27 = 52.50
    expect(fetchedCourse.analytics.cumulativeActual).toBe(52.50);
    
    // requiredScore = (80 - 52.5) / 0.4 = 27.5 / 0.4 = 68.75
    expect(fetchedCourse.analytics.requiredScore).toBe(68.75);
    
    // 4. Verify alert level badge data (NORMAL because 68.75 < 90)
    expect(fetchedCourse.analytics.alertLevel).toBe("NORMAL");
    expect(fetchedCourse.analytics.isTargetAchievable).toBe(true);
  });
  
  it("should calculate DANGER alert level correctly for the dashboard", async () => {
    // 1. Create a test course with poor performance
    await prisma.course.create({
      data: {
        name: "Failing Course",
        sks: 3,
        targetGrade: "A",
        targetThreshold: 8000, // 80%
        tenantId: "dashboard-tenant-id",
        components: {
          create: [
            { name: "Midterm", weight: 5000, achievedScore: 5000 }, // 50% weight, 50% score
            { name: "Final Exam", weight: 5000, achievedScore: null }, // 50% weight, not graded
          ]
        }
      }
    });

    const result = await getCourses();
    
    expect(result.success).toBe(true);
    if (!result.success) throw new Error("Expected success");
    
    const fetchedCourse = result.data.courses[0]!;
    
    // cumulative = 50 * 0.5 = 25.00
    expect(fetchedCourse.analytics.cumulativeActual).toBe(25.00);
    
    // required = (80 - 25) / 0.5 = 110.00
    expect(fetchedCourse.analytics.requiredScore).toBe(110.00);
    
    // Alert level DANGER because > 100
    expect(fetchedCourse.analytics.alertLevel).toBe("DANGER");
    expect(fetchedCourse.analytics.isTargetAchievable).toBe(false);
  });
});
