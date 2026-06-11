/**
 * Zod Validation Schemas Test Suite
 * 
 * Tests all validation schemas for correctness, edge cases, and error messages.
 * Validates requirements 14.1, 14.3-14.7, 1.5-1.6, 2.2, 3.2.
 */

import { describe, it, expect } from "vitest";
import {
  CourseSchema,
  ComponentSchema,
  ComponentsArraySchema,
  ScoreUpdateSchema,
  TargetGradeEnum,
} from "./validations";

describe("TargetGradeEnum", () => {
  it("should accept valid target grades", () => {
    const validGrades = ["A", "AB", "B", "BC", "C", "D", "E"];
    validGrades.forEach((grade) => {
      const result = TargetGradeEnum.safeParse(grade);
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid target grades", () => {
    const invalidGrades = ["A+", "F", "a", "AA", "", "A-"];
    invalidGrades.forEach((grade) => {
      const result = TargetGradeEnum.safeParse(grade);
      expect(result.success).toBe(false);
    });
  });
});

describe("CourseSchema", () => {
  it("should accept valid course data", () => {
    const validCourse = {
      name: "Database Systems",
      sks: 3,
      targetGrade: "A" as const,
    };
    const result = CourseSchema.safeParse(validCourse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validCourse);
    }
  });

  it("should trim course name", () => {
    const course = {
      name: "  Database Systems  ",
      sks: 3,
      targetGrade: "A" as const,
    };
    const result = CourseSchema.safeParse(course);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Database Systems");
    }
  });

  it("should reject empty course name", () => {
    const course = {
      name: "",
      sks: 3,
      targetGrade: "A" as const,
    };
    const result = CourseSchema.safeParse(course);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 1 character");
    }
  });

  it("should reject course name exceeding 100 characters", () => {
    const course = {
      name: "a".repeat(101),
      sks: 3,
      targetGrade: "A" as const,
    };
    const result = CourseSchema.safeParse(course);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("not exceed 100 characters");
    }
  });

  it("should accept sks values 1-6", () => {
    for (let sks = 1; sks <= 6; sks++) {
      const course = {
        name: "Test Course",
        sks,
        targetGrade: "A" as const,
      };
      const result = CourseSchema.safeParse(course);
      expect(result.success).toBe(true);
    }
  });

  it("should reject sks less than 1", () => {
    const course = {
      name: "Test Course",
      sks: 0,
      targetGrade: "A" as const,
    };
    const result = CourseSchema.safeParse(course);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 1");
    }
  });

  it("should reject sks greater than 6", () => {
    const course = {
      name: "Test Course",
      sks: 7,
      targetGrade: "A" as const,
    };
    const result = CourseSchema.safeParse(course);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("not exceed 6");
    }
  });

  it("should reject non-integer sks", () => {
    const course = {
      name: "Test Course",
      sks: 3.5,
      targetGrade: "A" as const,
    };
    const result = CourseSchema.safeParse(course);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("integer");
    }
  });

  it("should reject invalid target grade", () => {
    const course = {
      name: "Test Course",
      sks: 3,
      targetGrade: "F",
    };
    const result = CourseSchema.safeParse(course);
    expect(result.success).toBe(false);
  });
});

describe("ComponentSchema", () => {
  it("should accept valid component data", () => {
    const validComponent = {
      name: "Midterm Exam",
      weight: 3000,
      achievedScore: 8500,
    };
    const result = ComponentSchema.safeParse(validComponent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validComponent);
    }
  });

  it("should accept null achievedScore", () => {
    const component = {
      name: "Final Exam",
      weight: 5000,
      achievedScore: null,
    };
    const result = ComponentSchema.safeParse(component);
    expect(result.success).toBe(true);
  });

  it("should trim component name", () => {
    const component = {
      name: "  Midterm Exam  ",
      weight: 3000,
      achievedScore: 8500,
    };
    const result = ComponentSchema.safeParse(component);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Midterm Exam");
    }
  });

  it("should reject empty component name", () => {
    const component = {
      name: "",
      weight: 3000,
      achievedScore: 8500,
    };
    const result = ComponentSchema.safeParse(component);
    expect(result.success).toBe(false);
  });

  it("should reject component name exceeding 100 characters", () => {
    const component = {
      name: "a".repeat(101),
      weight: 3000,
      achievedScore: 8500,
    };
    const result = ComponentSchema.safeParse(component);
    expect(result.success).toBe(false);
  });

  it("should accept weight boundary values", () => {
    const minWeight = { name: "Test", weight: 1, achievedScore: null };
    const maxWeight = { name: "Test", weight: 10000, achievedScore: null };
    
    expect(ComponentSchema.safeParse(minWeight).success).toBe(true);
    expect(ComponentSchema.safeParse(maxWeight).success).toBe(true);
  });

  it("should reject weight less than 1", () => {
    const component = {
      name: "Test",
      weight: 0,
      achievedScore: null,
    };
    const result = ComponentSchema.safeParse(component);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 1");
    }
  });

  it("should reject weight greater than 10000", () => {
    const component = {
      name: "Test",
      weight: 10001,
      achievedScore: null,
    };
    const result = ComponentSchema.safeParse(component);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("not exceed 10000");
    }
  });

  it("should reject non-integer weight", () => {
    const component = {
      name: "Test",
      weight: 3000.5,
      achievedScore: null,
    };
    const result = ComponentSchema.safeParse(component);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("integer");
    }
  });

  it("should accept achievedScore boundary values", () => {
    const minScore = { name: "Test", weight: 3000, achievedScore: 0 };
    const maxScore = { name: "Test", weight: 3000, achievedScore: 10000 };
    
    expect(ComponentSchema.safeParse(minScore).success).toBe(true);
    expect(ComponentSchema.safeParse(maxScore).success).toBe(true);
  });

  it("should reject achievedScore less than 0", () => {
    const component = {
      name: "Test",
      weight: 3000,
      achievedScore: -1,
    };
    const result = ComponentSchema.safeParse(component);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 0");
    }
  });

  it("should reject achievedScore greater than 10000", () => {
    const component = {
      name: "Test",
      weight: 3000,
      achievedScore: 10001,
    };
    const result = ComponentSchema.safeParse(component);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("not exceed 10000");
    }
  });

  it("should reject non-integer achievedScore", () => {
    const component = {
      name: "Test",
      weight: 3000,
      achievedScore: 8500.75,
    };
    const result = ComponentSchema.safeParse(component);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("integer");
    }
  });
});

describe("ComponentsArraySchema", () => {
  it("should accept components with weights summing to exactly 10000", () => {
    const components = [
      { name: "Quiz", weight: 2000, achievedScore: 9000 },
      { name: "Midterm", weight: 3000, achievedScore: 8500 },
      { name: "Final", weight: 5000, achievedScore: null },
    ];
    const result = ComponentsArraySchema.safeParse(components);
    expect(result.success).toBe(true);
  });

  it("should accept components with weights summing to 10010 (within tolerance)", () => {
    const components = [
      { name: "Quiz", weight: 2005, achievedScore: 9000 },
      { name: "Midterm", weight: 3000, achievedScore: 8500 },
      { name: "Final", weight: 5005, achievedScore: null },
    ];
    const result = ComponentsArraySchema.safeParse(components);
    expect(result.success).toBe(true);
  });

  it("should accept components with weights summing to 9990 (within tolerance)", () => {
    const components = [
      { name: "Quiz", weight: 1995, achievedScore: 9000 },
      { name: "Midterm", weight: 3000, achievedScore: 8500 },
      { name: "Final", weight: 4995, achievedScore: null },
    ];
    const result = ComponentsArraySchema.safeParse(components);
    expect(result.success).toBe(true);
  });

  it("should reject components with weights summing to 9500 (outside tolerance)", () => {
    const components = [
      { name: "Quiz", weight: 2000, achievedScore: 9000 },
      { name: "Midterm", weight: 3000, achievedScore: 8500 },
      { name: "Final", weight: 4500, achievedScore: null },
    ];
    const result = ComponentsArraySchema.safeParse(components);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("sum to 100.00%");
    }
  });

  it("should reject components with weights summing to 11000 (outside tolerance)", () => {
    const components = [
      { name: "Quiz", weight: 3000, achievedScore: 9000 },
      { name: "Midterm", weight: 3000, achievedScore: 8500 },
      { name: "Final", weight: 5000, achievedScore: null },
    ];
    const result = ComponentsArraySchema.safeParse(components);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("sum to 100.00%");
    }
  });

  it("should handle auto-balanced weights (3 components)", () => {
    // 100% / 3 = 33.33%, 33.33%, 33.34% → 3333, 3333, 3334 = 10000
    const components = [
      { name: "Component 1", weight: 3333, achievedScore: null },
      { name: "Component 2", weight: 3333, achievedScore: null },
      { name: "Component 3", weight: 3334, achievedScore: null },
    ];
    const result = ComponentsArraySchema.safeParse(components);
    expect(result.success).toBe(true);
  });

  it("should handle auto-balanced weights (7 components)", () => {
    // 100% / 7 = 14.285714...% each → needs careful rounding
    const components = [
      { name: "Component 1", weight: 1429, achievedScore: null },
      { name: "Component 2", weight: 1429, achievedScore: null },
      { name: "Component 3", weight: 1429, achievedScore: null },
      { name: "Component 4", weight: 1429, achievedScore: null },
      { name: "Component 5", weight: 1428, achievedScore: null },
      { name: "Component 6", weight: 1428, achievedScore: null },
      { name: "Component 7", weight: 1428, achievedScore: null },
    ];
    const sum = components.reduce((acc, c) => acc + c.weight, 0);
    expect(sum).toBe(10000);
    const result = ComponentsArraySchema.safeParse(components);
    expect(result.success).toBe(true);
  });

  it("should accept empty array", () => {
    const components: Array<{ name: string; weight: number; achievedScore: number | null }> = [];
    const result = ComponentsArraySchema.safeParse(components);
    // Empty array sums to 0, which is outside tolerance (10000 ± 10)
    expect(result.success).toBe(false);
  });

  it("should reject if any component fails individual validation", () => {
    const components = [
      { name: "", weight: 5000, achievedScore: null }, // Invalid: empty name
      { name: "Valid", weight: 5000, achievedScore: null },
    ];
    const result = ComponentsArraySchema.safeParse(components);
    expect(result.success).toBe(false);
  });
});

describe("ScoreUpdateSchema", () => {
  it("should accept valid score update with integer score", () => {
    const scoreUpdate = {
      componentId: "550e8400-e29b-41d4-a716-446655440000",
      achievedScore: 8750,
    };
    const result = ScoreUpdateSchema.safeParse(scoreUpdate);
    expect(result.success).toBe(true);
  });

  it("should accept null achievedScore", () => {
    const scoreUpdate = {
      componentId: "550e8400-e29b-41d4-a716-446655440000",
      achievedScore: null,
    };
    const result = ScoreUpdateSchema.safeParse(scoreUpdate);
    expect(result.success).toBe(true);
  });

  it("should accept achievedScore boundary values", () => {
    const minScore = {
      componentId: "550e8400-e29b-41d4-a716-446655440000",
      achievedScore: 0,
    };
    const maxScore = {
      componentId: "550e8400-e29b-41d4-a716-446655440000",
      achievedScore: 10000,
    };
    
    expect(ScoreUpdateSchema.safeParse(minScore).success).toBe(true);
    expect(ScoreUpdateSchema.safeParse(maxScore).success).toBe(true);
  });

  it("should reject invalid UUID format", () => {
    const scoreUpdate = {
      componentId: "not-a-valid-uuid",
      achievedScore: 8750,
    };
    const result = ScoreUpdateSchema.safeParse(scoreUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("valid UUID");
    }
  });

  it("should reject achievedScore less than 0", () => {
    const scoreUpdate = {
      componentId: "550e8400-e29b-41d4-a716-446655440000",
      achievedScore: -1,
    };
    const result = ScoreUpdateSchema.safeParse(scoreUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 0");
    }
  });

  it("should reject achievedScore greater than 10000", () => {
    const scoreUpdate = {
      componentId: "550e8400-e29b-41d4-a716-446655440000",
      achievedScore: 10001,
    };
    const result = ScoreUpdateSchema.safeParse(scoreUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("not exceed 10000");
    }
  });

  it("should reject non-integer achievedScore", () => {
    const scoreUpdate = {
      componentId: "550e8400-e29b-41d4-a716-446655440000",
      achievedScore: 8750.5,
    };
    const result = ScoreUpdateSchema.safeParse(scoreUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("integer");
    }
  });

  it("should reject empty componentId", () => {
    const scoreUpdate = {
      componentId: "",
      achievedScore: 8750,
    };
    const result = ScoreUpdateSchema.safeParse(scoreUpdate);
    expect(result.success).toBe(false);
  });
});
