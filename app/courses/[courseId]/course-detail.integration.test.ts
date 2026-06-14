import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { updateComponentScore } from "@/lib/actions/component";
import { calculateCourseAnalytics } from "@/lib/analytics";

// Mock server context
vi.mock("@/lib/server-context", () => ({
  getTenantIdFromRequest: vi.fn().mockResolvedValue("test-tenant-id"),
}));

const prisma = new PrismaClient();

describe("Course Detail Component Matrix Integration", () => {
  beforeEach(async () => {
    // Ensure user exists for foreign key constraint
    await prisma.user.upsert({
      where: { tenantId: "test-tenant-id" },
      update: {},
      create: {
        email: "course-detail-test@example.com",
        name: "Test User",
        tenantId: "test-tenant-id",
      }
    });

    await prisma.component.deleteMany({
      where: { course: { tenantId: "test-tenant-id" } }
    });
    await prisma.course.deleteMany({
      where: { tenantId: "test-tenant-id" }
    });
  });

  it("should real-time recalculate analytics and update required score & alert level", async () => {
    // 1. Create a course with 3 components
    const course = await prisma.course.create({
      data: {
        name: "Real-time Test Course",
        sks: 3,
        targetGrade: "A",
        targetThreshold: 8000, // 80%
        tenantId: "test-tenant-id",
        components: {
          create: [
            { name: "Quiz", weight: 3000, achievedScore: null },
            { name: "Midterm", weight: 3000, achievedScore: null },
            { name: "Final Exam", weight: 4000, achievedScore: null },
          ]
        }
      },
      include: { components: true }
    });

    const components = course.components;

    // --- Simulated UI Interaction 1: Update Quiz to 90% (9000) ---
    const quizId = components.find(c => c.name === "Quiz")!.id;
    
    // Simulate what the client component does (real-time recalculation)
    const simulatedComponents1 = components.map(c => 
      c.id === quizId ? { ...c, achievedScore: 9000 } : c
    );
    
    const startTime1 = performance.now();
    const analytics1 = calculateCourseAnalytics(simulatedComponents1, course.targetThreshold);
    const endTime1 = performance.now();
    
    // Assert recalculates within 200ms
    expect(endTime1 - startTime1).toBeLessThan(200);
    
    // Assert cumulative actual: 90 * 0.3 = 27.00
    expect(analytics1.cumulativeActual).toBe(27.00);
    // Assert required score: (80 - 27) / 0.7 = 75.71
    expect(analytics1.requiredScore).toBe(75.71);
    // Assert alert level: NORMAL (< 90)
    expect(analytics1.alertLevel).toBe("NORMAL");

    // Also verify the server action updates correctly
    const result1 = await updateComponentScore({ componentId: quizId, achievedScore: 9000 });
    expect(result1.success).toBe(true);


    // --- Simulated UI Interaction 2: Update Midterm to 40% (4000) ---
    const midtermId = components.find(c => c.name === "Midterm")!.id;
    
    // Simulate what the client component does
    const simulatedComponents2 = simulatedComponents1.map(c => 
      c.id === midtermId ? { ...c, achievedScore: 4000 } : c
    );
    
    const startTime2 = performance.now();
    const analytics2 = calculateCourseAnalytics(simulatedComponents2, course.targetThreshold);
    const endTime2 = performance.now();
    
    expect(endTime2 - startTime2).toBeLessThan(200);
    
    // Assert cumulative actual: 27 + (40 * 0.3) = 27 + 12 = 39.00
    expect(analytics2.cumulativeActual).toBe(39.00);
    
    // Assert required score: (80 - 39) / 0.4 = 102.50
    expect(analytics2.requiredScore).toBe(102.50);
    
    // Assert alert level changes when thresholds crossed (DANGER > 100)
    expect(analytics2.alertLevel).toBe("DANGER");

    // Also verify the server action updates correctly and returns the updated component
    const result2 = await updateComponentScore({ componentId: midtermId, achievedScore: 4000 });
    expect(result2.success).toBe(true);
  }, 30000);
});
