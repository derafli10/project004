import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { saveComponents } from "./component";

// Mock server context
vi.mock("@/lib/server-context", () => ({
  getTenantIdFromRequest: vi.fn().mockResolvedValue("test-tenant-weight-validation"),
}));

const prisma = new PrismaClient();

describe("Component Weight Validation Integration Tests", () => {
  const tenantId = "test-tenant-weight-validation";
  let courseId: string;

  beforeEach(async () => {
    // Ensure test user exists
    await prisma.user.upsert({
      where: { tenantId },
      update: {},
      create: {
        email: "weight-test@example.com",
        name: "Test User",
        tenantId,
      },
    });

    // Clean up test data
    await prisma.component.deleteMany({
      where: { course: { tenantId } },
    });
    await prisma.course.deleteMany({
      where: { tenantId },
    });

    // Create a default test course
    const course = await prisma.course.create({
      data: {
        name: "Weight Invariant Course",
        sks: 3,
        targetGrade: "A",
        targetThreshold: 8000,
        tenantId,
      },
    });
    courseId = course.id;
  });

  it("should fail validation when component weights do not sum to 100.00% (within tolerance) and preserve existing components", async () => {
    // 1. First, save a valid set of components summing to exactly 100.00% (10000)
    const initialComponents = [
      { name: "Midterm Exam", weight: 4000, achievedScore: null },
      { name: "Final Exam", weight: 6000, achievedScore: null },
    ];
    const initialResult = await saveComponents(courseId, initialComponents);
    expect(initialResult.success).toBe(true);

    // Verify they are saved
    const savedInitial = await prisma.component.findMany({
      where: { courseId },
      orderBy: { name: "asc" },
    });
    expect(savedInitial).toHaveLength(2);
    expect(savedInitial[0].name).toBe("Final Exam");
    expect(savedInitial[0].weight).toBe(6000);
    expect(savedInitial[1].name).toBe("Midterm Exam");
    expect(savedInitial[1].weight).toBe(4000);

    // 2. Submit new components with weights summing to 99.50% (9950), which is outside the ±0.10% tolerance (9990 - 10010)
    const invalidComponents = [
      { name: "Quiz 1", weight: 3500, achievedScore: null },
      { name: "Quiz 2", weight: 6450, achievedScore: null }, // Sum = 9950
    ];
    const invalidResult = await saveComponents(courseId, invalidComponents);
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toBe("Validation error");

    // 3. Verify transaction rollback on validation failure: the initial valid components must STILL exist
    const postFailureComponents = await prisma.component.findMany({
      where: { courseId },
      orderBy: { name: "asc" },
    });
    expect(postFailureComponents).toHaveLength(2);
    expect(postFailureComponents[0].name).toBe("Final Exam");
    expect(postFailureComponents[0].weight).toBe(6000);
    expect(postFailureComponents[1].name).toBe("Midterm Exam");
    expect(postFailureComponents[1].weight).toBe(4000);
  });

  it("should succeed saving when component weights sum to 100.05% (10005, within tolerance)", async () => {
    // Submit components summing to 100.05% (10005)
    const validToleranceComponents = [
      { name: "Component A", weight: 3335, achievedScore: null },
      { name: "Component B", weight: 3335, achievedScore: null },
      { name: "Component C", weight: 3335, achievedScore: null }, // Sum = 10005
    ];
    const result = await saveComponents(courseId, validToleranceComponents);
    expect(result.success).toBe(true);

    // Verify they are saved
    const saved = await prisma.component.findMany({
      where: { courseId },
      orderBy: { name: "asc" },
    });
    expect(saved).toHaveLength(3);
    expect(saved[0].name).toBe("Component A");
    expect(saved[0].weight).toBe(3335);
    expect(saved[1].name).toBe("Component B");
    expect(saved[1].weight).toBe(3335);
    expect(saved[2].name).toBe("Component C");
    expect(saved[2].weight).toBe(3335);
  });
});
