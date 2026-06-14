# Requirements Document: Project004 - Grade Optimizer & KPI Dashboard

## Introduction

**Project004** is an enterprise-scale Academic Performance Management System designed for Computer Engineering Technology (TRK) students at IPB University. The system provides real-time grading parameter transparency with predictive analytics to help students achieve a perfect GPA of 4.00 by mitigating academic drop risks from Week 1 of the semester.

### Core Philosophy

**QUALITY ABOVE EVERYTHING ELSE**

This project operates under a zero-compromise quality mandate. Every line of code must be production-ready, strictly typed, highly secure, and optimized. No placeholders, no TODO comments, no truncated implementations.

### Technical Stack

- **Framework**: Next.js 15+ (App Router, React Server Components, Server Actions)
- **Language**: TypeScript (Strict Mode enforced, no `any` types)
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS (Industrial Brutalist Design System)
- **Validation**: Zod
- **State Management/UI**: React Hooks (including `useOptimistic`) / Zustand
- **Architecture**: Modern Monolith with Mobile-First approach

### Strategic Objectives

1. **Academic Excellence**: Enable students to achieve perfect 4.00 GPA through data-driven grade management
2. **Early Risk Mitigation**: Identify grade drop risks from Week 1 using predictive analytics
3. **Real-Time Transparency**: Provide instant visibility into grading parameters and required scores
4. **Enterprise Reliability**: Deliver a highly secure, scalable, and performant system

## Glossary

- **System**: The Academic Performance Management System (Grade Optimizer & KPI Dashboard)
- **User**: A Computer Engineering Technology student at IPB University
- **Tenant**: Individual student account with isolated data access (synonymous with User in single-user context)
- **TenantId**: Unique identifier linking all data to a specific user for multi-tenant isolation
- **Course**: An academic course entity with credits (SKS), target grade, and associated grading components
- **Component**: A grading component within a course (e.g., Quiz, Midterm, Final) with weight and achieved score
- **Weight**: Percentage contribution of a component to the final course grade (stored as integer in database, multiply by 100)
- **Target_Grade**: Desired grade for a course (default "A")
- **Target_Threshold**: Minimum score required for target grade (8000 for grade "A" at IPB, representing 80.00%)
- **Cumulative_Actual**: Sum of achieved scores weighted by their component weights
- **Required_Score**: Minimum score needed on remaining components to achieve target grade
- **Remaining_Weight**: Sum of weights for components without achieved scores
- **Alert_Level**: Risk classification based on Required_Score feasibility (Normal, Warning, Danger)
- **Database**: PostgreSQL database managed through Prisma ORM
- **Integer_Precision**: Architectural pattern storing all decimal values as integers (multiply by 100) to eliminate floating-point errors
- **Authentication_Service**: Service responsible for user identity verification
- **Authorization_Service**: Service responsible for access control and permission validation
- **Optimistic_Update**: UI update strategy that reflects changes immediately before server confirmation
- **RSC**: React Server Components - server-rendered components that minimize client-side JavaScript
- **Server_Action**: Next.js server-side function callable directly from client components
- **Industrial_Brutalist**: Design aesthetic featuring high-contrast colors, thick borders, rigid layouts, and utilitarian typography

---

## MANDATORY ARCHITECTURAL GUARDRAILS

These four architectural constraints are **non-negotiable** and must be enforced throughout the entire system.

### Guardrail 1: Integer-Based Precision Mathematics

**Problem**: JavaScript floating-point arithmetic suffers from IEEE 754 binary precision errors (e.g., `0.1 + 0.2 !== 0.3`).

**Solution**: Store ALL decimal values as integers in PostgreSQL by multiplying by 100.

#### Storage Rules

| Display Value | Database Storage | Conversion |
|--------------|------------------|------------|
| 85.50% | 8550 | `85.50 * 100` |
| 20.00% | 2000 | `20.00 * 100` |
| 100.00% | 10000 | `100.00 * 100` |
| 0.01% | 1 | `0.01 * 100` |

#### Implementation Requirements

1. ALL Prisma schema fields for scores, weights, and thresholds MUST use `Int` type
2. Database stores: `weight Int` (not `weight Float`)
3. Conversion to decimal occurs ONLY at UI presentation layer
4. Mathematical operations performed on integers, then converted for display
5. Validation ensures integer values are within valid ranges (0 to 10000 for percentages)

#### Acceptance Criteria

1. THE System SHALL store all weight values as Int (0 to 10000 representing 0.00% to 100.00%)
2. THE System SHALL store all score values as Int (0 to 10000 representing 0.00% to 100.00%)
3. THE System SHALL store target thresholds as Int (e.g., 8000 for 80.00%)
4. WHEN displaying values, THE System SHALL divide integer by 100 and format to 2 decimal places
5. WHEN accepting user input, THE System SHALL multiply decimal by 100 before database storage
6. THE System SHALL perform all arithmetic operations on integer values
7. THE System SHALL validate that integer values never exceed bounds (0 to 10000 for percentages)

---

### Guardrail 2: Strict Multi-Tenant Data Isolation

**Problem**: Academic data is highly sensitive. Cross-tenant data leakage is a critical security failure.

**Solution**: Every database operation MUST enforce tenantId-based filtering at the query level.

#### Isolation Rules

1. **User-Tenant Binding**: Each authenticated user has exactly one tenantId
2. **Query Scoping**: ALL Prisma queries include `WHERE tenantId: session.tenantId`
3. **Mutation Validation**: ALL create/update/delete operations validate tenantId ownership
4. **Session-Based Context**: TenantId derived from authenticated session, never from client input
5. **Index Strategy**: Database indexes include tenantId as first column for query performance

#### Implementation Requirements

1. Prisma schema includes `tenantId String` field on Course and User models
2. All Server Actions extract tenantId from authenticated session
3. Middleware validates session and attaches tenantId to request context
4. Database queries use Prisma where clause: `where: { tenantId }`
5. Foreign key relationships preserve tenantId consistency
6. API routes return 403 Forbidden if tenantId mismatch detected

#### Acceptance Criteria

1. THE System SHALL associate each User account with exactly one tenantId
2. WHEN a User queries courses, THE System SHALL filter by `WHERE tenantId = session.tenantId`
3. WHEN a User creates a course, THE System SHALL automatically set tenantId from session
4. THE System SHALL reject any mutation attempting to modify data with different tenantId
5. THE System SHALL include tenantId in all database indexes for courses and components
6. WHERE a transaction spans multiple tables, THE System SHALL validate tenantId consistency
7. THE System SHALL return HTTP 403 if tenantId validation fails
8. THE System SHALL log all tenantId validation failures for security audit

---

### Guardrail 3: Industrial Brutalist Design System

**Problem**: Generic UI frameworks lack visual identity and fail to prioritize critical information.

**Solution**: Implement a custom high-contrast brutalist design system with rigid constraints.

#### Design Token Specifications

**Color Palette**

```typescript
const BrutalistTokens = {
  // Primary Surface
  background: '#09090B',        // Brutal Black (Deep Zinc)
  
  // Accent & Alerts
  accent: '#FF4500',             // Brutal Orange/Neon (OrangeRed)
  danger: '#FF4500',             // Alert Level 3 - Danger
  warning: '#FB8C00',            // Alert Level 2 - Warning (Orange)
  success: '#10B981',            // Alert Level 1 - Normal (Emerald)
  
  // Borders & Dividers
  border: '#E2E8F0',             // High-contrast border (Slate 200)
  borderThick: '2px solid',      // Minimum border thickness
  
  // Typography
  textPrimary: '#FAFAFA',        // White (Zinc 50)
  textSecondary: '#A1A1AA',      // Gray (Zinc 400)
  textMuted: '#71717A',          // Muted Gray (Zinc 500)
} as const;
```

**Typography System**

```typescript
const BrutalistFonts = {
  heading: 'Space Grotesk, sans-serif',  // Architectural precision
  numeric: 'Space Mono, monospace',      // Monospaced for decimal alignment
  body: 'Inter, sans-serif',             // Maximum legibility
} as const;
```

**Layout Constraints**

- **Border Width**: Minimum 2px solid
- **Corner Radius**: 0px (sharp corners, no rounded borders)
- **Container Padding**: Fixed multiples of 8px (8, 16, 24, 32)
- **Grid Gaps**: Fixed multiples of 16px
- **Touch Targets**: Minimum 44x44px for mobile interactivity

#### Responsive Breakpoints

| Breakpoint | Width | Layout Strategy |
|-----------|-------|-----------------|
| Mobile | < 768px | Fixed Bottom Navigation Bar, Vertical Card Stack |
| Desktop | ≥ 768px | Fixed Left Sidebar (w-64), High-Density Data Tables |

#### Acceptance Criteria

1. THE System SHALL use background color #09090B for all primary surfaces
2. THE System SHALL use accent color #FF4500 for danger alerts and critical CTAs
3. THE System SHALL use Space Grotesk font for all heading elements (h1-h6)
4. THE System SHALL use Space Mono font for all numeric displays (scores, percentages)
5. THE System SHALL use Inter font for all body text and labels
6. THE System SHALL enforce minimum 2px solid borders on all containers
7. THE System SHALL use sharp corners with 0px border-radius
8. THE System SHALL maintain contrast ratio ≥ 4.5:1 for body text
9. THE System SHALL maintain contrast ratio ≥ 3:1 for large text (≥18px)
10. WHEN viewport < 768px, THE System SHALL display fixed bottom navigation
11. WHEN viewport ≥ 768px, THE System SHALL display fixed left sidebar (256px width)
12. THE System SHALL ensure all interactive elements are minimum 44x44px on mobile

---

### Guardrail 4: Production-Ready Code Standards

**Problem**: Prototypes with placeholders lead to technical debt and production failures.

**Solution**: Every file, component, and function must be complete, typed, and battle-tested from day one.

#### Code Quality Standards

**TypeScript Strict Mode**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

**Forbidden Patterns**
- ❌ `any` type declarations
- ❌ `// TODO` comments
- ❌ `// Placeholder` comments
- ❌ Truncated code with `...`
- ❌ `console.log` in production code
- ❌ Unhandled promise rejections
- ❌ Missing error boundaries

**Required Patterns**
- ✅ Explicit return types on all functions
- ✅ Zod validation schemas for all inputs
- ✅ Try-catch blocks with typed error handling
- ✅ Exhaustive null checks
- ✅ Complete component implementations
- ✅ Comprehensive JSDoc comments
- ✅ Structured logging with context

#### Error Handling Requirements

1. **Server Actions**: Must return typed Result objects `{ success: boolean; data?: T; error?: string }`
2. **API Routes**: Must handle all error cases with appropriate HTTP status codes
3. **Database Operations**: Must wrap in transactions with rollback on failure
4. **User Input**: Must validate with Zod schemas before processing
5. **Async Operations**: Must handle timeouts and network failures gracefully

#### Acceptance Criteria

1. THE System SHALL compile with TypeScript strict mode enabled and zero errors
2. THE System SHALL reject code containing `any` types during code review
3. THE System SHALL validate all user inputs with Zod schemas before database operations
4. THE System SHALL wrap all Server Actions in try-catch blocks with typed error responses
5. THE System SHALL use database transactions for multi-step mutations with automatic rollback
6. THE System SHALL return structured error messages with field-level validation details
7. THE System SHALL log all errors with stack traces and context (sanitizing sensitive data)
8. THE System SHALL implement React Error Boundaries for client-side error containment
9. THE System SHALL handle network timeouts with user-friendly error messages
10. THE System SHALL never deploy code containing TODO comments or placeholder implementations
---

## FUNCTIONAL REQUIREMENTS

### Requirement 1: Course Management

**User Story:** As a User, I want to create and manage courses with credits and target grades, so that I can track my academic performance for each subject.

#### Acceptance Criteria

1. WHEN a User creates a course, THE System SHALL store the course name, SKS credits, target grade, and timestamp
2. THE System SHALL set the default target grade to "A" if not specified by the User
3. WHEN a User updates a course, THE System SHALL preserve the course ID and update only the modified fields
4. WHEN a User deletes a course, THE System SHALL cascade delete all associated components
5. THE System SHALL enforce that SKS credits are positive integers between 1 and 6
6. THE System SHALL enforce that target grade is one of: "A", "AB", "B", "BC", "C", "D", or "E"
7. WHERE a Tenant context exists, THE System SHALL isolate course data by Tenant ID

### Requirement 2: Component Weight Management

**User Story:** As a User, I want to define grading components with weights for each course, so that I can model the actual grading structure of my classes.

#### Acceptance Criteria

1. WHEN a User creates a component, THE System SHALL store the component name, weight, course ID, and relationship to parent course
2. THE System SHALL enforce that component weight is a Float value between 0.01 and 100.00
3. WHEN a User attempts to save components for a course, IF the total weight does not equal exactly 100.00, THEN THE System SHALL reject the mutation and return a validation error message
4. THE System SHALL calculate the total weight as the sum of all component weights for a given course
5. WHEN a User updates a component weight, THE System SHALL revalidate that the total course weight equals 100.00
6. WHEN a User deletes a component, THE System SHALL revalidate that remaining components total 100.00 or allow the deletion if it enables rebalancing
7. THE System SHALL enforce that each component belongs to exactly one course via the courseId foreign key

### Requirement 3: Score Entry and Tracking

**User Story:** As a User, I want to record achieved scores for grading components, so that I can track my actual performance throughout the semester.

#### Acceptance Criteria

1. WHEN a User enters an achieved score, THE System SHALL store the score as a nullable Float value
2. THE System SHALL enforce that achieved scores are Float values between 0.00 and 100.00
3. WHEN a User updates an achieved score, THE System SHALL recalculate the Cumulative_Actual and Required_Score
4. THE System SHALL allow achieved scores to be null representing components not yet graded
5. WHEN a User clears an achieved score, THE System SHALL set the value to null and recalculate analytics

### Requirement 4: Cumulative Score Calculation

**User Story:** As a User, I want the system to calculate my cumulative actual score, so that I can see my current standing in each course.

#### Acceptance Criteria

1. WHEN achieved scores exist for a course, THE System SHALL calculate Cumulative_Actual as the sum of (AchievedScore_i × (Weight_i / 100)) for all components with non-null scores
2. THE System SHALL return 0.00 as Cumulative_Actual when no achieved scores exist
3. THE System SHALL round Cumulative_Actual to two decimal places
4. WHEN a component score is updated, THE System SHALL recalculate Cumulative_Actual within 200 milliseconds

### Requirement 5: Required Score Calculation

**User Story:** As a User, I want to know the minimum score I need on remaining components, so that I can focus my study efforts appropriately.

#### Acceptance Criteria

1. WHEN remaining components exist for a course, THE System SHALL calculate Required_Score as (Target_Threshold - Cumulative_Actual) / (Remaining_Weight / 100)
2. IF Remaining_Weight equals 0.00, THEN THE System SHALL return null for Required_Score and avoid division by zero
3. THE System SHALL calculate Remaining_Weight as the sum of weights for components with null achieved scores
4. THE System SHALL round Required_Score to two decimal places
5. THE System SHALL allow Required_Score to be negative indicating target already exceeded
6. WHEN a component score is updated, THE System SHALL recalculate Required_Score within 200 milliseconds

### Requirement 6: Early Warning System

**User Story:** As a User, I want to receive alerts when achieving my target grade becomes difficult or impossible, so that I can take corrective action early.

#### Acceptance Criteria

1. WHEN Required_Score is greater than 100.00, THE System SHALL set Alert_Level to "Danger"
2. WHEN Required_Score is between 90.00 and 100.00 inclusive, THE System SHALL set Alert_Level to "Warning"
3. WHEN Required_Score is less than 90.00, THE System SHALL set Alert_Level to "Normal"
4. WHEN Required_Score is null or negative, THE System SHALL set Alert_Level to "Normal"
5. WHEN Alert_Level changes to "Danger", THE System SHALL trigger a notification event
6. THE System SHALL display Alert_Level using color coding: Normal (neutral), Warning (orange), Danger (#FF4500 red)
7. WHEN Alert_Level is "Danger", THE System SHALL display a message indicating the target grade is no longer achievable

### Requirement 7: Multi-Tenant Data Isolation

**User Story:** As a User, I want my academic data to be completely isolated from other students, so that my privacy is protected and data integrity is maintained.

#### Acceptance Criteria

1. THE System SHALL enforce that each User account is associated with exactly one Tenant ID
2. WHEN a User queries courses, THE System SHALL filter results to include only courses belonging to the User's Tenant ID
3. WHEN a User queries components, THE System SHALL filter results to include only components from courses belonging to the User's Tenant ID
4. THE System SHALL reject any query or mutation attempting to access data from a different Tenant ID
5. THE System SHALL include Tenant ID in all database indexes for courses and components
6. WHERE a database transaction spans multiple tables, THE System SHALL validate Tenant ID consistency across all affected records

### Requirement 8: Authentication and Authorization

**User Story:** As a User, I want to securely log in and have my actions authorized, so that only I can access and modify my academic data.

#### Acceptance Criteria

1. WHEN a User attempts to access the System, THE Authentication_Service SHALL verify the User's identity
2. WHEN authentication fails, THE System SHALL deny access and return an unauthorized error
3. WHEN a User performs an action, THE Authorization_Service SHALL verify the User has permission to perform that action on the specified resource
4. THE System SHALL enforce that Users can only create, read, update, or delete their own Tenant's data
5. THE System SHALL maintain an active session token with expiration time
6. WHEN a session token expires, THE System SHALL require re-authentication
7. THE System SHALL use secure session storage resistant to XSS and CSRF attacks

### Requirement 9: Database Transaction Integrity

**User Story:** As a User, I want my data changes to be reliable and consistent, so that I can trust the accuracy of my academic records.

#### Acceptance Criteria

1. THE System SHALL use ACID-compliant PostgreSQL transactions for all data mutations
2. WHEN a component weight update violates the 100% total rule, THE System SHALL rollback the entire transaction
3. WHEN a database constraint violation occurs, THE System SHALL rollback the transaction and return a descriptive error
4. THE System SHALL use database-level foreign key constraints to enforce Course-Component relationships
5. THE System SHALL use database-level unique constraints to prevent duplicate course names within a Tenant
6. WHEN concurrent updates occur on the same course, THE System SHALL use optimistic locking or row-level locking to prevent race conditions
7. THE System SHALL include createdAt and updatedAt timestamp fields on Course and Component entities

### Requirement 10: Optimistic UI Updates

**User Story:** As a User, I want the interface to respond immediately to my actions, so that the system feels fast and responsive even with network latency.

#### Acceptance Criteria

1. WHEN a User submits a data mutation, THE System SHALL update the UI optimistically before receiving server confirmation
2. WHEN the server confirms the mutation, THE System SHALL reconcile the optimistic update with the server response
3. IF the server rejects the mutation, THEN THE System SHALL revert the optimistic update and display an error message
4. THE System SHALL visually indicate when data is in an optimistic (pending) state
5. THE System SHALL handle network timeouts by reverting optimistic updates after 10 seconds
6. WHEN multiple optimistic updates are pending, THE System SHALL process them in submission order

### Requirement 11: Database Query Performance

**User Story:** As a User, I want the system to load my data quickly, so that I can access my grades without waiting.

#### Acceptance Criteria

1. THE System SHALL create a database index on Course(tenantId, createdAt)
2. THE System SHALL create a database index on Component(courseId, weight)
3. WHEN a User loads the dashboard, THE System SHALL execute course and component queries in parallel
4. THE System SHALL return course listings within 500 milliseconds under normal network conditions
5. THE System SHALL use Prisma query optimization with select and include clauses to avoid N+1 queries
6. THE System SHALL paginate course listings when a Tenant has more than 50 courses

### Requirement 12: Mobile-First Responsive Layout

**User Story:** As a User, I want the interface to work seamlessly on my mobile device, so that I can check my grades on campus without a laptop.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768 pixels, THE System SHALL display a fixed bottom navigation bar
2. WHEN the viewport width is less than 768 pixels, THE System SHALL display courses in a vertical card stack layout
3. WHEN the viewport width is 768 pixels or greater, THE System SHALL display a fixed left sidebar with width 16rem
4. WHEN the viewport width is 768 pixels or greater, THE System SHALL display courses in a high-density data table
5. THE System SHALL use responsive typography scaling between mobile and desktop breakpoints
6. THE System SHALL ensure all interactive elements have minimum touch target size of 44x44 pixels on mobile
7. THE System SHALL support swipe gestures for navigation on mobile devices

### Requirement 13: Industrial Brutalist Design System

**User Story:** As a User, I want a high-contrast, focused interface, so that I can quickly read critical information without distraction.

#### Acceptance Criteria

1. THE System SHALL use background color #09090B for all primary surfaces
2. THE System SHALL use primary accent color #FF4500 for alerts and critical actions
3. THE System SHALL use Space Grotesk font for all heading elements
4. THE System SHALL use Space Mono font for all numeric displays
5. THE System SHALL use Inter font for all body text
6. THE System SHALL maintain minimum contrast ratio of 4.5:1 for body text and 3:1 for large text
7. THE System SHALL use high-contrast neon colors against the dark background for data visualization

### Requirement 14: Type Safety and Validation

**User Story:** As a User, I want the system to catch data errors before they affect my records, so that my academic data remains accurate.

#### Acceptance Criteria

1. THE System SHALL enforce strict TypeScript compilation with no implicit any types
2. THE System SHALL define Prisma schema types that generate TypeScript interfaces for Course and Component
3. WHEN a User submits data, THE System SHALL validate input against defined TypeScript types
4. THE System SHALL validate component weights sum to 100.00 before database commit
5. THE System SHALL validate achieved scores are within 0.00-100.00 range before database commit
6. THE System SHALL return structured validation error messages with field-level details
7. THE System SHALL perform validation on both client and server sides

### Requirement 15: Audit Trail and History

**User Story:** As a User, I want to see when my grades were last updated, so that I can track changes over time.

#### Acceptance Criteria

1. THE System SHALL record createdAt timestamp when a Course or Component is created
2. THE System SHALL update updatedAt timestamp whenever a Course or Component is modified
3. THE System SHALL display "Last updated" information on the course detail view
4. THE System SHALL use ISO 8601 format for all timestamp displays
5. THE System SHALL use the server's UTC time zone for all timestamp storage
6. WHEN displaying timestamps, THE System SHALL convert to the User's local time zone

### Requirement 16: Error Handling and User Feedback

**User Story:** As a User, I want clear error messages when something goes wrong, so that I can understand and resolve issues quickly.

#### Acceptance Criteria

1. WHEN a validation error occurs, THE System SHALL display a user-friendly error message describing the problem
2. WHEN a network error occurs, THE System SHALL display a message indicating connectivity issues
3. WHEN a database error occurs, THE System SHALL log the technical error and display a generic error message to the User
4. THE System SHALL display error messages in a toast notification with 5-second auto-dismiss
5. THE System SHALL use color coding for message severity: Info (blue), Warning (orange), Error (red), Success (green)
6. WHEN a Required_Score calculation produces infinity or NaN, THE System SHALL handle the edge case gracefully and display "N/A"

### Requirement 17: Data Export and Reporting

**User Story:** As a User, I want to export my grade data, so that I can perform additional analysis or share with advisors.

#### Acceptance Criteria

1. WHEN a User requests data export, THE System SHALL generate a JSON file containing all courses and components
2. THE System SHALL include calculated fields (Cumulative_Actual, Required_Score, Alert_Level) in the export
3. THE System SHALL include metadata (export timestamp, Tenant ID) in the export file
4. THE System SHALL enforce that exports contain only the requesting User's Tenant data
5. THE System SHALL generate export files within 2 seconds for up to 100 courses
6. THE System SHALL provide a download link or trigger browser download for the export file

### Requirement 18: Parser and Serializer for Import/Export

**User Story:** As a User, I want to import grade data from external sources, so that I can quickly set up my courses from syllabus information.

#### Acceptance Criteria

1. WHEN a User provides a valid JSON import file, THE Parser SHALL parse it into Course and Component objects
2. WHEN an invalid JSON import file is provided, THE Parser SHALL return a descriptive error with line and column information
3. THE Pretty_Printer SHALL format Course and Component objects back into valid JSON format
4. FOR ALL valid Course and Component object collections, parsing then printing then parsing SHALL produce equivalent objects (round-trip property)
5. THE Parser SHALL validate that imported component weights sum to 100.00 per course
6. THE Parser SHALL validate all required fields are present before creating database records
7. THE System SHALL assign the importing User's Tenant ID to all imported courses

### Requirement 19: Real-Time Dashboard Updates

**User Story:** As a User, I want my dashboard to refresh automatically when I update grades, so that I always see current information without manual refresh.

#### Acceptance Criteria

1. WHEN a User updates a component score, THE System SHALL recalculate all analytics within 200 milliseconds
2. THE System SHALL update the dashboard view with new Cumulative_Actual and Required_Score values
3. THE System SHALL update Alert_Level indicators when thresholds are crossed
4. THE System SHALL use React Server Components to minimize client-side JavaScript bundle size
5. THE System SHALL implement progressive enhancement where JavaScript-dependent features degrade gracefully
6. WHEN calculation errors occur, THE System SHALL display the last known valid state with an error indicator

### Requirement 20: Notification System for Alerts

**User Story:** As a User, I want to receive notifications when my grade status changes to Danger level, so that I am immediately aware of critical situations.

#### Acceptance Criteria

1. WHEN Alert_Level changes to "Danger" for any course, THE System SHALL create a notification record
2. THE System SHALL display unread notification count in the navigation bar
3. WHEN a User opens the notification panel, THE System SHALL display all notifications sorted by timestamp descending
4. THE System SHALL mark notifications as read when the User views them
5. THE System SHALL retain notifications for 30 days before automatic deletion
6. THE System SHALL include course name and specific alert details in notification content
7. WHERE a User has multiple courses at Danger level, THE System SHALL create separate notifications for each course

### Requirement 21: Concurrent Access and Race Condition Protection

**User Story:** As a User, I want my data to remain consistent even when I have multiple browser tabs open, so that I don't lose changes or see incorrect data.

#### Acceptance Criteria

1. WHEN concurrent updates occur on the same course from different sessions, THE System SHALL use optimistic locking with version numbers
2. IF a version conflict is detected, THEN THE System SHALL reject the older update and prompt the User to refresh and retry
3. THE System SHALL include a version field on Course and Component entities
4. WHEN a mutation is committed, THE System SHALL increment the version number atomically
5. THE System SHALL validate that the client's version matches the database version before applying updates
6. THE System SHALL return a conflict error with current state when version mismatch occurs

### Requirement 22: Accessibility Compliance

**User Story:** As a User with accessibility needs, I want the system to be usable with assistive technologies, so that I can manage my grades independently.

#### Acceptance Criteria

1. THE System SHALL provide ARIA labels for all interactive elements
2. THE System SHALL support full keyboard navigation with visible focus indicators
3. THE System SHALL use semantic HTML elements for content structure
4. THE System SHALL provide alt text for all informational images and icons
5. THE System SHALL announce dynamic content changes to screen readers using ARIA live regions
6. THE System SHALL support browser zoom up to 200% without horizontal scrolling or content loss
7. THE System SHALL meet WCAG 2.1 Level AA contrast requirements for all text and interactive elements

### Requirement 23: Performance Monitoring and Logging

**User Story:** As a system administrator, I want to monitor system performance and errors, so that I can proactively address issues affecting Users.

#### Acceptance Criteria

1. THE System SHALL log all database queries with execution time exceeding 1 second
2. THE System SHALL log all application errors with stack traces and context information
3. THE System SHALL record response time metrics for all API routes
4. THE System SHALL implement health check endpoints for database and application status
5. THE System SHALL sanitize sensitive data (passwords, tokens) from logs before writing
6. THE System SHALL use structured logging with consistent fields (timestamp, level, message, context)
7. WHERE error rates exceed 5% over a 5-minute window, THE System SHALL trigger an alert

### Requirement 24: Data Validation Edge Cases

**User Story:** As a User, I want the system to handle unusual inputs gracefully, so that I don't encounter crashes or incorrect calculations.

#### Acceptance Criteria

1. WHEN all components have achieved scores and Required_Score calculation results in division by zero, THE System SHALL display "Target achieved" instead of an error
2. WHEN Required_Score calculation produces a negative value, THE System SHALL display the negative value to indicate surplus points
3. WHEN component weights sum to 99.99 or 100.01 due to floating-point precision, THE System SHALL accept the values if within 0.01 tolerance
4. WHEN a User enters extremely large numbers exceeding Float precision, THE System SHALL reject the input with a range validation error
5. WHEN a course has zero components, THE System SHALL display "No components defined" and prevent Required_Score calculation
6. THE System SHALL handle null, undefined, and empty string inputs by rejecting them with validation errors

### Requirement 25: Scalability and Load Handling

**User Story:** As a User during peak registration periods, I want the system to remain responsive, so that I can access my grades when I need them.

#### Acceptance Criteria

1. THE System SHALL support at least 1000 concurrent User sessions without degradation
2. THE System SHALL implement connection pooling for database connections with minimum pool size 10 and maximum 50
3. WHEN database connection pool is exhausted, THE System SHALL queue requests with 30-second timeout
4. THE System SHALL use database query result caching for frequently accessed read-only data
5. THE System SHALL implement rate limiting of 100 requests per minute per User to prevent abuse
6. WHEN rate limits are exceeded, THE System SHALL return HTTP 429 status with retry-after header
7. THE System SHALL horizontally scale by supporting multiple application instances behind a load balancer

---

## 24-DAY SPRINT ROADMAP

This roadmap breaks down Project004 into 5 phases across 24 daily sprints. Each day has a specific objective, AI prompt guidelines, and Definition of Done (QA Criteria).

### Execution Protocol

1. **Daily Focus**: Execute ONE day at a time. Do not attempt multiple days simultaneously.
2. **Quality Gate**: Each day must pass all QA criteria before proceeding to the next day.
3. **No Shortcuts**: Zero placeholders, zero TODO comments, complete implementations only.
4. **Verification**: Test all functionality before marking a day as complete.

---

## PHASE 1: CORE ARCHITECTURE & INFRASTRUCTURE (Days 1-5)

### Day 1: Project Initialization & TypeScript Configuration

**Objective**: Initialize Next.js 15 project with strict TypeScript configuration and development environment setup.

**AI Prompt Guidelines**:
```
Initialize a new Next.js 15 project with App Router. Configure TypeScript with strict mode enabled.
Set up the following configurations:
1. tsconfig.json with strict: true, noImplicitAny: true, strictNullChecks: true
2. next.config.js with optimizations for production
3. .gitignore with proper exclusions
4. package.json with all required dependencies
5. .env.example file with database connection template
6. ESLint configuration with strict rules
7. Prettier configuration for code formatting

Install dependencies:
- next@15.x
- react@19.x
- react-dom@19.x
- typescript
- @types/node
- @types/react
- @types/react-dom
- prisma
- @prisma/client
- zod
- zustand
- tailwindcss
- postcss
- autoprefixer
```

**Definition of Done / QA Criteria**:
- [ ] Next.js 15 project initialized with App Router
- [ ] TypeScript compiles with zero errors in strict mode
- [ ] All dependencies installed and version-locked in package-lock.json
- [ ] tsconfig.json includes all strict compiler options
- [ ] ESLint and Prettier configurations operational
- [ ] Development server starts without errors (`npm run dev`)
- [ ] .env.example file created with DATABASE_URL placeholder

---

### Day 2: Integer-Based Prisma Schema & Database Setup

**Objective**: Create production-grade Prisma schema with integer-based fields for all decimal values, multi-tenant relations, and proper indexing.

**AI Prompt Guidelines**:
```
Create prisma/schema.prisma with the following requirements:
1. PostgreSQL datasource configuration
2. User model with tenantId (unique), email, name, timestamps
3. Course model with:
   - id (UUID), name, sks (Int 1-6), targetGrade (enum), targetThreshold (Int, default 8000)
   - tenantId (String, indexed), version (Int for optimistic locking)
   - createdAt, updatedAt timestamps
4. Component model with:
   - id (UUID), name, weight (Int 0-10000), achievedScore (Int?, nullable)
   - courseId (foreign key with onDelete: Cascade)
   - version (Int for optimistic locking)
   - createdAt, updatedAt timestamps
5. Notification model with:
   - id (UUID), courseId, tenantId, alertLevel, message, isRead (Boolean)
   - createdAt timestamp
6. Define composite indexes:
   - Course: [tenantId, createdAt]
   - Component: [courseId, weight]
   - Notification: [tenantId, isRead, createdAt]
7. Enum for TargetGrade: A, AB, B, BC, C, D, E
8. Enum for AlertLevel: NORMAL, WARNING, DANGER

Also create:
- prisma/seed.ts for development data seeding
- /lib/db.ts for Prisma singleton client instance
```

**Definition of Done / QA Criteria**:
- [ ] Prisma schema defines User, Course, Component, Notification models
- [ ] ALL decimal fields stored as Int (weight, achievedScore, targetThreshold)
- [ ] Composite indexes defined for performance optimization
- [ ] Foreign key cascade delete configured (Course -> Components)
- [ ] Version fields added to Course and Component for optimistic locking
- [ ] Enums defined for TargetGrade and AlertLevel
- [ ] `npx prisma generate` runs without errors
- [ ] `npx prisma migrate dev` creates initial migration successfully
- [ ] Prisma Client singleton instance created in /lib/db.ts
- [ ] Seed script populates test data with integer-based values

---

### Day 3: Multi-Tenant Authentication Middleware

**Objective**: Implement session-based authentication with strict multi-tenant isolation middleware.

**AI Prompt Guidelines**:
```
Create authentication system with multi-tenant isolation:
1. /lib/auth.ts - Authentication utilities:
   - Session validation functions
   - TenantId extraction from session
   - Token verification and expiration checks
2. /middleware.ts - Next.js middleware:
   - Protect all /app routes except /login
   - Validate session tokens
   - Attach tenantId to request context
   - Return 401 for invalid sessions
   - Return 403 for tenantId mismatches
3. /lib/session.ts - Session management:
   - createSession(userId, tenantId)
   - validateSession(token)
   - getTenantId(session)
4. /app/login/page.tsx - Login page (temporary mock for development):
   - Accept email input
   - Create/retrieve user with tenantId
   - Set session cookie
   - Redirect to dashboard
5. /lib/server-context.ts - Server-side context utilities:
   - getTenantIdFromRequest() - Extract tenantId from session
   - validateTenantAccess(tenantId, resourceTenantId) - Verify access

All database queries MUST include tenantId filter from session.
```

**Definition of Done / QA Criteria**:
- [ ] Middleware validates session on all protected routes
- [ ] TenantId extracted from session and attached to request context
- [ ] Unauthorized requests return 401 status code
- [ ] Forbidden requests (tenantId mismatch) return 403 status code
- [ ] Login page creates user session with tenantId
- [ ] Session cookies set with secure, httpOnly, sameSite flags
- [ ] getTenantIdFromRequest() utility function available for Server Actions
- [ ] All authentication code includes comprehensive error handling
- [ ] Session expiration enforced (e.g., 7 days)
- [ ] XSS and CSRF protections implemented

---

### Day 4: Global Brutalist CSS & Design System

**Objective**: Implement Industrial Brutalist design system with Tailwind CSS custom configuration and global styles.

**AI Prompt Guidelines**:
```
Configure Tailwind CSS for Industrial Brutalist design system:
1. tailwind.config.ts - Custom theme extending default:
   - colors: { brutal: { black: '#09090B', orange: '#FF4500', ... } }
   - fontFamily: { grotesk: 'Space Grotesk', mono: 'Space Mono', sans: 'Inter' }
   - borderWidth: { brutal: '2px' }
   - borderRadius: { brutal: '0px' }
2. /app/globals.css - Global styles:
   - @import Google Fonts: Space Grotesk, Space Mono, Inter
   - Tailwind directives: @tailwind base, components, utilities
   - Custom CSS variables for brutalist tokens
   - Base typography styles (h1-h6 with Space Grotesk, body with Inter)
   - Focus visible styles for accessibility
3. /app/layout.tsx - Root layout:
   - Apply font classes to html/body
   - Dark mode configuration (forced dark)
   - Meta tags for viewport and charset
4. /components/ui/ - Base UI components:
   - Button.tsx - Brutalist button with 2px border, no radius
   - Card.tsx - Container with rigid borders
   - Input.tsx - Form input with brutalist styling
   - Label.tsx - Form label component

Use class names like: bg-brutal-black, text-brutal-orange, border-brutal, rounded-brutal
```

**Definition of Done / QA Criteria**:
- [ ] Tailwind CSS configured with custom brutalist color palette
- [ ] Space Grotesk, Space Mono, Inter fonts loaded and applied
- [ ] Background color #09090B applied to all pages
- [ ] Primary accent color #FF4500 defined in theme
- [ ] Typography classes use correct font families
- [ ] All borders minimum 2px solid with sharp corners (border-radius: 0)
- [ ] Base UI components (Button, Card, Input, Label) created
- [ ] Components follow brutalist design constraints
- [ ] Contrast ratios meet WCAG 2.1 AA standards (4.5:1 body, 3:1 large text)
- [ ] Root layout applies fonts to html/body tags
- [ ] CSS compiles without errors

---

### Day 5: ACID Transaction Utilities & Validation Schemas

**Objective**: Create reusable transaction wrappers and Zod validation schemas for all data operations.

**AI Prompt Guidelines**:
```
Build production-grade utilities for data integrity:
1. /lib/transactions.ts - ACID transaction wrappers:
   - executeTransaction<T>(fn: (tx) => Promise<T>): Promise<Result<T>>
   - Result type: { success: boolean; data?: T; error?: string }
   - Automatic rollback on errors
   - Structured error logging
2. /lib/validations.ts - Zod schemas:
   - CourseSchema: name (string 1-100), sks (int 1-6), targetGrade (enum)
   - ComponentSchema: name (string 1-100), weight (int 1-10000), achievedScore (int? 0-10000)
   - ComponentsArraySchema: Validate array, ensure weights sum to 10000 (±10 tolerance)
   - ScoreUpdateSchema: achievedScore (int 0-10000), componentId (uuid)
3. /lib/converters.ts - Integer/Decimal conversion utilities:
   - toInteger(decimal: number): number - Multiply by 100, round
   - toDecimal(integer: number): number - Divide by 100
   - formatPercentage(integer: number): string - Convert to "XX.XX%"
   - formatScore(integer: number): string - Convert to "XX.XX"
4. /lib/validators.ts - Custom validation functions:
   - validateWeightSum(components: Component[]): boolean - Check sum === 10000
   - validateTenantOwnership(tenantId, resourceTenantId): boolean
   - sanitizeInput(input: string): string - XSS prevention

Use these utilities in ALL Server Actions and API routes.
```

**Definition of Done / QA Criteria**:
- [ ] executeTransaction wrapper handles all database operations
- [ ] Transaction automatically rolls back on errors
- [ ] Result<T> type provides consistent error handling pattern
- [ ] Zod schemas validate all input data before database operations
- [ ] ComponentsArraySchema validates weight sum equals 10000 (±10 tolerance)
- [ ] Integer/decimal conversion utilities tested and accurate
- [ ] formatPercentage displays values like "85.50%"
- [ ] formatScore displays values like "85.50"
- [ ] Validation errors return structured messages with field details
- [ ] All utilities include TypeScript strict types
- [ ] Unit tests written for conversion and validation functions
- [ ] XSS sanitization applied to all string inputs

---

## PHASE 2: COURSE & COMPONENT MANAGEMENT MODULE (Days 6-10)

### Day 6: Course CRUD Server Actions

**Objective**: Implement Create, Read, Update, Delete operations for Course entities with full validation and tenant isolation.

**AI Prompt Guidelines**:
```
Create Server Actions for Course management in /app/actions/courses.ts:
1. createCourse(formData: FormData): Promise<Result<Course>>
   - Extract tenantId from session (getTenantIdFromRequest)
   - Validate input with CourseSchema
   - Convert targetThreshold to integer (8000 for 'A')
   - Use executeTransaction wrapper
   - Return typed Result object
2. getCourses(): Promise<Result<Course[]>>
   - Extract tenantId from session
   - Filter by WHERE tenantId
   - Include component count
   - Order by createdAt DESC
3. getCourseById(courseId: string): Promise<Result<CourseWithComponents>>
   - Validate tenantId ownership
   - Include all components with integer values
   - Calculate cumulative actual and required score
4. updateCourse(courseId: string, data: Partial<Course>): Promise<Result<Course>>
   - Validate tenantId ownership
   - Use optimistic locking (version check)
   - Increment version on successful update
5. deleteCourse(courseId: string): Promise<Result<void>>
   - Validate tenantId ownership
   - Use transaction to cascade delete components
   - Log deletion for audit trail

Each Server Action must:
- Use 'use server' directive
- Extract tenantId from session
- Validate ownership before mutations
- Handle errors with try-catch
- Return Result<T> type
- Log operations with context
```

**Definition of Done / QA Criteria**:
- [ ] All 5 Server Actions (create, read, update, delete) implemented
- [ ] Every action validates tenantId ownership
- [ ] Every action returns Result<T> with success/error states
- [ ] CourseSchema validates all inputs before database operations
- [ ] createCourse stores targetThreshold as integer (8000 for 'A')
- [ ] getCourses filters by session tenantId
- [ ] updateCourse uses optimistic locking with version field
- [ ] deleteCourse cascades to delete all components
- [ ] All errors caught and returned with descriptive messages
- [ ] TypeScript strict mode passes with no errors
- [ ] Server Actions callable from client components

---

### Day 7: Course Dashboard Layout (Mobile & Desktop)

**Objective**: Build responsive course dashboard with mobile card stack and desktop table layout.

**AI Prompt Guidelines**:
```
Create responsive course dashboard at /app/dashboard/page.tsx:
1. Server Component that fetches courses using getCourses()
2. Mobile Layout (< 768px):
   - Vertical card stack
   - Each course in Card component
   - Display: name, SKS, target grade, component count
   - Tap card to navigate to course detail
3. Desktop Layout (≥ 768px):
   - High-density data table
   - Columns: Course Name | SKS | Target Grade | Components | Progress | Actions
   - Sortable columns
   - Row hover effects
4. Sidebar/Navigation:
   - Desktop: Fixed left sidebar (w-64) with navigation links
   - Mobile: Fixed bottom navigation bar with icons
5. Empty state when no courses exist
6. Loading states with skeleton components
7. Error boundary for error handling

Apply brutalist design: #09090B background, 2px borders, Space Grotesk headings, Space Mono numbers.
```

**Definition of Done / QA Criteria**:
- [ ] Dashboard renders course list from Server Component
- [ ] Mobile view (< 768px) shows vertical card stack
- [ ] Desktop view (≥ 768px) shows data table with all columns
- [ ] Fixed left sidebar (256px) visible on desktop
- [ ] Fixed bottom navigation visible on mobile
- [ ] Empty state displays when no courses exist
- [ ] Loading skeleton shown while fetching data
- [ ] Error boundary catches and displays errors gracefully
- [ ] All interactive elements minimum 44x44px on mobile
- [ ] Brutalist design tokens applied (colors, fonts, borders)
- [ ] Navigation links functional
- [ ] Page accessible via keyboard navigation

---

### Day 8: Component Weight Management UI

**Objective**: Create matrix-style input interface for adding/editing course components with real-time weight validation.

**AI Prompt Guidelines**:
```
Build Component Management interface at /app/courses/[id]/components/page.tsx:
1. Client Component with useOptimistic for instant feedback
2. Component input matrix:
   - Table with columns: Name | Weight (%) | Achieved Score | Actions
   - Input fields for name (text), weight (number 0-100), score (number 0-100)
   - Delete button for each row
   - Add Component button to insert new row
3. Real-time weight validation:
   - Calculate sum of all weights
   - Display total weight at bottom
   - Show error if total ≠ 100%
   - Disable save button if invalid
4. Weight sum indicator:
   - Green if sum === 100% (within 0.01 tolerance)
   - Red if sum ≠ 100%
   - Display "Total: XX.XX% / 100.00%"
5. Server Actions:
   - saveComponents(courseId, components[]): Validate weight sum, save all
   - deleteComponent(componentId): Delete single component
6. Optimistic updates for instant UI response
7. Revert on server error with toast notification

Convert weight percentages to integers (*100) before saving.
```

**Definition of Done / QA Criteria**:
- [ ] Matrix input UI displays all components for a course
- [ ] Add/delete component rows dynamically
- [ ] Weight input accepts decimal values (0.00 - 100.00)
- [ ] Real-time calculation of total weight sum
- [ ] Visual indicator shows green when sum = 100%, red otherwise
- [ ] Save button disabled when weight sum ≠ 100%
- [ ] saveComponents validates sum equals 10000 (±10 tolerance)
- [ ] Weight values converted to integers before database storage
- [ ] Optimistic UI updates before server confirmation
- [ ] Toast notifications for success/error states
- [ ] Validation error messages display field-level details
- [ ] TypeScript strict types for all component data
- [ ] Brutalist styling with Space Mono for number inputs

---

### Day 9: Component Score Entry & Auto-Calculation

**Objective**: Implement score entry for components with automatic recalculation of cumulative actual and required score.

**AI Prompt Guidelines**:
```
Create score entry system in /app/courses/[id]/page.tsx:
1. Course detail page displaying:
   - Course header: name, SKS, target grade
   - Components table with score input fields
   - Cumulative Actual score (calculated)
   - Required Score for remaining components (calculated)
   - Alert Level indicator (Normal/Warning/Danger)
2. /lib/analytics.ts - Calculation engine:
   - calculateCumulativeActual(components): number
     * Sum of (achievedScore * weight) for non-null scores
     * Convert from integers: (score/100) * (weight/100)
   - calculateRequiredScore(components, targetThreshold): number | null
     * Formula: (threshold - cumulativeActual) / (remainingWeight/100)
     * Handle division by zero (return null)
     * Allow negative values (target exceeded)
   - calculateAlertLevel(requiredScore): 'NORMAL' | 'WARNING' | 'DANGER'
     * DANGER: requiredScore > 100
     * WARNING: 90 ≤ requiredScore ≤ 100
     * NORMAL: requiredScore < 90 or null
3. Score input:
   - Number input (0.00 - 100.00) for each component
   - Debounced auto-save on blur
   - Optimistic update for instant feedback
4. Real-time recalculation:
   - Trigger on score update
   - Update cumulative actual
   - Update required score
   - Update alert level
   - Complete within 200ms performance target

All calculations use integer arithmetic, convert to decimal for display.
```

**Definition of Done / QA Criteria**:
- [ ] Course detail page displays all components with score inputs
- [ ] Score inputs accept decimal values (0.00 - 100.00)
- [ ] Score values converted to integers (*100) before database storage
- [ ] calculateCumulativeActual returns accurate weighted sum
- [ ] calculateRequiredScore handles division by zero gracefully
- [ ] calculateAlertLevel returns correct risk classification
- [ ] Alert level indicator displays with color coding (green/orange/red #FF4500)
- [ ] Calculations complete within 200ms of score update
- [ ] Optimistic UI updates before server confirmation
- [ ] Negative required scores displayed (target exceeded)
- [ ] NaN/Infinity handled with "N/A" or "Target Achieved"
- [ ] Space Mono font used for all numeric displays
- [ ] Server Action updateComponentScore validates tenantId ownership

---

### Day 10: Cascading Deletion & Transaction Integrity

**Objective**: Implement and test cascade deletion with ACID transaction guarantees.

**AI Prompt Guidelines**:
```
Implement robust deletion system with integrity checks:
1. /app/actions/components.ts - Component deletion:
   - deleteComponent(componentId): Delete single component
   - Validate tenantId ownership through parent course
   - Check if remaining components sum to 100% after deletion
   - Allow deletion if it enables rebalancing
   - Return validation result to client
2. /app/actions/courses.ts - Course deletion (enhance):
   - Wrap in Prisma transaction
   - Delete all associated components first
   - Delete course record
   - Log deletion with context (courseId, tenantId, timestamp)
   - Rollback entire transaction on any error
3. Confirmation dialogs:
   - "Delete Course" modal with warning message
   - Display count of components to be deleted
   - Require explicit confirmation
   - Show loading state during deletion
4. Test scenarios:
   - Delete course with 10 components (cascade successful)
   - Delete component causing weight sum ≠ 100% (validation error)
   - Simulate database error (transaction rollback)
   - Concurrent deletion attempts (optimistic locking conflict)

All deletions must use transactions with automatic rollback on failure.
```

**Definition of Done / QA Criteria**:
- [ ] Course deletion cascades to all components
- [ ] Deletion wrapped in Prisma transaction
- [ ] Transaction rolls back on any error
- [ ] Component deletion validates remaining weight sum
- [ ] Confirmation modal displays before deletion
- [ ] Modal shows count of components to be deleted
- [ ] Loading state shown during async deletion
- [ ] Success toast notification after deletion
- [ ] Error toast notification on failure
- [ ] Deleted course removed from dashboard list
- [ ] tenantId ownership validated before deletion
- [ ] Deletion logged with courseId, tenantId, timestamp
- [ ] Optimistic locking prevents concurrent deletion conflicts
- [ ] TypeScript strict types for all deletion operations

---

## PHASE 3: COMPUTATION ENGINE & OPTIMISTIC UI (Days 11-15)

### Day 11: Optimistic UI with React useOptimistic Hook

**Objective**: Integrate React useOptimistic for instant UI updates on score changes.

**AI Prompt Guidelines**:
```
Implement optimistic UI pattern for score updates:
1. /components/ScoreInput.tsx - Optimistic score input component:
   - Use React.useOptimistic hook
   - Display optimistic value immediately on change
   - Call Server Action in background
   - Reconcile with server response
   - Revert and show error toast on failure
   - Visual indicator for pending state (subtle opacity)
2. /app/courses/[id]/page.tsx - Integrate optimistic updates:
   - Wrap component list in optimistic state
   - Update cumulative actual optimistically
   - Update required score optimistically
   - Update alert level optimistically
   - Sync with server after confirmation
3. Pending state indicators:
   - Faded opacity (opacity-70) for pending updates
   - Small spinner icon next to value
   - Disabled during pending state
4. Error handling:
   - Revert optimistic update on server error
   - Display error toast with descriptive message
   - Re-enable input field
   - Log error with context
5. Network timeout handling:
   - Revert after 10 seconds if no response
   - Display timeout error message

Ensure calculations remain accurate during optimistic updates.
```

**Definition of Done / QA Criteria**:
- [ ] useOptimistic hook integrated into ScoreInput component
- [ ] UI updates instantly on score change (< 50ms)
- [ ] Server Action called in background after optimistic update
- [ ] Server response reconciles with optimistic state
- [ ] Optimistic update reverts on server error
- [ ] Pending state shows visual indicator (opacity, spinner)
- [ ] Input disabled during pending state
- [ ] Error toast displays on server rejection
- [ ] Timeout after 10 seconds with revert
- [ ] Cumulative actual recalculated optimistically
- [ ] Required score recalculated optimistically
- [ ] Alert level updated optimistically
- [ ] No race conditions with multiple rapid updates
- [ ] TypeScript strict types for optimistic state

---

### Day 12: Performance Optimization - Calculation Engine

**Objective**: Optimize analytics calculations to meet <200ms performance target.

**AI Prompt Guidelines**:
```
Optimize calculation engine in /lib/analytics.ts:
1. Performance profiling:
   - Add performance.now() measurements
   - Log calculation duration
   - Target: < 200ms for courses with 20 components
2. Optimization techniques:
   - Memoize calculation results with React.useMemo
   - Debounce rapid score changes (300ms delay)
   - Batch multiple updates into single calculation
   - Use integer arithmetic (avoid division until final display)
3. Calculation caching:
   - Cache cumulative actual per course
   - Invalidate cache on component score change
   - Use React state for cached values
4. Algorithm optimization:
   - Single-pass calculation for all metrics
   - Avoid redundant loops
   - Pre-calculate weight sums
5. Load testing:
   - Test with 1, 10, 20, 50 components
   - Measure calculation time for each
   - Ensure < 200ms for realistic scenarios (≤ 20 components)

Document performance benchmarks in code comments.
```

**Definition of Done / QA Criteria**:
- [ ] Performance measurements added to calculation functions
- [ ] Calculation completes in < 200ms for 20 components
- [ ] React.useMemo applied to expensive calculations
- [ ] Debouncing prevents excessive recalculations
- [ ] Integer arithmetic used throughout, decimal conversion only for display
- [ ] Single-pass algorithm calculates all metrics
- [ ] Calculation results cached and invalidated appropriately
- [ ] Load tested with 1, 10, 20, 50 components
- [ ] Performance benchmarks documented in code
- [ ] No performance regressions from previous implementation
- [ ] Memory usage remains constant (no leaks)
- [ ] TypeScript strict types maintained

---

### Day 13: React Server Components (RSC) Integration

**Objective**: Leverage RSC for server-side rendering with minimal client-side JavaScript.

**AI Prompt Guidelines**:
```
Migrate appropriate components to React Server Components:
1. Identify server vs client components:
   - Server: Dashboard list, course headers, static layouts
   - Client: Score inputs, modals, optimistic updates, forms
2. /app/dashboard/page.tsx - Server Component:
   - Fetch courses on server
   - No useState, useEffect
   - Stream data with Suspense boundaries
3. /app/courses/[id]/page.tsx - Hybrid approach:
   - Server Component wrapper fetches initial data
   - Client Component for interactive score inputs
   - Pass data as props to client components
4. Suspense boundaries:
   - Wrap async Server Components in Suspense
   - Provide loading fallbacks (skeleton components)
   - Stream content as it becomes available
5. Server Actions for mutations:
   - Use 'use server' directive
   - Call directly from client components
   - No API routes needed for these operations
6. Minimize client JavaScript bundle:
   - Move non-interactive UI to server components
   - Keep only interactive elements as client components
   - Use 'use client' directive sparingly

Goal: Reduce client bundle by 40% compared to pure client-side approach.
```

**Definition of Done / QA Criteria**:
- [ ] Dashboard page implemented as Server Component
- [ ] Course list fetched on server (no client-side fetch)
- [ ] Suspense boundaries provide loading states
- [ ] Skeleton components display while streaming
- [ ] Interactive components marked with 'use client'
- [ ] Non-interactive UI components remain server-rendered
- [ ] Server Actions called directly from client components
- [ ] No unnecessary API routes created
- [ ] Client JavaScript bundle reduced by ≥ 40%
- [ ] Initial page load faster (measure with Lighthouse)
- [ ] Time to First Byte (TTFB) < 500ms
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] TypeScript strict mode passes
- [ ] No hydration mismatches

---

### Day 14: Error Boundaries & Structured Error Handling

**Objective**: Implement comprehensive error boundaries and structured error handling across the application.

**AI Prompt Guidelines**:
```
Build robust error handling system:
1. /components/ErrorBoundary.tsx - React Error Boundary:
   - Catch errors in component tree
   - Display brutalist error UI
   - Log error with stack trace
   - Provide "Try Again" button
   - Reset error state on retry
2. /app/error.tsx - Next.js Error Component:
   - Global error handler for app routes
   - Display user-friendly error message
   - Sanitize error details (no stack traces to user)
   - Log full error server-side
3. /lib/logger.ts - Structured logging:
   - logError(error, context): Log with timestamp, level, message, stack
   - logInfo(message, context): Log informational messages
   - logWarning(message, context): Log warnings
   - Sanitize sensitive data (passwords, tokens)
   - Format as JSON for easy parsing
4. Server Action error handling:
   - Wrap all operations in try-catch
   - Return Result<T> with error messages
   - Log errors with context (tenantId, operation, timestamp)
   - Never expose internal errors to client
5. Toast notification system:
   - /components/Toast.tsx - Toast component
   - Color coded: Error (red), Warning (orange), Success (green), Info (blue)
   - Auto-dismiss after 5 seconds
   - Manual dismiss button
   - Queue multiple toasts

All errors must be caught, logged, and displayed gracefully.
```

**Definition of Done / QA Criteria**:
- [ ] ErrorBoundary component catches React errors
- [ ] Error UI displays user-friendly message
- [ ] "Try Again" button resets error state
- [ ] Global error.tsx handles uncaught errors
- [ ] Structured logger formats errors as JSON
- [ ] logError sanitizes sensitive data
- [ ] All Server Actions wrapped in try-catch
- [ ] Server errors logged with full context
- [ ] Client receives generic error messages (no stack traces)
- [ ] Toast notification system functional
- [ ] Toasts color-coded by severity
- [ ] Toasts auto-dismiss after 5 seconds
- [ ] Multiple toasts queued and displayed
- [ ] All errors tested: network, validation, database, unexpected
- [ ] TypeScript strict types for error objects

---

### Day 15: Data Export (JSON Serializer)

**Objective**: Implement JSON export functionality for all courses and components with calculated fields.

**AI Prompt Guidelines**:
```
Create data export system in /app/actions/export.ts:
1. exportAllData(): Promise<Result<ExportData>>
   - Fetch all courses for tenantId
   - Include all components with integer values
   - Calculate cumulative actual, required score, alert level
   - Convert integers to decimals for export
   - Structure as JSON:
     ```json
     {
       "version": "1.0",
       "exportedAt": "ISO 8601 timestamp",
       "tenantId": "uuid",
       "courses": [
         {
           "id": "uuid",
           "name": "Course Name",
           "sks": 3,
           "targetGrade": "A",
           "targetThreshold": 80.00,
           "cumulativeActual": 75.50,
           "requiredScore": 90.25,
           "alertLevel": "WARNING",
           "components": [
             {
               "id": "uuid",
               "name": "Quiz 1",
               "weight": 20.00,
               "achievedScore": 85.50
             }
           ]
         }
       ]
     }
     ```
   - Validate tenantId ownership
   - Generate within 2 seconds for 100 courses
2. /components/ExportButton.tsx - Export button component:
   - Trigger export on click
   - Show loading state during generation
   - Download JSON file automatically
   - Filename: "grades-export-YYYY-MM-DD.json"
   - Display success toast on completion

Export must include metadata and calculated fields.
```

**Definition of Done / QA Criteria**:
- [ ] exportAllData Server Action fetches all user courses
- [ ] All components included in export
- [ ] Integer values converted to decimals for export
- [ ] Cumulative actual, required score, alert level calculated
- [ ] JSON structure follows specified schema
- [ ] Export metadata includes version, timestamp, tenantId
- [ ] tenantId ownership validated before export
- [ ] Export completes within 2 seconds for 100 courses
- [ ] ExportButton triggers download automatically
- [ ] Filename includes current date
- [ ] Loading state shown during generation
- [ ] Success toast displayed on completion
- [ ] Error handling for failed exports
- [ ] TypeScript strict types for export data structure

---

## PHASE 4: EARLY WARNING SYSTEM & DATA PORTABILITY (Days 16-20)

### Day 16: Alert Level Color Coding & Visual Indicators

**Objective**: Implement color-coded alert system with visual danger indicators throughout UI.

**AI Prompt Guidelines**:
```
Build alert level visualization system:
1. /components/AlertBadge.tsx - Alert level badge component:
   - Props: alertLevel ('NORMAL' | 'WARNING' | 'DANGER')
   - Color mapping:
     * NORMAL: Green (#10B981)
     * WARNING: Orange (#FB8C00)
     * DANGER: Brutal Orange (#FF4500)
   - Display level name + icon
   - Brutalist styling (2px border, no radius)
2. Dashboard indicators:
   - Course card shows alert badge
   - Table row background tint for DANGER level
   - Sort by alert level (DANGER first)
3. Course detail indicators:
   - Large alert badge at top of page
   - Required score text color matches alert level
   - Danger message: "Target grade no longer achievable"
   - Warning message: "High score required on remaining components"
4. /lib/analytics.ts - Enhanced alert logic:
   - calculateAlertLevel includes edge cases
   - Handle null required score → NORMAL
   - Handle negative required score → NORMAL
   - Handle Infinity/NaN → NORMAL with warning
5. Animation for level changes:
   - Subtle fade transition when level changes
   - Pulse effect for DANGER level

Alert level must be instantly visible and unmistakable.
```

**Definition of Done / QA Criteria**:
- [ ] AlertBadge component displays correct color for each level
- [ ] NORMAL: green, WARNING: orange, DANGER: #FF4500 red
- [ ] Alert badge shown on dashboard course cards
- [ ] Alert badge shown on course detail page
- [ ] DANGER rows highlighted in table view
- [ ] Dashboard sortable by alert level
- [ ] DANGER level message displayed clearly
- [ ] WARNING level message displayed
- [ ] Required score text color matches alert level
- [ ] Null/negative required scores handled correctly
- [ ] Infinity/NaN handled gracefully
- [ ] Fade transition animation on level change
- [ ] Pulse effect on DANGER level (optional but recommended)
- [ ] Brutalist styling (2px border, sharp corners)
- [ ] Accessible contrast ratios maintained

---

### Day 17: Notification System for Danger Alerts

**Objective**: Implement in-app notification system that triggers when alert level changes to DANGER.

**AI Prompt Guidelines**:
```
Create notification system for alert level changes:
1. /app/actions/notifications.ts - Notification Server Actions:
   - createNotification(courseId, alertLevel, message): Create notification record
   - getNotifications(tenantId): Fetch all user notifications
   - markAsRead(notificationId): Mark notification read
   - deleteNotification(notificationId): Delete notification
2. Trigger logic in score update action:
   - After updating component score, recalculate alert level
   - If alert level changes from (NORMAL|WARNING) → DANGER:
     * Create notification with course name and details
     * Store in Notification table with tenantId
   - If alert level improves from DANGER → (NORMAL|WARNING):
     * Create "improvement" notification (optional)
3. /components/NotificationBell.tsx - Notification UI component:
   - Bell icon in navigation bar
   - Unread count badge (red #FF4500)
   - Dropdown panel on click
   - List notifications sorted by createdAt DESC
   - Mark as read on view
   - Delete button per notification
4. Notification message format:
   - "⚠️ DANGER: [Course Name] - Target grade 'A' is no longer achievable. Required score: >100%"
   - Include timestamp (relative: "2 hours ago")
5. Auto-cleanup:
   - Delete notifications older than 30 days
   - Run cleanup on server cron or during queries

Notifications must be real-time and attention-grabbing.
```

**Definition of Done / QA Criteria**:
- [ ] createNotification Server Action creates notification record
- [ ] Notification created when alert level changes to DANGER
- [ ] Notification includes courseId, tenantId, alertLevel, message
- [ ] getNotifications fetches user notifications sorted by date
- [ ] NotificationBell component displays unread count
- [ ] Count badge shows number of unread notifications
- [ ] Badge styled with #FF4500 red for visibility
- [ ] Dropdown panel displays notification list
- [ ] Notifications marked read when viewed
- [ ] Delete button removes notification
- [ ] Notification message includes course name and required score
- [ ] Timestamps displayed in relative format
- [ ] Notifications auto-deleted after 30 days
- [ ] tenantId isolation enforced for all notification operations
- [ ] TypeScript strict types for notification data

---

### Day 18: JSON Import Parser with Zod Validation

**Objective**: Implement data import functionality with comprehensive validation using Zod schemas.

**AI Prompt Guidelines**:
```
Build import system in /app/actions/import.ts:
1. ImportSchema - Zod schema for import validation:
   ```typescript
   const ImportSchema = z.object({
     version: z.string(),
     exportedAt: z.string().datetime(),
     courses: z.array(
       z.object({
         name: z.string().min(1).max(100),
         sks: z.number().int().min(1).max(6),
         targetGrade: z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'E']),
         components: z.array(
           z.object({
             name: z.string().min(1).max(100),
             weight: z.number().min(0.01).max(100),
             achievedScore: z.number().min(0).max(100).nullable(),
           })
         ).refine(
           (components) => {
             const sum = components.reduce((acc, c) => acc + c.weight, 0);
             return Math.abs(sum - 100) <= 0.01;
           },
           { message: "Component weights must sum to 100%" }
         ),
       })
     ),
   });
   ```
2. importData(jsonString: string): Promise<Result<ImportResult>>
   - Parse JSON string
   - Validate with ImportSchema
   - Convert decimal values to integers (*100)
   - Check for duplicate course names
   - Use transaction to import all courses and components
   - Assign tenantId from session to all imported records
   - Return summary: { coursesImported: number, componentsImported: number }
3. /components/ImportButton.tsx - Import UI:
   - File input for JSON upload
   - Validate file type (.json)
   - Read file content
   - Call importData Server Action
   - Display validation errors with field details
   - Show success toast with import summary
   - Refresh course list after import

Round-trip property: Export then import should produce equivalent data.
```

**Definition of Done / QA Criteria**:
- [ ] ImportSchema validates all required fields
- [ ] Schema validates component weights sum to 100%
- [ ] importData parses JSON string
- [ ] Validation errors return field-level details
- [ ] Decimal values converted to integers before storage
- [ ] Duplicate course names detected and rejected
- [ ] Import wrapped in transaction (all-or-nothing)
- [ ] tenantId from session assigned to all imported records
- [ ] Import summary returned (courses and components count)
- [ ] ImportButton allows JSON file upload
- [ ] File type validation (.json only)
- [ ] Validation errors displayed to user
- [ ] Success toast shows import summary
- [ ] Course list refreshes after successful import
- [ ] Round-trip property tested (export → import → export)
- [ ] TypeScript strict types for import data

---

### Day 19: Optimistic Locking & Version Concurrency Control

**Objective**: Implement optimistic locking to prevent race conditions during concurrent updates.

**AI Prompt Guidelines**:
```
Add optimistic locking to prevent concurrent update conflicts:
1. Enhance Prisma schema (already has version field):
   - Ensure Course and Component models have `version Int @default(0)`
2. Update Server Actions with version checking:
   - updateCourse(courseId, data, currentVersion): 
     * Include WHERE clause: { id: courseId, version: currentVersion }
     * Increment version in UPDATE: { version: { increment: 1 } }
     * If affected rows = 0, return conflict error
   - updateComponentScore(componentId, score, currentVersion):
     * Same version checking logic
     * Return conflict error if version mismatch
3. Client-side conflict handling:
   - Receive current version with initial data
   - Send version with update request
   - On conflict error:
     * Display "Data has been modified by another session" message
     * Offer "Refresh and Retry" button
     * Fetch latest data from server
     * Show differences between local and server state
4. /components/ConflictDialog.tsx - Version conflict modal:
   - Display conflict message
   - Show user's changes vs. current server state
   - Buttons: "Use Server Data" | "Keep My Changes"
   - "Use Server Data": Discard local changes, refresh
   - "Keep My Changes": Force update with new version (admin only)

Test with multiple browser tabs updating same course.
```

**Definition of Done / QA Criteria**:
- [ ] Course and Component models include version field
- [ ] version defaults to 0 on creation
- [ ] updateCourse includes WHERE version check
- [ ] version incremented on successful update
- [ ] Conflict detected when version mismatch occurs
- [ ] updateComponentScore includes version check
- [ ] Conflict error returned to client with current version
- [ ] Client receives and stores version with data
- [ ] Client sends version with update requests
- [ ] ConflictDialog displays on version conflict
- [ ] Dialog shows user changes vs. server state
- [ ] "Use Server Data" button discards local changes
- [ ] "Keep My Changes" available (admin/override scenario)
- [ ] Tested with concurrent updates in multiple tabs
- [ ] No data loss or corruption from race conditions
- [ ] TypeScript strict types for version handling

---

### Day 20: Data Portability Testing & Round-Trip Validation

**Objective**: Comprehensive testing of export/import functionality with round-trip property verification.

**AI Prompt Guidelines**:
```
Test data portability with comprehensive scenarios:
1. Test cases for export:
   - Export single course with 5 components
   - Export 10 courses with varying component counts
   - Export course with null achieved scores
   - Export course with negative required score (target exceeded)
   - Verify JSON schema matches specification
   - Verify calculated fields (cumulative, required score, alert level)
2. Test cases for import:
   - Import valid JSON with 1 course
   - Import valid JSON with 10 courses
   - Import JSON with invalid weight sum (should fail)
   - Import JSON with missing required fields (should fail)
   - Import JSON with invalid SKS (should fail)
   - Import JSON with duplicate course names (should fail)
3. Round-trip testing:
   - Create 5 courses with components in UI
   - Export to JSON
   - Delete all courses
   - Import same JSON
   - Verify all courses and components restored correctly
   - Verify weights, scores, names match original
   - Run this test 10 times to ensure consistency
4. Edge cases:
   - Import/export with 0 courses
   - Import/export with 100 courses (performance)
   - Import/export with special characters in names
   - Import/export with Unicode characters
5. Document test results:
   - Create test report in docs/testing/data-portability.md
   - Include pass/fail for each scenario
   - Note performance metrics

All tests must pass before proceeding to Phase 5.
```

**Definition of Done / QA Criteria**:
- [ ] Export creates valid JSON for all test cases
- [ ] Calculated fields included in export
- [ ] Import validates all required fields
- [ ] Import rejects invalid weight sums
- [ ] Import rejects invalid SKS values
- [ ] Import rejects duplicate course names
- [ ] Round-trip test passes 10/10 times
- [ ] Data integrity maintained through export/import cycle
- [ ] Edge cases handled gracefully
- [ ] Export completes in < 2 seconds for 100 courses
- [ ] Import completes in < 5 seconds for 100 courses
- [ ] Special characters and Unicode handled correctly
- [ ] Test report documented with results
- [ ] All tests automated (can be re-run easily)
- [ ] TypeScript strict mode passes for all test code

---

## PHASE 5: PERFORMANCE OPTIMIZATION & HARDENING (Days 21-24)

### Day 21: Database Indexing & Query Optimization

**Objective**: Implement comprehensive database indexing and optimize Prisma queries for production performance.

**AI Prompt Guidelines**:
```
Optimize database performance with strategic indexing:
1. Add indexes to Prisma schema:
   ```prisma
   model Course {
     @@index([tenantId, createdAt], name: "idx_course_tenant_created")
     @@index([tenantId, targetGrade], name: "idx_course_tenant_grade")
     @@unique([tenantId, name], name: "uniq_course_tenant_name")
   }
   
   model Component {
     @@index([courseId, weight], name: "idx_component_course_weight")
     @@index([courseId, achievedScore], name: "idx_component_course_score")
   }
   
   model Notification {
     @@index([tenantId, isRead, createdAt], name: "idx_notification_tenant_read_created")
   }
   ```
2. Optimize Prisma queries:
   - Use `select` to fetch only needed fields
   - Use `include` strategically for relations
   - Implement cursor-based pagination for large datasets
   - Use `findUnique` instead of `findFirst` when possible
3. Connection pooling configuration:
   - Configure Prisma Client with connection pool:
     ```
     datasource db {
       url      = env("DATABASE_URL")
       relationMode = "prisma"
     }
     ```
   - Pool size: min 10, max 50 connections
   - Connection timeout: 30 seconds
4. Query analysis:
   - Enable Prisma query logging in development
   - Identify slow queries (> 1 second)
   - Use EXPLAIN ANALYZE for complex queries
   - Document optimization strategies
5. Implement query result caching:
   - Cache frequently accessed read-only data
   - Use React cache() for Server Components
   - Invalidate cache on mutations

Run performance benchmarks before and after optimization.
```

**Definition of Done / QA Criteria**:
- [ ] All indexes added to Prisma schema
- [ ] Migration created and applied successfully
- [ ] Composite indexes on Course(tenantId, createdAt)
- [ ] Index on Component(courseId, weight)
- [ ] Index on Notification(tenantId, isRead, createdAt)
- [ ] Unique constraint on Course(tenantId, name)
- [ ] Prisma queries use select for field projection
- [ ] Cursor-based pagination implemented for large lists
- [ ] Connection pooling configured (min 10, max 50)
- [ ] Query logging enabled in development
- [ ] Slow queries identified and optimized
- [ ] Query result caching implemented
- [ ] Cache invalidation on mutations
- [ ] Course listing loads in < 500ms with 50 courses
- [ ] Component listing loads in < 200ms with 20 components
- [ ] Performance benchmarks documented

---

### Day 22: WCAG 2.1 AA Accessibility Implementation

**Objective**: Ensure full keyboard navigation, screen reader support, and WCAG 2.1 Level AA compliance.

**AI Prompt Guidelines**:
```
Implement accessibility features for WCAG 2.1 AA compliance:
1. Keyboard navigation:
   - All interactive elements accessible via Tab key
   - Visual focus indicators (2px outline, high contrast)
   - Skip to main content link
   - Escape key closes modals
   - Arrow keys navigate lists
   - Enter/Space activate buttons
2. ARIA attributes:
   - ARIA labels for all icons and icon-only buttons
   - ARIA live regions for dynamic content updates
   - ARIA roles for custom components (role="alert", role="dialog")
   - ARIA expanded/collapsed states for dropdowns
   - ARIA describedby for form field hints
3. Semantic HTML:
   - Use <button> for clickable actions (not <div>)
   - Use <a> for navigation links
   - Use <table> with <th> and <caption> for data tables
   - Use <label> associated with form inputs
   - Use <main>, <nav>, <header>, <footer> landmarks
4. Screen reader support:
   - Announce alert level changes (ARIA live)
   - Announce score updates (ARIA live="polite")
   - Announce errors (ARIA live="assertive")
   - Descriptive button labels (not just "Submit")
   - Table headers properly associated with cells
5. Color contrast:
   - Verify all text meets 4.5:1 ratio (body text)
   - Verify large text meets 3:1 ratio (≥18px or ≥14px bold)
   - Use tools like WebAIM Contrast Checker
   - Test with brutalist color palette
6. Zoom and text scaling:
   - Support browser zoom up to 200%
   - No horizontal scrolling at 200% zoom
   - Text remains readable when scaled
7. Document accessibility:
   - Create docs/accessibility.md with compliance checklist
   - Document keyboard shortcuts
   - Document screen reader testing results

Test with NVDA (Windows) and VoiceOver (macOS).
```

**Definition of Done / QA Criteria**:
- [ ] All interactive elements keyboard accessible
- [ ] Tab order logical and intuitive
- [ ] Focus indicators visible (2px outline, high contrast)
- [ ] Skip to main content link functional
- [ ] Escape key closes modals/dropdowns
- [ ] ARIA labels present on all icons
- [ ] ARIA live regions announce dynamic updates
- [ ] ARIA roles assigned to custom components
- [ ] Semantic HTML used throughout
- [ ] Screen reader announces alert level changes
- [ ] Screen reader announces score updates
- [ ] Color contrast ratios meet WCAG 2.1 AA (4.5:1 body, 3:1 large)
- [ ] Application usable at 200% browser zoom
- [ ] No horizontal scrolling at 200% zoom
- [ ] Tested with NVDA or VoiceOver
- [ ] Accessibility documentation created
- [ ] Compliance checklist completed

---

### Day 23: Production Logging & Error Monitoring

**Objective**: Implement sanitized enterprise-grade logging with structured error tracking.

**AI Prompt Guidelines**:
```
Build production logging infrastructure:
1. /lib/logger.ts - Enhanced structured logging:
   - Log levels: ERROR, WARN, INFO, DEBUG
   - JSON format for easy parsing
   - Fields: timestamp, level, message, context, stack trace
   - Separate logger instances: database, api, auth, general
2. Sensitive data sanitization:
   - Sanitize passwords, tokens, session IDs
   - Sanitize email addresses (partial masking)
   - Sanitize personal information (names, addresses)
   - Use allowlist approach for safe fields
3. Error aggregation:
   - Group similar errors by error message hash
   - Track error frequency (count)
   - Track first and last occurrence timestamps
   - Store in database table: ErrorLog(id, hash, message, count, firstSeen, lastSeen)
4. Performance monitoring:
   - Log database query duration
   - Log API route response times
   - Log Server Action execution times
   - Alert if execution time > threshold (e.g., 5 seconds)
5. Audit trail:
   - Log all data mutations (create, update, delete)
   - Include: userId, tenantId, action, timestamp, affected records
   - Store in AuditLog table
6. Log rotation and retention:
   - Rotate logs daily
   - Retain logs for 30 days
   - Archive old logs (compress and store)
7. Production vs. development logging:
   - Development: Log to console with colors
   - Production: Log to file and/or external service
   - Environment variable: LOG_LEVEL

Ensure no sensitive data leaked in production logs.
```

**Definition of Done / QA Criteria**:
- [ ] Structured logger with ERROR, WARN, INFO, DEBUG levels
- [ ] Logs formatted as JSON
- [ ] Timestamp, level, message, context, stack included
- [ ] Sensitive data sanitized (passwords, tokens, emails)
- [ ] Email masking functional (e.g., "u***@example.com")
- [ ] Error aggregation groups similar errors
- [ ] ErrorLog table tracks error frequency
- [ ] Database query duration logged if > 1 second
- [ ] API route response times logged
- [ ] Server Action execution times logged
- [ ] AuditLog table tracks all mutations
- [ ] Audit log includes userId, tenantId, action, timestamp
- [ ] Log rotation configured (daily)
- [ ] Log retention set to 30 days
- [ ] Development logs to console, production logs to file
- [ ] LOG_LEVEL environment variable functional
- [ ] No sensitive data in production logs (verified)

---

### Day 24: Rate Limiting & Final Production Hardening

**Objective**: Implement HTTP 429 rate limiting, final security hardening, and production deployment checklist.

**AI Prompt Guidelines**:
```
Final production hardening and rate limiting:
1. Rate limiting implementation:
   - /lib/rate-limit.ts - Rate limiter utility:
     * Use in-memory store (or Redis for multi-instance)
     * Sliding window algorithm
     * 100 requests per minute per user (tenantId)
     * Return HTTP 429 with Retry-After header
   - Apply to Server Actions:
     * Wrap high-frequency actions (score updates, component saves)
     * Return rate limit error to client
   - Apply to API routes:
     * Middleware checks rate limit before processing
2. Security headers:
   - next.config.js - Configure security headers:
     ```javascript
     headers: [
       { key: 'X-Frame-Options', value: 'DENY' },
       { key: 'X-Content-Type-Options', value: 'nosniff' },
       { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
       { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
     ]
     ```
   - Content Security Policy (CSP) header
3. Input sanitization audit:
   - Review all form inputs for XSS prevention
   - Ensure HTML entities escaped
   - Ensure SQL injection prevented (Prisma handles this)
   - Ensure CSRF protection enabled
4. Environment variable validation:
   - /lib/env.ts - Validate required env vars on startup:
     * DATABASE_URL
     * SESSION_SECRET
     * LOG_LEVEL
   - Fail fast if missing required variables
5. Production deployment checklist:
   - [ ] All environment variables set
   - [ ] Database migrations applied
   - [ ] TypeScript compiles with zero errors
   - [ ] All tests passing
   - [ ] Security headers configured
   - [ ] Rate limiting active
   - [ ] Logging configured for production
   - [ ] Error monitoring enabled
   - [ ] Performance benchmarks met
   - [ ] Accessibility compliance verified
   - [ ] Data portability tested
   - [ ] Documentation complete
6. Health check endpoint:
   - /app/api/health/route.ts:
     * Check database connectivity
     * Check critical dependencies
     * Return HTTP 200 if healthy, 503 if degraded

System is production-ready after all checks pass.
```

**Definition of Done / QA Criteria**:
- [ ] Rate limiting implemented with sliding window algorithm
- [ ] 100 requests/minute limit per tenantId enforced
- [ ] HTTP 429 returned when rate limit exceeded
- [ ] Retry-After header included in 429 response
- [ ] Rate limiter applied to high-frequency Server Actions
- [ ] Security headers configured in next.config.js
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Content Security Policy configured
- [ ] All form inputs sanitized for XSS
- [ ] CSRF protection verified
- [ ] Environment variable validation on startup
- [ ] Required env vars checked (DATABASE_URL, SESSION_SECRET)
- [ ] Health check endpoint returns 200 when healthy
- [ ] Health check verifies database connectivity
- [ ] Production deployment checklist completed
- [ ] All Phase 1-5 QA criteria met
- [ ] System ready for production deployment

---

## COMPLETION CRITERIA

Project004 is considered **COMPLETE** when:

1. ✅ All 24 daily sprints completed with QA criteria met
2. ✅ TypeScript compiles with zero errors in strict mode
3. ✅ All 4 Architectural Guardrails enforced throughout codebase
4. ✅ All 25 Functional Requirements satisfied with acceptance criteria met
5. ✅ Performance targets achieved (< 200ms calculations, < 500ms queries)
6. ✅ WCAG 2.1 Level AA accessibility compliance verified
7. ✅ Security hardening complete (rate limiting, sanitization, headers)
8. ✅ Data portability tested (export/import round-trip successful)
9. ✅ Production logging and error monitoring operational
10. ✅ Documentation complete (code comments, README, deployment guide)

---

## EXECUTION DISCIPLINE

**Remember**:
- Execute ONE day at a time
- Complete ALL QA criteria before proceeding
- No shortcuts, no placeholders, no TODO comments
- **QUALITY ABOVE EVERYTHING ELSE**

When ready to begin, await the command: **"Execute Day X"**

---

*End of Requirements Document*