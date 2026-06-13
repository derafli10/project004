# Technical Design Document: Project004 - Grade Optimizer & KPI Dashboard

## Overview

**Project004** is an enterprise-scale Academic Performance Management System built for Computer Engineering Technology students at IPB University. The system provides real-time grading parameter transparency with predictive analytics to enable students to achieve a perfect 4.00 GPA by identifying and mitigating academic drop risks from Week 1 of the semester.

### Design Philosophy

This design adheres to a **zero-compromise quality mandate** where every architectural decision prioritizes correctness, security, and performance over development convenience. The system implements four mandatory architectural guardrails that permeate every layer of the application:

1. **Integer-Based Precision Mathematics** - Eliminates floating-point errors
2. **Strict Multi-Tenant Data Isolation** - Prevents cross-tenant data leakage
3. **Industrial Brutalist Design System** - Maximizes information clarity
4. **Production-Ready Code Standards** - Zero placeholders, complete implementations

### Technology Stack

- **Framework**: Next.js 15+ (App Router, React Server Components, Server Actions)
- **Language**: TypeScript 5+ (strict mode, no implicit any)
- **Database**: PostgreSQL 16+ with row-level security
- **ORM**: Prisma 5+ with typed query builder
- **Styling**: Tailwind CSS 3+ with custom brutalist tokens
- **Validation**: Zod 3+ for runtime type safety
- **State Management**: React Hooks (useOptimistic) + Zustand for complex state
- **Testing**: Vitest for unit tests, property-based testing with fast-check

### Key Design Decisions

1. **Server-First Architecture**: Leverage React Server Components to minimize client-side JavaScript and improve initial page load performance.

2. **Integer Arithmetic Throughout**: Store all percentages and scores as integers (0-10000) in the database, performing all calculations in integer space, and converting to decimals only at the presentation layer.

3. **Session-Based Multi-Tenancy**: Extract tenantId from authenticated session on every request, never trust client-provided tenantId values.

4. **Optimistic UI with Reconciliation**: Use React's useOptimistic hook for instant feedback while maintaining server authority for all data mutations.

5. **Transaction-First Data Layer**: Wrap all mutations in ACID-compliant PostgreSQL transactions with automatic rollback on constraint violations.

6. **Type-Safe API Contracts**: Generate TypeScript types from Prisma schema, validate all inputs with Zod, return discriminated union Result types from Server Actions.

---

## Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Client                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Dashboard UI │  │ Course Detail│  │ Component Matrix │  │
│  │  (RSC + CC)  │  │  (RSC + CC)  │  │   (Client Comp)  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────────┬───────────────┬───────────────┬────────────────┘
             │               │               │
             │ HTTPS         │ HTTPS         │ HTTPS
             │ (Server       │ (Server       │ (Server
             │  Actions)     │  Actions)     │  Actions)
             ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 App Server                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Middleware (Session + TenantId)            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Server     │  │   Analytics  │  │   Validation     │  │
│  │   Actions    │  │   Engine     │  │   Layer (Zod)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Prisma Client (Type-Safe ORM)               │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬─────────────────────────────────────────────────┘
             │
             │ Connection Pool (10-50 connections)
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (ACID)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   User      │  │   Course    │  │   Component         │ │
│  │   Table     │  │   Table     │  │   Table             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Composite Indexes: (tenantId, createdAt)           │    │
│  │                     (courseId, weight)               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Layered Architecture

The system follows a strict layered architecture with clear separation of concerns:

**Layer 1: Presentation Layer (Browser)**
- React Server Components for initial page load
- Client Components for interactive forms with useOptimistic
- Brutalist design system with Tailwind utility classes
- Accessibility features (ARIA labels, keyboard navigation, focus management)

**Layer 2: Application Layer (Next.js Server)**
- Server Actions as API endpoints (type-safe, no REST boilerplate)
- Session validation middleware
- Business logic in pure TypeScript functions
- Analytics calculation engine (integer arithmetic)

**Layer 3: Data Access Layer (Prisma ORM)**
- Prisma Client for type-safe database queries
- Transaction management with automatic rollback
- Multi-tenant filtering on every query
- Optimistic locking with version fields

**Layer 4: Persistence Layer (PostgreSQL)**
- ACID-compliant relational database
- Foreign key constraints for referential integrity
- Composite indexes for query performance
- Row-level security policies (future enhancement)

### Data Flow Patterns

**Pattern 1: Server Component Data Fetching**
```
User Request → Middleware (validate session) → Server Component
→ Server Action (extract tenantId) → Prisma Query (filter by tenantId)
→ Return Data → Render HTML → Stream to Browser
```

**Pattern 2: Optimistic Mutation**
```
User Action → Client Component (useOptimistic update)
→ Instant UI Update → Server Action (validate + mutate)
→ Database Transaction → Commit/Rollback
→ Return Result → Reconcile Optimistic State
→ Revert on Error OR Confirm on Success
```

**Pattern 3: Real-Time Calculation**
```
Score Update → Debounce (300ms) → Analytics Engine
→ calculateCumulativeActual → calculateRequiredScore
→ calculateAlertLevel → Update UI (< 200ms total)
```

---

## Components and Interfaces

### Core Domain Models

#### User Model
Represents authenticated users with tenant isolation.

```typescript
// Generated from Prisma schema
interface User {
  id: string;                // UUID primary key
  email: string;             // Unique, indexed
  name: string;              // Display name
  tenantId: string;          // Unique tenant identifier
  createdAt: Date;
  updatedAt: Date;
}
```

#### Course Model
Represents academic courses with grading configuration.

```typescript
// Generated from Prisma schema
interface Course {
  id: string;                // UUID primary key
  name: string;              // Course name (e.g., "Database Systems")
  sks: number;               // Credits (1-6)
  targetGrade: TargetGrade;  // Enum: A, AB, B, BC, C, D, E
  targetThreshold: number;   // Integer: 8000 for 'A' (80.00%)
  tenantId: string;          // Foreign key to User, indexed
  version: number;           // Optimistic locking counter
  createdAt: Date;
  updatedAt: Date;
  components: Component[];   // One-to-many relation
}

enum TargetGrade {
  A = "A",
  AB = "AB",
  B = "B",
  BC = "BC",
  C = "C",
  D = "D",
  E = "E"
}
```

#### Component Model
Represents grading components within a course.

```typescript
// Generated from Prisma schema
interface Component {
  id: string;                // UUID primary key
  name: string;              // Component name (e.g., "Midterm Exam")
  weight: number;            // Integer: 0-10000 (0.00% - 100.00%)
  achievedScore: number | null; // Integer: 0-10000, nullable
  courseId: string;          // Foreign key to Course
  version: number;           // Optimistic locking counter
  createdAt: Date;
  updatedAt: Date;
  course: Course;            // Many-to-one relation
}
```

#### Notification Model
Represents alert notifications for grade risks.

```typescript
// Generated from Prisma schema
interface Notification {
  id: string;                // UUID primary key
  courseId: string;          // Foreign key to Course
  tenantId: string;          // Foreign key to User, indexed
  alertLevel: AlertLevel;    // Enum: NORMAL, WARNING, DANGER
  message: string;           // Notification content
  isRead: boolean;           // Read status
  createdAt: Date;
}

enum AlertLevel {
  NORMAL = "NORMAL",
  WARNING = "WARNING",
  DANGER = "DANGER"
}
```

### Calculated Analytics Types

These types represent computed values from the analytics engine:

```typescript
interface CourseAnalytics {
  courseId: string;
  cumulativeActual: number;    // Decimal: 0.00 - 100.00
  requiredScore: number | null; // Decimal: can be > 100 or negative
  remainingWeight: number;      // Decimal: 0.00 - 100.00
  alertLevel: AlertLevel;
  isTargetAchievable: boolean;
}

interface ComponentProgress {
  componentId: string;
  name: string;
  weight: number;              // Decimal: 0.00 - 100.00
  achievedScore: number | null; // Decimal: 0.00 - 100.00
  isCompleted: boolean;
  contributionToTotal: number; // Decimal: weighted score
}
```

### Result Type for Server Actions

All Server Actions return a discriminated union for type-safe error handling:

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// Usage examples:
type CourseResult = Result<Course>;
type CoursesResult = Result<Course[]>;
type VoidResult = Result<void>;
```

### Server Action Interfaces

#### Course Management Actions

```typescript
// /app/actions/courses.ts
"use server";

/**
 * Create a new course for the authenticated user.
 * Validates session, extracts tenantId, validates input with Zod.
 * @returns Result containing the created course or error
 */
async function createCourse(
  data: {
    name: string;
    sks: number;
    targetGrade: TargetGrade;
  }
): Promise<Result<Course>>;

/**
 * Get all courses for the authenticated user.
 * Automatically filters by session tenantId.
 * @returns Result containing array of courses or error
 */
async function getCourses(): Promise<Result<Course[]>>;

/**
 * Get a single course with all components and analytics.
 * Validates tenantId ownership.
 * @param courseId - UUID of the course
 * @returns Result containing course with components or error
 */
async function getCourseById(
  courseId: string
): Promise<Result<Course & { analytics: CourseAnalytics }>>;

/**
 * Update course properties.
 * Uses optimistic locking to prevent concurrent modification.
 * @param courseId - UUID of the course
 * @param data - Partial course data to update
 * @returns Result containing updated course or error
 */
async function updateCourse(
  courseId: string,
  data: Partial<Pick<Course, "name" | "sks" | "targetGrade">>
): Promise<Result<Course>>;

/**
 * Delete a course and cascade delete all components.
 * Wrapped in transaction with automatic rollback on error.
 * @param courseId - UUID of the course
 * @returns Result indicating success or error
 */
async function deleteCourse(courseId: string): Promise<Result<void>>;
```

#### Component Management Actions

```typescript
// /app/actions/components.ts
"use server";

/**
 * Save all components for a course.
 * Validates that weights sum to 10000 (±10 tolerance).
 * Uses transaction to ensure atomicity.
 * @param courseId - UUID of the course
 * @param components - Array of component data
 * @returns Result containing saved components or error
 */
async function saveComponents(
  courseId: string,
  components: Array<{
    id?: string; // Undefined for new components
    name: string;
    weight: number; // Integer: 0-10000
    achievedScore: number | null; // Integer: 0-10000
  }>
): Promise<Result<Component[]>>;

/**
 * Update achieved score for a single component.
 * Triggers real-time analytics recalculation.
 * @param componentId - UUID of the component
 * @param achievedScore - Integer score 0-10000, null to clear
 * @returns Result containing updated component or error
 */
async function updateComponentScore(
  componentId: string,
  achievedScore: number | null
): Promise<Result<Component>>;

/**
 * Delete a single component.
 * Validates remaining components still sum to 10000.
 * @param componentId - UUID of the component
 * @returns Result indicating success or error
 */
async function deleteComponent(componentId: string): Promise<Result<void>>;
```

#### Notification Actions

```typescript
// /app/actions/notifications.ts
"use server";

/**
 * Get all notifications for the authenticated user.
 * Filters by session tenantId, orders by createdAt DESC.
 * @returns Result containing notifications or error
 */
async function getNotifications(): Promise<Result<Notification[]>>;

/**
 * Mark a notification as read.
 * Validates tenantId ownership.
 * @param notificationId - UUID of the notification
 * @returns Result indicating success or error
 */
async function markNotificationRead(
  notificationId: string
): Promise<Result<void>>;

/**
 * Mark all notifications as read.
 * Filters by session tenantId.
 * @returns Result indicating success or error
 */
async function markAllNotificationsRead(): Promise<Result<void>>;
```

### Utility Module Interfaces

#### Analytics Engine

```typescript
// /lib/analytics.ts

/**
 * Calculate cumulative actual score for a course.
 * Formula: Sum of (achievedScore * weight) for non-null scores.
 * @param components - Array of components with integer values
 * @returns Decimal cumulative score (0.00 - 100.00+)
 */
export function calculateCumulativeActual(
  components: Array<{ weight: number; achievedScore: number | null }>
): number;

/**
 * Calculate required score for remaining components.
 * Formula: (targetThreshold - cumulativeActual) / (remainingWeight / 100)
 * @param components - Array of components with integer values
 * @param targetThreshold - Integer target (e.g., 8000 for 80.00%)
 * @returns Decimal required score or null if no remaining weight
 */
export function calculateRequiredScore(
  components: Array<{ weight: number; achievedScore: number | null }>,
  targetThreshold: number
): number | null;

/**
 * Determine alert level based on required score.
 * DANGER: > 100.00, WARNING: 90.00-100.00, NORMAL: < 90.00
 * @param requiredScore - Decimal required score or null
 * @returns Alert level enum
 */
export function calculateAlertLevel(
  requiredScore: number | null
): AlertLevel;

/**
 * Calculate complete analytics for a course.
 * Single-pass optimization for all metrics.
 * @param components - Array of components with integer values
 * @param targetThreshold - Integer target (e.g., 8000)
 * @returns Complete analytics object
 */
export function calculateCourseAnalytics(
  components: Array<{ weight: number; achievedScore: number | null }>,
  targetThreshold: number
): CourseAnalytics;
```

#### Conversion Utilities

```typescript
// /lib/converters.ts

/**
 * Convert decimal percentage to integer storage format.
 * @param decimal - Decimal value (e.g., 85.50)
 * @returns Integer value (e.g., 8550)
 */
export function toInteger(decimal: number): number;

/**
 * Convert integer storage format to decimal percentage.
 * @param integer - Integer value (e.g., 8550)
 * @returns Decimal value (e.g., 85.50)
 */
export function toDecimal(integer: number): number;

/**
 * Format integer as percentage string.
 * @param integer - Integer value (e.g., 8550)
 * @returns Formatted string (e.g., "85.50%")
 */
export function formatPercentage(integer: number): string;

/**
 * Format integer as decimal score string.
 * @param integer - Integer value (e.g., 8550)
 * @returns Formatted string (e.g., "85.50")
 */
export function formatScore(integer: number): string;
```

#### Validation Schemas

```typescript
// /lib/validations.ts
import { z } from "zod";

/** Validates course creation/update data */
export const CourseSchema = z.object({
  name: z.string().min(1).max(100),
  sks: z.number().int().min(1).max(6),
  targetGrade: z.enum(["A", "AB", "B", "BC", "C", "D", "E"]),
});

/** Validates single component data */
export const ComponentSchema = z.object({
  name: z.string().min(1).max(100),
  weight: z.number().int().min(1).max(10000),
  achievedScore: z.number().int().min(0).max(10000).nullable(),
});

/** Validates array of components with weight sum check */
export const ComponentsArraySchema = z
  .array(ComponentSchema)
  .refine(
    (components) => {
      const sum = components.reduce((acc, c) => acc + c.weight, 0);
      return Math.abs(sum - 10000) <= 10; // ±10 tolerance (0.10%)
    },
    { message: "Component weights must sum to 100.00% (±0.10% tolerance)" }
  );

/** Validates score update data */
export const ScoreUpdateSchema = z.object({
  componentId: z.string().uuid(),
  achievedScore: z.number().int().min(0).max(10000).nullable(),
});
```

#### Transaction Utilities

```typescript
// /lib/transactions.ts
import { PrismaClient } from "@prisma/client";

/**
 * Execute a database operation within an ACID transaction.
 * Automatically rolls back on error and returns typed Result.
 * @param fn - Async function receiving Prisma transaction client
 * @returns Result containing data or error
 */
export async function executeTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<Result<T>>;
```

---

## Data Models

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  name          String
  tenantId      String         @unique
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  courses       Course[]
  notifications Notification[]

  @@index([tenantId])
  @@map("users")
}

model Course {
  id              String         @id @default(uuid())
  name            String
  sks             Int            // Credits: 1-6
  targetGrade     TargetGrade    @default(A)
  targetThreshold Int            @default(8000) // 80.00% for grade 'A'
  tenantId        String
  version         Int            @default(1)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  user            User           @relation(fields: [tenantId], references: [tenantId], onDelete: Cascade)
  components      Component[]
  notifications   Notification[]

  @@index([tenantId, createdAt])
  @@map("courses")
}

model Component {
  id             String   @id @default(uuid())
  name           String
  weight         Int      // 0-10000 representing 0.00% - 100.00%
  achievedScore  Int?     // 0-10000 representing 0.00 - 100.00, nullable
  courseId       String
  version        Int      @default(1)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  course         Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@index([courseId, weight])
  @@map("components")
}

model Notification {
  id         String     @id @default(uuid())
  courseId   String
  tenantId   String
  alertLevel AlertLevel
  message    String
  isRead     Boolean    @default(false)
  createdAt  DateTime   @default(now())
  course     Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user       User       @relation(fields: [tenantId], references: [tenantId], onDelete: Cascade)

  @@index([tenantId, isRead, createdAt])
  @@map("notifications")
}

enum TargetGrade {
  A
  AB
  B
  BC
  C
  D
  E
}

enum AlertLevel {
  NORMAL
  WARNING
  DANGER
}
```

### Database Indexes Strategy

**Primary Indexes:**
- All tables have UUID primary keys (`@id`)
- `User.email` unique index for authentication lookups
- `User.tenantId` unique index for session resolution

**Performance Indexes:**
- `Course(tenantId, createdAt)` - Optimizes dashboard queries filtering by tenant and ordering by date
- `Component(courseId, weight)` - Optimizes component fetching and weight sum calculations
- `Notification(tenantId, isRead, createdAt)` - Optimizes unread notification queries

**Why These Indexes:**
1. The `tenantId` prefix ensures partition pruning for multi-tenant queries
2. The `createdAt` suffix supports DESC ordering without additional sort
3. The `weight` inclusion enables covering index optimization for sum calculations
4. The `isRead` inclusion supports fast unread notification counts

### Integer Storage Mappings

|           Concept          | Display Format |      Database Storage     |   Prisma Type   |
|----------------------------|----------------|---------------------------|-----------------|
| Component Weight           | 25.00%         | 2500                      | Int             |
| Achieved Score             | 85.75%         | 8575                      | Int             |
| Target Threshold (Grade A) | 80.00%         | 8000                      | Int             |
| Cumulative Actual          | 65.50%         | Calculated from integers, |                 |
|                            |                | displayed as decimal.     | N/A (computed)  |
| Required Score             | 92.33          | Calculated from integers, |                 |
|                            |                | displayed as decimal.     | N/A (computed)  |

### Constraint Enforcement

**Database-Level Constraints:**
- Foreign key constraints ensure referential integrity (Course → User, Component → Course)
- Cascade delete ensures orphaned components are automatically removed
- NOT NULL constraints on required fields (name, weight, tenantId)
- Enum constraints restrict targetGrade and alertLevel to valid values

**Application-Level Constraints:**
- Zod schemas validate input ranges before database operations
- Component weight sum validation (must equal 10000 ±10)
- SKS credit range validation (1-6)
- Score range validation (0-10000)
- TenantId ownership validation on all mutations

---


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all 25 requirements and their acceptance criteria, I've identified the following testable properties. This reflection eliminates redundancy by combining related properties and focusing on unique validation value:

**Consolidated Properties:**
- **Weight Sum Validation** (Req 2.3, 2.5, 2.6, 14.4) - All weight-related validation can be tested with one comprehensive property
- **Score Range Validation** (Req 3.2, 14.5) - Combined into single input validation property
- **Calculation Properties** (Req 4.1, 4.3, 5.1, 5.3, 5.4) - Grouped into analytics calculation properties
- **Alert Classification** (Req 6.1, 6.2, 6.3) - Single property tests all alert level thresholds
- **Multi-Tenant Isolation** (Req 7.2, 7.3, 7.4, 8.4, 17.4) - One comprehensive isolation property
- **Serialization Round-Trip** (Req 18.4) - Classic round-trip property for import/export

**Eliminated Redundancies:**
- Requirements 1.3 (partial updates) is subsumed by 1.1 (full CRUD testing)
- Requirements 4.2, 5.2, 5.5, 6.4, 24.1, 24.2 (edge cases) are covered by main calculation properties with null/boundary inputs
- Requirements 2.4 (weight sum calculation) is covered by 2.3 (weight sum validation)
- Requirements 1.2 (default target grade) is a specific case of 1.1 (course creation)

### Property 1: Course CRUD Preservation

*For any* valid course data (name, SKS 1-6, target grade A-E), creating then retrieving the course SHALL return equivalent data with all fields preserved, including default target grade "A" when not specified and correct integer storage of targetThreshold (8000 for grade "A").

**Validates: Requirements 1.1, 1.2, 2.1, 3.1**

### Property 2: Cascade Deletion Completeness

*For any* course with any number of associated components (0 to 1000), deleting the course SHALL remove all associated components from the database with no orphaned records remaining.

**Validates: Requirements 1.4**

### Property 3: Input Range Validation

*For any* integer value, the system SHALL accept values within valid ranges (SKS: 1-6, weight: 1-10000, score: 0-10000) and reject values outside these ranges with descriptive validation errors.

**Validates: Requirements 1.5, 2.2, 3.2, 14.5**

### Property 4: Enum Validation

*For any* string value, the system SHALL accept only valid enum members (TargetGrade: A, AB, B, BC, C, D, E; AlertLevel: NORMAL, WARNING, DANGER) and reject all other values with validation errors.

**Validates: Requirements 1.6**

### Property 5: Component Weight Sum Invariant

*For any* array of components belonging to the same course, the system SHALL reject saving if the sum of component weights does not equal 10000 (±10 tolerance), and this validation SHALL be enforced on initial save, weight updates, and component deletions.

**Validates: Requirements 2.3, 2.5, 2.6, 14.4, 18.5, 24.3**

### Property 6: Cumulative Actual Calculation Correctness

*For any* set of components with integer weights and nullable integer achieved scores, the cumulative actual score SHALL equal the sum of (achievedScore / 100) × (weight / 100) for all non-null scores, with the result rounded to two decimal places, and SHALL return 0.00 when all scores are null.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 7: Required Score Calculation Correctness

*For any* course with target threshold T and components producing cumulative actual C, the required score SHALL equal (T / 100 - C) / (remainingWeight / 100) when remainingWeight > 0, SHALL return null when remainingWeight equals 0, SHALL allow negative values when C exceeds T, and SHALL be rounded to two decimal places.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 24.1, 24.2**

### Property 8: Alert Level Classification

*For any* required score value R (including null and negative), the system SHALL classify alert level as DANGER when R > 100.00, WARNING when 90.00 ≤ R ≤ 100.00, and NORMAL when R < 90.00, R is null, or R is negative.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 9: Multi-Tenant Data Isolation

*For any* two distinct tenant IDs T1 and T2, a user authenticated with tenant ID T1 SHALL never retrieve, modify, or delete data belonging to tenant ID T2 through any query or mutation, and all database operations SHALL automatically filter by the session's tenantId.

**Validates: Requirements 1.7, 7.1, 7.2, 7.3, 7.4, 8.4, 17.4, 18.7**

### Property 10: Transaction Rollback on Constraint Violation

*For any* mutation that violates a validation constraint (weight sum ≠ 10000, duplicate course name within tenant, invalid foreign key), the entire database transaction SHALL rollback with no partial changes persisted, and a descriptive error message SHALL be returned.

**Validates: Requirements 9.2, 9.3, 9.5**

### Property 11: Integer-Decimal Conversion Round-Trip

*For any* decimal value D in the range [0.00, 100.00], converting to integer storage format (D × 100), storing in database, then converting back to decimal (I / 100) SHALL produce a value equal to D rounded to two decimal places, with no accumulation of floating-point precision errors.

**Validates: Guardrail 1 - Integer-Based Precision Mathematics**

### Property 12: Calculation Performance Under Load

*For any* course with up to 20 components, recalculating cumulative actual, required score, and alert level SHALL complete within 200 milliseconds when using integer arithmetic throughout and converting to decimal only for display.

**Validates: Requirements 4.4, 5.6 (Note: This is a performance property, tested differently than functional properties)**

### Property 13: Export Data Completeness

*For any* tenant's complete data set (all courses, components, scores), the exported JSON SHALL contain all course records, all component records, all calculated fields (cumulative actual, required score, alert level), export metadata (timestamp, tenantId), and SHALL contain only data belonging to the requesting tenant.

**Validates: Requirements 17.1, 17.2, 17.3, 17.4**

### Property 14: Import-Export Round-Trip Preservation

*For any* valid collection of courses and components, serializing to JSON then deserializing SHALL produce an equivalent data structure with all course names, SKS values, target grades, component names, weights, and achieved scores preserved exactly.

**Validates: Requirements 18.1, 18.3, 18.4**

### Property 15: Parser Error Reporting

*For any* invalid JSON import file (malformed JSON, missing required fields, invalid field types), the parser SHALL reject the import and return a descriptive error message indicating the specific validation failure without creating any partial database records.

**Validates: Requirements 18.2, 18.6**

### Property 16: Pagination Consistency

*For any* tenant with N courses where N > 50, requesting paginated course listings SHALL return consistent results with no duplicates across pages, no missing courses, and each page containing the correct number of courses (page_size) except the final page.

**Validates: Requirements 11.6**

### Property 17: Null and Empty Input Rejection

*For any* required string field, the system SHALL reject null, undefined, and empty string ("") inputs with validation errors indicating the field is required, and SHALL accept non-empty strings within length constraints.

**Validates: Requirements 24.6**

### Property 18: Boundary Value Validation

*For any* extremely large number exceeding the valid integer range (values > 10000 for weights/scores), the system SHALL reject the input with a range validation error before database storage.

**Validates: Requirements 24.4**

### Property 19: Optimistic Update Reconciliation

*For any* component score update, the UI SHALL display the optimistic value immediately (within 50ms), submit the update to the server in the background, and reconcile the optimistic state with the server response by either confirming the change on success or reverting to the previous value on error.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 20: Validation Error Structure

*For any* input validation failure, the system SHALL return a structured error response containing a boolean success field (false), an error message string, and optionally a fieldErrors object mapping field names to arrays of error messages for that field.

**Validates: Requirements 14.6, 16.1**

---

## Error Handling

### Error Classification Strategy

The system implements a layered error handling strategy with distinct approaches for each layer:

**Layer 1: Input Validation Errors (HTTP 400)**
- **Trigger**: Zod schema validation failures, range violations, constraint violations
- **Handling**: Return structured Result<T> with success: false, descriptive error message, field-level error details
- **User Impact**: Immediate feedback with specific correction guidance
- **Example**: "Component weights must sum to 100.00% (currently 95.50%)"

**Layer 2: Authorization Errors (HTTP 403)**
- **Trigger**: TenantId mismatch, cross-tenant access attempts
- **Handling**: Return 403 Forbidden with generic message, log attempt with full context for security audit
- **User Impact**: Access denied message without exposing tenant IDs
- **Example**: "You do not have permission to access this resource"

**Layer 3: Authentication Errors (HTTP 401)**
- **Trigger**: Missing or invalid session token, expired session
- **Handling**: Return 401 Unauthorized, clear session cookie, redirect to login
- **User Impact**: Redirect to login page with "Session expired" message
- **Example**: "Your session has expired. Please log in again."

**Layer 4: Business Logic Errors (HTTP 422)**
- **Trigger**: Valid input but invalid business operation (e.g., delete component causing weight sum ≠ 100%)
- **Handling**: Return 422 Unprocessable Entity with explanation of why operation cannot proceed
- **User Impact**: Clear explanation of business rule violation
- **Example**: "Cannot delete component: remaining components would sum to 75.00%, must equal 100.00%"

**Layer 5: Database Errors (HTTP 500)**
- **Trigger**: Connection failures, constraint violations, transaction rollback
- **Handling**: Rollback transaction, log full error with stack trace and context, return generic user-facing error
- **User Impact**: Generic error message, retry prompt
- **Example**: "An error occurred while saving your data. Please try again."
- **Logging**: Full error details with sanitized sensitive data

**Layer 6: Calculation Errors (Safe Defaults)**
- **Trigger**: Division by zero, NaN, Infinity from calculations
- **Handling**: Return safe default values (null for required score when division by zero, "N/A" for display)
- **User Impact**: Graceful degradation with informative placeholders
- **Example**: Required Score displays "Target Achieved" when remainingWeight = 0

### Error Handling Patterns

#### Server Action Error Pattern

```typescript
// Standard Server Action error handling
async function createCourse(data: CreateCourseInput): Promise<Result<Course>> {
  try {
    // 1. Extract and validate session
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Authentication required" };
    }

    // 2. Validate input with Zod
    const validated = CourseSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: "Invalid input",
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    // 3. Execute business logic in transaction
    const result = await executeTransaction(async (tx) => {
      // Convert decimal to integer for storage
      const targetThreshold = getThresholdForGrade(validated.data.targetGrade);

      return await tx.course.create({
        data: {
          ...validated.data,
          targetThreshold,
          tenantId: session.tenantId,
        },
      });
    });

    return result;
  } catch (error) {
    // 4. Log and return user-safe error
    logError("createCourse", error, { tenantId: session?.tenantId });
    return {
      success: false,
      error: "Failed to create course. Please try again.",
    };
  }
}
```

#### Transaction Rollback Pattern

```typescript
// Transaction wrapper with automatic rollback
export async function executeTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<Result<T>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      return await fn(tx);
    });
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known Prisma errors
      if (error.code === "P2002") {
        return {
          success: false,
          error: "A record with this value already exists",
        };
      }
      if (error.code === "P2003") {
        return {
          success: false,
          error: "Referenced record does not exist",
        };
      }
    }
    // Log and return generic error
    logError("transaction", error);
    return { success: false, error: "Database operation failed" };
  }
}
```

#### Calculation Safe Default Pattern

```typescript
// Safe calculation with edge case handling
export function calculateRequiredScore(
  components: Component[],
  targetThreshold: number
): number | null {
  const cumulativeActual = calculateCumulativeActual(components);
  const remainingWeight = components
    .filter((c) => c.achievedScore === null)
    .reduce((sum, c) => sum + c.weight, 0);

  // Edge case: No remaining components
  if (remainingWeight === 0) {
    return null; // Display as "Target Achieved"
  }

  // Calculate required score
  const required =
    (targetThreshold / 100 - cumulativeActual) / (remainingWeight / 10000);

  // Allow negative (target exceeded) and > 100 (unachievable)
  return Math.round(required * 100) / 100; // Round to 2 decimals
}
```

### Error Logging Strategy

**Structured Logging Format:**
```typescript
interface LogEntry {
  timestamp: string; // ISO 8601
  level: "info" | "warn" | "error" | "fatal";
  context: string; // Function/module name
  message: string; // Human-readable description
  tenantId?: string; // For multi-tenant context
  userId?: string; // For user-specific context
  error?: {
    name: string;
    message: string;
    stack: string;
  };
  metadata?: Record<string, unknown>; // Additional context
}
```

**Sensitive Data Sanitization:**
- Passwords, tokens, session IDs removed before logging
- Email addresses truncated to first 3 characters + domain
- Personal data replaced with placeholders
- Full data available only in encrypted secure logs

**Log Retention Policy:**
- Error logs: 90 days
- Info logs: 30 days
- Security audit logs: 365 days
- Performance metrics: 7 days

---

## Testing Strategy

### Testing Approach Overview

The system employs a comprehensive three-tier testing strategy:

**Tier 1: Property-Based Testing (PBT) - Correctness Properties**
- **Purpose**: Verify universal properties hold across all valid inputs
- **Library**: fast-check for TypeScript
- **Minimum Iterations**: 100 per property test
- **Focus**: Analytics calculations, input validation, data transformations, serialization

**Tier 2: Example-Based Unit Tests - Specific Scenarios**
- **Purpose**: Test specific examples, edge cases, and business logic branches
- **Library**: Vitest
- **Focus**: Authentication flows, notification triggers, UI component behavior, error messages

**Tier 3: Integration Tests - External Dependencies**
- **Purpose**: Verify interactions with database, authentication service, UI rendering
- **Library**: Vitest + Testing Library
- **Focus**: Database transactions, multi-tenant isolation, optimistic UI updates, API endpoints

### Property-Based Testing Implementation

**Library Selection: fast-check**
```typescript
import * as fc from "fast-check";
import { describe, it, expect } from "vitest";
```

**Test Configuration:**
```typescript
const testConfig = {
  numRuns: 100, // Minimum iterations per property
  verbose: true, // Show shrunk failing examples
  seed: undefined, // Random seed for reproducibility
};
```

**Property Test Structure:**

Each property test MUST include:
1. **Tag Comment**: References the design property number and text
2. **Generator**: Arbitrary data generator for test inputs
3. **Property Function**: Universal quantification statement
4. **Assertion**: Verification of property holds

**Example Property Test:**

```typescript
/**
 * Feature: project004-grade-optimizer
 * Property 6: Cumulative Actual Calculation Correctness
 * For any set of components with integer weights and nullable integer achieved scores,
 * the cumulative actual score SHALL equal the sum of (achievedScore / 100) × (weight / 100)
 * for all non-null scores, with the result rounded to two decimal places.
 */
describe("Property 6: Cumulative Actual Calculation", () => {
  it("should calculate correct weighted sum for any component set", () => {
    fc.assert(
      fc.property(
        // Generator: Array of components with random weights and scores
        fc.array(
          fc.record({
            weight: fc.integer({ min: 1, max: 10000 }),
            achievedScore: fc.option(fc.integer({ min: 0, max: 10000 }), {
              nil: null,
            }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (components) => {
          // Calculate expected cumulative actual
          const expected = components
            .filter((c) => c.achievedScore !== null)
            .reduce((sum, c) => {
              return sum + (c.achievedScore! / 100) * (c.weight / 100);
            }, 0);
          const expectedRounded = Math.round(expected * 100) / 100;

          // Call system function
          const actual = calculateCumulativeActual(components);

          // Assert property holds
          expect(actual).toBe(expectedRounded);
        }
      ),
      testConfig
    );
  });

  it("should return 0.00 when all scores are null", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            weight: fc.integer({ min: 1, max: 10000 }),
            achievedScore: fc.constant(null),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (components) => {
          const actual = calculateCumulativeActual(components);
          expect(actual).toBe(0.0);
        }
      ),
      testConfig
    );
  });
});
```

### Custom Generators for Domain Models

**Course Generator:**
```typescript
const arbCourse = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  sks: fc.integer({ min: 1, max: 6 }),
  targetGrade: fc.constantFrom("A", "AB", "B", "BC", "C", "D", "E"),
  targetThreshold: fc.integer({ min: 0, max: 10000 }),
  tenantId: fc.uuid(),
});
```

**Component Generator:**
```typescript
const arbComponent = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  weight: fc.integer({ min: 1, max: 10000 }),
  achievedScore: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: null }),
  courseId: fc.uuid(),
});
```

**Component Array with Weight Sum Constraint:**
```typescript
// Generator for arrays where weights sum to 10000
const arbComponentsValidSum = fc
  .array(fc.integer({ min: 1, max: 20 }), { minLength: 2, maxLength: 10 })
  .map((weights) => {
    // Normalize weights to sum to 10000
    const sum = weights.reduce((a, b) => a + b, 0);
    const normalized = weights.map((w) => Math.round((w / sum) * 10000));

    // Adjust for rounding errors
    const actualSum = normalized.reduce((a, b) => a + b, 0);
    normalized[0] += 10000 - actualSum;

    return normalized.map((weight, index) => ({
      name: `Component ${index + 1}`,
      weight,
      achievedScore: null,
    }));
  });
```

### Unit Testing Strategy

**Focus Areas for Example-Based Tests:**

1. **Authentication and Authorization**
   - Valid login creates session with tenantId
   - Invalid credentials return 401
   - Expired session redirects to login
   - Cross-tenant access returns 403

2. **Notification Triggers**
   - Alert level change to DANGER creates notification
   - Notification marked as read updates isRead flag
   - Unread count reflects pending notifications

3. **UI Component Behavior**
   - Score input displays optimistic value immediately
   - Error toast appears on server rejection
   - Loading spinner shows during pending operations
   - Confirmation modal appears before deletion

4. **Edge Cases and Boundary Conditions**
   - Course with 0 components displays "No components defined"
   - Required score calculation returns null when remainingWeight = 0
   - Negative required score displays correctly
   - Required score > 100 triggers DANGER alert

### Integration Testing Strategy

**Focus Areas:**

1. **Database Operations**
   - Course creation with components in single transaction
   - Transaction rollback on weight sum violation
   - Cascade deletion removes all associated records
   - Optimistic locking prevents concurrent modification conflicts

2. **Multi-Tenant Isolation**
   - User A cannot access User B's courses
   - Course queries automatically filtered by session tenantId
   - Cross-tenant mutation attempts return 403

3. **Performance Requirements**
   - Analytics calculation completes within 200ms for 20 components
   - Dashboard loads within 500ms
   - Export generates within 2 seconds for 100 courses

4. **React Server Components and Optimistic UI**
   - Server Component fetches data on initial load
   - Client Component updates optimistically
   - Server reconciliation confirms or reverts optimistic state
   - Network timeout after 10 seconds reverts optimistic update

### Test Organization

```
tests/
├── properties/           # Property-based tests
│   ├── calculations.test.ts
│   ├── validation.test.ts
│   ├── serialization.test.ts
│   └── isolation.test.ts
├── unit/                 # Example-based unit tests
│   ├── auth.test.ts
│   ├── notifications.test.ts
│   ├── converters.test.ts
│   └── components/
│       ├── ScoreInput.test.tsx
│       └── CourseCard.test.tsx
├── integration/          # Integration tests
│   ├── courses.test.ts
│   ├── transactions.test.ts
│   ├── multi-tenant.test.ts
│   └── performance.test.ts
└── helpers/              # Test utilities
    ├── generators.ts     # fast-check generators
    ├── fixtures.ts       # Test data factories
    └── setup.ts          # Test environment setup
```

### Testing Requirements Summary

**Property-Based Tests (20 properties):**
- Minimum 100 iterations per property
- Custom generators for domain models
- Each test tagged with property number and text
- Cover all calculation, validation, and serialization logic

**Example-Based Tests:**
- Authentication flows (5 tests)
- Notification triggers (7 tests)
- UI component behavior (15 tests)
- Edge cases and boundaries (10 tests)

**Integration Tests:**
- Database transactions (8 tests)
- Multi-tenant isolation (6 tests)
- Performance benchmarks (5 tests)
- Optimistic UI reconciliation (4 tests)

**Coverage Goals:**
- Property-based tests: 100% coverage of analytics and validation functions
- Unit tests: 90% coverage of business logic
- Integration tests: Critical paths and security boundaries
- Total: >85% overall code coverage

### Continuous Integration

**Pre-Commit Checks:**
- TypeScript compilation (strict mode, no errors)
- Linter (ESLint with strict rules)
- Formatter (Prettier)
- Unit tests (fast feedback)

**CI Pipeline:**
1. Install dependencies
2. Build application
3. Run TypeScript type checking
4. Run all property-based tests (2000+ test cases)
5. Run all unit tests
6. Run integration tests
7. Generate coverage report
8. Fail build if coverage < 85%

---

## UI/UX Design Patterns

### Industrial Brutalist Design Implementation

**Design Token Configuration (Tailwind):**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brutal: {
          black: "#09090B", // Primary background
          orange: "#FF4500", // Primary accent / danger
          warning: "#FB8C00", // Warning state
          success: "#10B981", // Success / normal state
          border: "#E2E8F0", // High-contrast borders
        },
      },
      fontFamily: {
        grotesk: ["Space Grotesk", "sans-serif"], // Headings
        mono: ["Space Mono", "monospace"], // Numbers
        sans: ["Inter", "sans-serif"], // Body text
      },
      borderWidth: {
        brutal: "2px", // Minimum border thickness
      },
      borderRadius: {
        brutal: "0px", // Sharp corners only
      },
    },
  },
  plugins: [],
};
export default config;
```

**Typography Scale:**

```css
/* globals.css - Brutalist typography */
h1 {
  @apply font-grotesk text-4xl font-bold tracking-tight text-zinc-50;
}

h2 {
  @apply font-grotesk text-3xl font-bold tracking-tight text-zinc-50;
}

h3 {
  @apply font-grotesk text-2xl font-semibold text-zinc-50;
}

.numeric {
  @apply font-mono text-zinc-50 tabular-nums;
}

body {
  @apply font-sans text-base text-zinc-50 bg-brutal-black antialiased;
}
```

### Responsive Layout Strategy

**Desktop Layout (≥ 768px):**

```
┌──────────────────────────────────────────────────────┐
│ Header (Fixed Top)                                    │
├────────────┬─────────────────────────────────────────┤
│            │                                          │
│  Sidebar   │  Main Content Area                       │
│  (Fixed    │  - Dashboard / Course Detail             │
│   Left,    │  - Data Tables                           │
│   w-64)    │  - Form Inputs                           │
│            │                                          │
│  - Home    │  Scroll overflow: auto                   │
│  - Courses │                                          │
│  - Alerts  │                                          │
│  - Export  │                                          │
│            │                                          │
└────────────┴─────────────────────────────────────────┘
```

**Mobile Layout (< 768px):**

```
┌──────────────────────────────────────────────────────┐
│ Header (Fixed Top)                                    │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Main Content Area (Full Width)                      │
│  - Vertical Card Stack                               │
│  - Touch-optimized inputs (44x44px min)              │
│  - Swipe gestures enabled                            │
│                                                       │
│  Scroll overflow: auto                               │
│                                                       │
│                                                       │
├──────────────────────────────────────────────────────┤
│ Bottom Navigation Bar (Fixed)                         │
│  [Home] [Courses] [Alerts] [Export]                  │
└──────────────────────────────────────────────────────┘
```

### Component Design Patterns

**Button Component - Brutalist Style:**

```tsx
// /components/ui/Button.tsx
interface ButtonProps {
  variant: "primary" | "secondary" | "danger";
  size: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  variant,
  size,
  children,
  onClick,
  disabled,
}: ButtonProps) {
  const baseClasses =
    "font-grotesk font-bold uppercase tracking-wide border-brutal rounded-brutal transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-brutal-orange text-white border-brutal-orange hover:bg-opacity-90",
    secondary:
      "bg-transparent text-brutal-border border-brutal-border hover:bg-zinc-800",
    danger: "bg-red-600 text-white border-red-600 hover:bg-red-700",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm min-h-[44px] md:min-h-[36px]",
    md: "px-4 py-3 text-base min-h-[44px]",
    lg: "px-6 py-4 text-lg min-h-[44px]",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

**Card Component - High Contrast Container:**

```tsx
// /components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode;
  padding?: "sm" | "md" | "lg";
  border?: boolean;
}

export function Card({ children, padding = "md", border = true }: CardProps) {
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`bg-zinc-900 ${border ? "border-brutal border-brutal-border" : ""} rounded-brutal ${paddingClasses[padding]}`}
    >
      {children}
    </div>
  );
}
```

**Input Component - Brutalist Form Field:**

```tsx
// /components/ui/Input.tsx
interface InputProps {
  type: "text" | "number" | "email";
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  label: string;
  required?: boolean;
}

export function Input({
  type,
  value,
  onChange,
  placeholder,
  error,
  label,
  required,
}: InputProps) {
  const inputId = `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="font-grotesk font-semibold text-sm">
        {label}
        {required && <span className="text-brutal-orange ml-1">*</span>}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          bg-zinc-900 border-brutal rounded-brutal px-4 py-3
          font-mono text-zinc-50 placeholder-zinc-500
          focus:outline-none focus:ring-2 focus:ring-brutal-orange
          min-h-[44px]
          ${error ? "border-brutal-orange" : "border-brutal-border"}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <span
          id={`${inputId}-error`}
          className="text-brutal-orange text-sm"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
}
```

### Data Visualization Components

**Alert Level Indicator:**

```tsx
// /components/AlertBadge.tsx
interface AlertBadgeProps {
  level: "NORMAL" | "WARNING" | "DANGER";
  requiredScore: number | null;
}

export function AlertBadge({ level, requiredScore }: AlertBadgeProps) {
  const colors = {
    NORMAL: "bg-brutal-success border-brutal-success text-white",
    WARNING: "bg-brutal-warning border-brutal-warning text-white",
    DANGER: "bg-brutal-orange border-brutal-orange text-white",
  };

  const labels = {
    NORMAL: "On Track",
    WARNING: "Challenging",
    DANGER: "Critical",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 border-brutal rounded-brutal ${colors[level]}`}
      role="status"
      aria-label={`Alert level: ${labels[level]}`}
    >
      <span className="font-grotesk font-bold text-sm uppercase">
        {labels[level]}
      </span>
      {requiredScore !== null && (
        <span className="font-mono text-sm">
          ({requiredScore > 0 ? requiredScore.toFixed(2) : "Achieved"})
        </span>
      )}
    </div>
  );
}
```

**Progress Bar - Score Visualization:**

```tsx
// /components/ProgressBar.tsx
interface ProgressBarProps {
  current: number; // 0-100
  target: number; // 0-100
  label: string;
}

export function ProgressBar({ current, target, label }: ProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const isOnTrack = current >= target * 0.9;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="font-grotesk font-semibold text-sm">{label}</span>
        <span className="font-mono text-sm">
          {current.toFixed(2)} / {target.toFixed(2)}
        </span>
      </div>
      <div className="w-full h-4 bg-zinc-800 border-brutal border-brutal-border rounded-brutal overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${isOnTrack ? "bg-brutal-success" : "bg-brutal-orange"}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={target}
          aria-label={`${label} progress`}
        />
      </div>
    </div>
  );
}
```

### Accessibility Implementation

**Focus Management:**

```css
/* Global focus styles */
*:focus-visible {
  @apply outline-none ring-2 ring-brutal-orange ring-offset-2 ring-offset-brutal-black;
}

/* Keyboard navigation visual cues */
.focusable {
  @apply transition-shadow;
}

.focusable:focus-visible {
  @apply shadow-[0_0_0_3px_theme(colors.brutal.orange)];
}
```

**ARIA Labels and Roles:**

All interactive elements include:
- `aria-label` or `aria-labelledby` for screen readers
- `role` attributes for semantic meaning
- `aria-invalid` and `aria-describedby` for form validation
- `aria-live` regions for dynamic content updates

**Keyboard Navigation:**

- Tab order follows logical visual flow
- All interactive elements reachable via Tab
- Modal traps focus until dismissed
- Escape key closes modals and dropdowns
- Arrow keys navigate lists and tables

---

## Deployment and Infrastructure

### Database Setup

**Prisma Migration Strategy:**

```bash
# Development
npx prisma migrate dev --name init

# Production
npx prisma migrate deploy
```

**Connection Pooling:**

```typescript
// /lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Connection Pool Configuration:**

```
# PostgreSQL connection string with pooling
DATABASE_URL="postgresql://user:password@localhost:5432/grade_optimizer?connection_limit=50&pool_timeout=30"
```

### Build and Deployment

**Next.js Build Configuration:**

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Security: hide X-Powered-By header
  compress: true, // Enable gzip compression
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  typescript: {
    ignoreBuildErrors: false, // Fail build on type errors
  },
  eslint: {
    ignoreDuringBuilds: false, // Fail build on lint errors
  },
};

module.exports = nextConfig;
```

**Production Build Process:**

```bash
# Install dependencies
npm ci --legacy-peer-deps

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build Next.js application
npm run build

# Start production server
npm run start
```

### Security Considerations

**Session Security:**

- HttpOnly cookies prevent XSS access
- Secure flag enforces HTTPS transmission
- SameSite=Strict prevents CSRF attacks
- 7-day expiration with sliding window

**Input Sanitization:**

```typescript
// /lib/validators.ts
import sanitizeHtml from "sanitize-html";

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [], // Strip all HTML tags
    allowedAttributes: {},
  });
}
```

**SQL Injection Prevention:**

- Prisma ORM with parameterized queries
- No raw SQL without explicit sanitization
- Input validation with Zod before database operations

**Rate Limiting:**

```typescript
// middleware.ts - Rate limiting
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
});

export async function middleware(request: NextRequest) {
  const identifier = request.ip ?? "anonymous";
  const { success } = await ratelimit.limit(identifier);

  if (!success) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
      },
    });
  }

  // Continue with authentication and tenantId validation
}
```

### Monitoring and Observability

**Health Check Endpoint:**

```typescript
// /app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
```

**Performance Metrics:**

```typescript
// /lib/metrics.ts
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (duration > 1000) {
    console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
  }

  return result;
}
```

---

## Migration and Data Import

### CSV Import Utility

For users migrating from Excel/CSV grade tracking:

```typescript
// /lib/import.ts
import { parse } from "csv-parse/sync";

interface CSVRow {
  courseName: string;
  sks: string;
  targetGrade: string;
  componentName: string;
  weight: string;
  achievedScore: string;
}

export async function importFromCSV(
  csvContent: string,
  tenantId: string
): Promise<Result<{ coursesCreated: number; componentsCreated: number }>> {
  try {
    // Parse CSV
    const rows = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    }) as CSVRow[];

    // Group by course
    const courseMap = new Map<string, CSVRow[]>();
    for (const row of rows) {
      if (!courseMap.has(row.courseName)) {
        courseMap.set(row.courseName, []);
      }
      courseMap.get(row.courseName)!.push(row);
    }

    // Validate and import
    let coursesCreated = 0;
    let componentsCreated = 0;

    await executeTransaction(async (tx) => {
      for (const [courseName, rows] of courseMap) {
        // Create course
        const course = await tx.course.create({
          data: {
            name: courseName,
            sks: parseInt(rows[0].sks),
            targetGrade: rows[0].targetGrade as TargetGrade,
            targetThreshold: getThresholdForGrade(
              rows[0].targetGrade as TargetGrade
            ),
            tenantId,
          },
        });
        coursesCreated++;

        // Create components
        for (const row of rows) {
          await tx.component.create({
            data: {
              name: row.componentName,
              weight: toInteger(parseFloat(row.weight)),
              achievedScore: row.achievedScore
                ? toInteger(parseFloat(row.achievedScore))
                : null,
              courseId: course.id,
            },
          });
          componentsCreated++;
        }

        // Validate weight sum
        const components = await tx.component.findMany({
          where: { courseId: course.id },
        });
        const weightSum = components.reduce((sum, c) => sum + c.weight, 0);
        if (Math.abs(weightSum - 10000) > 10) {
          throw new Error(
            `Course "${courseName}" components sum to ${weightSum / 100}%, must equal 100%`
          );
        }
      }
    });

    return { success: true, data: { coursesCreated, componentsCreated } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}
```

### Export Utility

```typescript
// /lib/export.ts
export async function exportToJSON(tenantId: string): Promise<string> {
  const courses = await prisma.course.findMany({
    where: { tenantId },
    include: { components: true },
    orderBy: { createdAt: "desc" },
  });

  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      tenantId,
      version: "1.0",
    },
    courses: courses.map((course) => ({
      id: course.id,
      name: course.name,
      sks: course.sks,
      targetGrade: course.targetGrade,
      targetThreshold: toDecimal(course.targetThreshold),
      analytics: calculateCourseAnalytics(
        course.components,
        course.targetThreshold
      ),
      components: course.components.map((component) => ({
        id: component.id,
        name: component.name,
        weight: toDecimal(component.weight),
        achievedScore: component.achievedScore
          ? toDecimal(component.achievedScore)
          : null,
      })),
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    })),
  };

  return JSON.stringify(exportData, null, 2);
}
```

---

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Historical Grade Tracking**
   - Track score changes over time
   - Visualize grade trajectory with charts
   - Identify improvement/decline trends

2. **Collaborative Features**
   - Share courses with study groups
   - Compare anonymous grade distributions
   - Peer benchmarking (opt-in)

3. **Advanced Analytics**
   - Predictive models for final grade
   - Time investment recommendations
   - Risk detection with ML

4. **Mobile Native Apps**
   - React Native mobile applications
   - Offline-first with sync
   - Push notifications for alerts

5. **Integration Capabilities**
   - LMS integration (Canvas, Moodle)
   - Calendar sync for due dates
   - Export to PDF reports

### Scalability Improvements

1. **Caching Layer**
   - Redis for session storage
   - Query result caching
   - Computed analytics caching

2. **Database Optimization**
   - Read replicas for query scaling
   - Partitioning by tenantId for large datasets
   - Materialized views for analytics

3. **CDN and Asset Optimization**
   - Static asset CDN distribution
   - Image optimization
   - Font subsetting

---

## Conclusion

This technical design provides a comprehensive blueprint for building Project004 - Grade Optimizer & KPI Dashboard with enterprise-grade quality, security, and performance. The system implements four mandatory architectural guardrails that ensure correctness, data isolation, visual clarity, and production readiness.

**Key Design Strengths:**

1. **Mathematical Correctness**: Integer-based arithmetic eliminates floating-point errors in critical grade calculations
2. **Security-First**: Multi-tenant isolation at every layer prevents data leakage
3. **User-Focused**: Industrial brutalist design maximizes information clarity and accessibility
4. **Battle-Tested Patterns**: React Server Components, optimistic UI, and ACID transactions ensure reliability
5. **Comprehensive Testing**: Property-based testing with 100+ iterations per property guarantees correctness across all inputs

The design is ready for implementation with clear interfaces, detailed error handling strategies, and a robust testing plan that will ensure the system meets its strategic objective: enabling students to achieve perfect 4.00 GPAs through data-driven grade management.