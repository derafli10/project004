"use server";

import { Course } from "@prisma/client";
import { executeTransaction, Result } from "../transactions";
import { getTenantIdFromRequest } from "../server-context";
import { parseImportData } from "../import-parser";
import { mapTargetGradeToThreshold } from "../converters";

export async function importData(jsonString: string): Promise<Result<Course[]>> {
  try {
    const tenantId = await getTenantIdFromRequest();
    
    // Parse and validate the JSON
    const parseResult = parseImportData(jsonString);
    if (!parseResult.success) {
      return { success: false, error: parseResult.error };
    }
    
    const importDataPayload = parseResult.data!;
    
    return await executeTransaction(async (tx) => {
      // Get existing courses to check for duplicates
      const existingCourses = await tx.course.findMany({
        where: { tenantId },
        select: { name: true }
      });
      const existingNames = new Set(existingCourses.map(c => c.name.toLowerCase()));
      
      const createdCourses: Course[] = [];
      
      for (const courseData of importDataPayload.courses) {
        // Validation: no duplicate course names within tenant
        if (existingNames.has(courseData.name.toLowerCase())) {
          throw new Error(`Duplicate course name: ${courseData.name}`);
        }
        existingNames.add(courseData.name.toLowerCase());
        
        const targetThreshold = mapTargetGradeToThreshold(courseData.targetGrade);
        
        // Create course and components
        const course = await tx.course.create({
          data: {
            tenantId,
            name: courseData.name,
            sks: courseData.sks,
            targetGrade: courseData.targetGrade,
            targetThreshold,
            components: {
              create: courseData.components.map(comp => ({
                name: comp.name,
                weight: comp.weight,
                achievedScore: comp.achievedScore
              }))
            }
          }
        });
        
        createdCourses.push(course);
      }
      
      return createdCourses;
    });
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import data",
    };
  }
}
