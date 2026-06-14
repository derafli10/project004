import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { importData } from './import';
import { exportData } from './export';
import * as serverContext from '../server-context';

const prisma = new PrismaClient();

// Mock getTenantIdFromRequest
vi.mock('../server-context', () => ({
  getTenantIdFromRequest: vi.fn(),
}));

describe('Import-Export Round-Trip Integration', () => {
  const testTenantId = 'tenant-import-export-test';

  beforeEach(async () => {
    vi.mocked(serverContext.getTenantIdFromRequest).mockResolvedValue(testTenantId);
    
    // Ensure test user exists (required by courses_tenantId_fkey)
    await prisma.user.upsert({
      where: { tenantId: testTenantId },
      update: {},
      create: {
        email: 'import-export-test@example.com',
        name: 'Import Test User',
        tenantId: testTenantId,
      },
    });
    
    // Clean up before test
    await prisma.component.deleteMany({
      where: { course: { tenantId: testTenantId } },
    });
    await prisma.course.deleteMany({
      where: { tenantId: testTenantId },
    });
  });

  afterEach(async () => {
    // Clean up after test
    await prisma.component.deleteMany({
      where: { course: { tenantId: testTenantId } },
    });
    await prisma.course.deleteMany({
      where: { tenantId: testTenantId },
    });
    vi.clearAllMocks();
  });

  // Task 18.3: Property 14: Import-Export Round-Trip Preservation
  it('Property 14: Import-Export Round-Trip Preservation', async () => {
    // We will generate a valid course payload and simulate the round trip
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{0,49}$/).filter(s => s.trim().length >= 1), // Course name (must survive .trim().min(1))
        fc.integer({ min: 1, max: 6 }), // SKS
        fc.constantFrom('A', 'AB', 'B', 'BC', 'C', 'D', 'E'), // targetGrade
        fc.integer({ min: 1, max: 5000 }), // weight1
        fc.integer({ min: 0, max: 10000 }), // achievedScore1
        async (name, sks, targetGrade, weight1, achievedScore1) => {
          // Add a timestamp to avoid unique constraints if running multiple iterations
          const uniqueName = `${name}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const weight2 = 10000 - weight1;
          
          const initialData = {
            metadata: {
              tenantId: testTenantId,
              exportTimestamp: new Date().toISOString(),
              version: "1.0",
            },
            courses: [
              {
                name: uniqueName,
                sks,
                targetGrade,
                components: [
                  { name: 'Comp1', weight: weight1, achievedScore: achievedScore1 },
                  { name: 'Comp2', weight: weight2, achievedScore: null },
                ]
              }
            ]
          };

          // 1. Import JSON into system
          const importResult = await importData(JSON.stringify(initialData));
          expect(importResult.success).toBe(true);

          // 2. Export data to JSON
          const exportResult = await exportData();
          expect(exportResult.success).toBe(true);
          
          if (exportResult.success && exportResult.data) {
            const exportedJson = JSON.parse(exportResult.data);
            
            // Assert all fields preserved exactly
            expect(exportedJson.courses.length).toBeGreaterThanOrEqual(1);
            const exportedCourse = exportedJson.courses.find((c: any) => c.name === uniqueName);
            expect(exportedCourse).toBeDefined();
            expect(exportedCourse.sks).toBe(sks);
            expect(exportedCourse.targetGrade).toBe(targetGrade);
            
            // Check components
            const comp1 = exportedCourse.components.find((c: any) => c.name === 'Comp1');
            const comp2 = exportedCourse.components.find((c: any) => c.name === 'Comp2');
            
            expect(comp1.weight).toBe(weight1);
            expect(comp1.achievedScore).toBe(achievedScore1);
            
            expect(comp2.weight).toBe(weight2);
            expect(comp2.achievedScore).toBeNull();
          }
          
          // Cleanup this iteration to avoid duplicate names in next fast-check run
          await prisma.component.deleteMany({
            where: { course: { tenantId: testTenantId } },
          });
          await prisma.course.deleteMany({
            where: { tenantId: testTenantId },
          });
        }
      ),
      { numRuns: 5 } // Run a few iterations to verify property without taking too long
    );
  }, 30000);
});
