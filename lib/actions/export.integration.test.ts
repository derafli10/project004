import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { exportData } from "./export";

// Mock server context
vi.mock("@/lib/server-context", () => ({
  getTenantIdFromRequest: vi.fn().mockResolvedValue("test-tenant-export"),
}));

const prisma = new PrismaClient();

describe("Property 13: Export Data Completeness", () => {
  const tenantId = "test-tenant-export";
  const otherTenantId = "other-tenant-export";

  beforeEach(async () => {
    // Ensure test users exist
    await prisma.user.upsert({
      where: { tenantId },
      update: {},
      create: {
        email: "export-test@example.com",
        name: "Test User",
        tenantId,
      },
    });

    await prisma.user.upsert({
      where: { tenantId: otherTenantId },
      update: {},
      create: {
        email: "other-export-test@example.com",
        name: "Other User",
        tenantId: otherTenantId,
      },
    });

    // Clean up test data
    await prisma.component.deleteMany({
      where: { course: { tenantId: { in: [tenantId, otherTenantId] } } },
    });
    await prisma.course.deleteMany({
      where: { tenantId: { in: [tenantId, otherTenantId] } },
    });

    // Create courses for main tenant
    await prisma.course.create({
      data: {
        name: "Tenant 1 Course",
        sks: 3,
        targetGrade: "A",
        targetThreshold: 8000,
        tenantId,
        components: {
          create: [
            { name: "Midterm", weight: 4000, achievedScore: 8000 },
            { name: "Final", weight: 6000, achievedScore: null },
          ]
        }
      },
    });

    // Create course for other tenant (should not be exported)
    await prisma.course.create({
      data: {
        name: "Tenant 2 Course",
        sks: 2,
        targetGrade: "B",
        targetThreshold: 7000,
        tenantId: otherTenantId,
        components: {
          create: [
            { name: "Project", weight: 10000, achievedScore: 9000 },
          ]
        }
      },
    });
  });

  it("should export complete data for the authenticated tenant without cross-tenant leakage", async () => {
    const result = await exportData();
    
    expect(result.success).toBe(true);
    if (result.success && result.data) {
      const parsed = JSON.parse(result.data);
      
      // Check metadata
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.tenantId).toBe(tenantId);
      expect(parsed.metadata.version).toBe("1.0");
      expect(parsed.metadata.exportTimestamp).toBeDefined();

      // Check courses
      expect(parsed.courses).toHaveLength(1);
      const course = parsed.courses[0];
      expect(course.name).toBe("Tenant 1 Course");
      
      // Check components
      expect(course.components).toHaveLength(2);
      
      // Check calculated analytics
      expect(course.analytics).toBeDefined();
      expect(course.analytics.cumulativeActual).toBeDefined();
      expect(course.analytics.requiredScore).toBeDefined();
      expect(course.analytics.alertLevel).toBeDefined();

      // Verify NO cross-tenant leakage
      const hasOtherTenantData = parsed.courses.some((c: any) => c.name === "Tenant 2 Course");
      expect(hasOtherTenantData).toBe(false);
    }
  });
});
