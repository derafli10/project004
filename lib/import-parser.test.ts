import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseImportData } from './import-parser';

describe('Import Parser', () => {
  it('should successfully parse valid data', () => {
    const validData = {
      courses: [
        {
          name: 'Course A',
          sks: 3,
          targetGrade: 'A',
          components: [
            { name: 'Midterm', weight: 4000, achievedScore: 8500 },
            { name: 'Final', weight: 6000, achievedScore: null },
          ]
        }
      ]
    };
    
    const result = parseImportData(JSON.stringify(validData));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.courses).toHaveLength(1);
    }
  });

  // Task 18.5: Write property test for parser error reporting
  it('Property 15: Parser Error Reporting - invalid JSON structure', () => {
    // Generate malformed json string or missing fields
    const invalidJson = '{"courses": [{"name": "Course A", sks: 3}]}'; // Invalid syntax
    const result = parseImportData(invalidJson);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid JSON format');
    }
  });

  it('Property 15: Parser Error Reporting - descriptive error messages for validation', () => {
    const invalidDataMissingFields = {
      courses: [
        {
          name: 'Course A',
          targetGrade: 'A',
          components: []
        }
      ]
    };
    const result1 = parseImportData(JSON.stringify(invalidDataMissingFields));
    expect(result1.success).toBe(false);
    if (!result1.success) {
      expect(result1.error).toContain('Validation Error');
      expect(result1.error).toContain('courses.0.sks: Required');
      expect(result1.error).toContain('courses.0.components: Component weights must sum to 100.00%');
    }
  });

  it('Property 15: Parser Error Reporting - invalid weight sums', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9989 }), // Less than 10000 - 10 tolerance
        (weight1) => {
          const invalidData = {
            courses: [
              {
                name: 'Course A',
                sks: 3,
                targetGrade: 'A',
                components: [
                  { name: 'Midterm', weight: weight1, achievedScore: null },
                ]
              }
            ]
          };
          
          const result = parseImportData(JSON.stringify(invalidData));
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toContain('Component weights must sum to 100.00%');
          }
        }
      )
    );
  });
});
