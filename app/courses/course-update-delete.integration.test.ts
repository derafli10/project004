import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateCourse, deleteCourse, getCourseById } from "@/lib/actions/course";
import { PrismaClient } from "@prisma/client";

// Mock server context to avoid next/headers issues
vi.mock("@/lib/server-context", () => ({
  getTenantIdFromRequest: vi.fn().mockResolvedValue("update-delete-tenant-id"),
}));

const prisma = new PrismaClient();

describe("Course Update and Delete Integration", () => {
  beforeEach(async () => {
    // Ensure user exists for foreign key constraint
    await prisma.user.upsert({
      where: { tenantId: "update-delete-tenant-id" },
      update: {},
      create: {
        email: "test-update@example.com",
        name: "Test User",
        tenantId: "update-delete-tenant-id",
      }
    });

    // Clean up test data
    await prisma.component.deleteMany({
      where: { course: { tenantId: "update-delete-tenant-id" } }
    });
    await prisma.course.deleteMany({
      where: { tenantId: "update-delete-tenant-id" }
    });
  });

  it("Property 1: Course CRUD Preservation & Optimistic Locking", async () => {
    // Simulate concurrent course updates from two sessions
    
    // 1. Create initial course
    const course = await prisma.course.create({
      data: {
        name: "Initial Course",
        sks: 3,
        targetGrade: "B",
        targetThreshold: 7000,
        tenantId: "update-delete-tenant-id",
      }
    });

    // Both "sessions" read the same course at version 1
    const session1Course = await getCourseById(course.id);
    const session2Course = await getCourseById(course.id);
    
    expect(session1Course.success).toBe(true);
    expect(session2Course.success).toBe(true);
    
    const v1 = session1Course.success ? session1Course.data?.version : 1;

    // Session 1 updates the course successfully
    const update1 = await updateCourse(course.id, {
      name: "Updated by Session 1",
      version: v1!,
    });
    
    // Assert first update succeeds
    expect(update1.success).toBe(true);
    if (!update1.success) throw new Error("Expected update1 to succeed");
    expect(update1.data!.name).toBe("Updated by Session 1");
    expect(update1.data!.version).toBe(v1! + 1);

    // Session 2 tries to update with the stale version
    const update2 = await updateCourse(course.id, {
      name: "Updated by Session 2",
      version: v1!, // Still using old version
    });
    
    // Assert second update returns 409 Conflict (represented by specific error message)
    expect(update2.success).toBe(false);
    if (update2.success) throw new Error("Expected update2 to fail");
    expect(update2.error).toContain("Concurrent modification");

    // Verify database contains only first update
    const finalCourse = await getCourseById(course.id);
    expect(finalCourse.success).toBe(true);
    if (!finalCourse.success) throw new Error("Expected finalCourse to exist");
    expect(finalCourse.data!.name).toBe("Updated by Session 1");
    expect(finalCourse.data!.version).toBe(v1! + 1);
  }, 30000);

  it("Property 2: Cascade Deletion Completeness", async () => {
    // 1. Create course with 5 components
    const course = await prisma.course.create({
      data: {
        name: "Course to Delete",
        sks: 3,
        targetGrade: "A",
        tenantId: "update-delete-tenant-id",
        components: {
          create: Array.from({ length: 5 }).map((_, i) => ({
            name: `Component ${i}`,
            weight: 2000,
            achievedScore: 8000,
          }))
        }
      }
    });

    // Verify components exist
    const initialComponents = await prisma.component.count({
      where: { courseId: course.id }
    });
    expect(initialComponents).toBe(5);

    // 2. Delete course via Server Action
    const result = await deleteCourse(course.id);
    expect(result.success).toBe(true);

    // 3. Query database for orphaned components
    const remainingComponents = await prisma.component.count({
      where: { courseId: course.id }
    });

    // 4. Assert zero orphaned records remain
    expect(remainingComponents).toBe(0);
  });
});
