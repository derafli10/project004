"use server";

import { PrismaClient, Component } from "@prisma/client";
import { 
  ComponentsArraySchema, 
  ComponentsArrayInput,
  ScoreUpdateSchema,
  ScoreUpdateInput,
} from "../validations";
import { executeTransaction, Result } from "../transactions";
import { getTenantIdFromRequest } from "../server-context";
import { z } from "zod";
import { calculateCourseAnalytics } from "../analytics";

const prisma = new PrismaClient();
const UUIDSchema = z.string().uuid();

export async function saveComponents(
  courseId: string, 
  components: ComponentsArrayInput
): Promise<Result<Component[]>> {
  try {
    const tenantId = await getTenantIdFromRequest();
    UUIDSchema.parse(courseId);
    
    // Validate the components array and weight sum invariant
    const validatedComponents = ComponentsArraySchema.parse(components);

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tenantId: true },
    });

    if (!course || course.tenantId !== tenantId) {
      return { success: false, error: "Course not found or access denied" };
    }

    return await executeTransaction(async (tx) => {
      // Delete existing components for this course
      await tx.component.deleteMany({
        where: { courseId },
      });

      // Insert new components
      // Using createMany if available, or Promise.all with create
      const createdComponents = [];
      for (const comp of validatedComponents) {
        const created = await tx.component.create({
          data: {
            name: comp.name,
            weight: comp.weight,
            achievedScore: comp.achievedScore,
            courseId,
          },
        });
        createdComponents.push(created);
      }

      // Increment course version to handle optimistic locking
      await tx.course.update({
        where: { id: courseId },
        data: { version: { increment: 1 } },
      });

      return createdComponents;
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
      error: error instanceof Error ? error.message : "Failed to save components",
    };
  }
}

export async function updateComponentScore(
  data: ScoreUpdateInput
): Promise<Result<Component>> {
  try {
    const tenantId = await getTenantIdFromRequest();
    const validatedData = ScoreUpdateSchema.parse(data);

    // Verify tenant ownership via course relation
    const component = await prisma.component.findUnique({
      where: { id: validatedData.componentId },
      include: { course: true },
    });

    if (!component || component.course.tenantId !== tenantId) {
      return { success: false, error: "Component not found or access denied" };
    }

    return await executeTransaction(async (tx) => {
      const updatedComponent = await tx.component.update({
        where: { id: validatedData.componentId },
        data: {
          achievedScore: validatedData.achievedScore,
          version: { increment: 1 },
        },
        include: {
          course: {
            include: {
              components: true,
            }
          }
        }
      });

      // Recalculate analytics to verify logic (or to trigger notifications later in task 8)
      // For now, we just perform the calculation as required by 7.3 "Trigger analytics recalculation"
      const allComponents = updatedComponent.course.components;
      const targetThreshold = updatedComponent.course.targetThreshold;
      // Analytics recalculation as required by 7.3 - will be used in task 8 for notification triggers
      void calculateCourseAnalytics(allComponents, targetThreshold);

      // Return just the component to match Result<Component>
      // The analytics can be used later to trigger notifications if alertLevel is DANGER
      const { course, ...componentWithoutCourse } = updatedComponent;
      return componentWithoutCourse;
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
      error: error instanceof Error ? error.message : "Failed to update component score",
    };
  }
}

export async function deleteComponent(componentId: string): Promise<Result<void>> {
  try {
    const tenantId = await getTenantIdFromRequest();
    UUIDSchema.parse(componentId);

    // Verify ownership
    const component = await prisma.component.findUnique({
      where: { id: componentId },
      include: { course: { include: { components: true } } },
    });

    if (!component || component.course.tenantId !== tenantId) {
      return { success: false, error: "Component not found or access denied" };
    }

    // Check remaining components still sum to 10000 after deletion
    const remainingComponents = component.course.components.filter(c => c.id !== componentId);
    const remainingSum = remainingComponents.reduce((sum, c) => sum + c.weight, 0);

    // The tolerance is ±10
    if (Math.abs(remainingSum - 10000) > 10) {
      return { 
        success: false, 
        error: "Cannot delete component: remaining components must sum to 100.00%. Please rebalance weights." 
      };
    }

    return await executeTransaction(async (tx) => {
      await tx.component.delete({
        where: { id: componentId },
      });

      // Update course version
      await tx.course.update({
        where: { id: component.courseId },
        data: { version: { increment: 1 } },
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid component ID" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete component",
    };
  }
}
