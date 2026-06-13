# Implementation Plan: Project004 - Grade Optimizer & KPI Dashboard

## Overview

This implementation plan transforms the Academic Performance Management System design into a series of incremental coding tasks. The system is built with Next.js 15+, TypeScript (strict mode), PostgreSQL with Prisma ORM, and follows four mandatory architectural guardrails: Integer-Based Precision Mathematics, Strict Multi-Tenant Data Isolation, Industrial Brutalist Design System, and Production-Ready Code Standards.

The implementation follows a bottom-up approach: database schema → data access layer → business logic → UI components → integration. Each task builds on previous work with no orphaned code.

## Tasks

- [x] 1. Initialize project structure and database foundation
  - [x] 1.1 Set up Next.js 15+ project with TypeScript strict mode
    - Initialize Next.js project with App Router enabled
    - Configure TypeScript with strict mode (noImplicitAny, strictNullChecks, etc.)
    - Install dependencies: Prisma, Zod, Tailwind CSS, lucide-react
    - Configure Tailwind with Industrial Brutalist design tokens (#09090B background, #FF4500 accent, Space Grotesk/Space Mono/Inter fonts)
    - Set up ESLint with strict TypeScript rules
    - _Requirements: Guardrail 4.1, Guardrail 3.1, 13.1-13.5_

  - [x] 1.2 Create Prisma schema with integer-based precision
    - Define User model with tenantId unique constraint
    - Define Course model with integer targetThreshold field
    - Define Component model with integer weight and achievedScore fields
    - Define Notification model with AlertLevel enum
    - Add composite indexes: Course(tenantId, createdAt), Component(courseId, weight), Notification(tenantId, isRead, createdAt)
    - Configure cascade delete relationships
    - Add version fields for optimistic locking
    - _Requirements: Guardrail 1.1-1.7, 1.1, 2.1, 3.1, 7.1, 9.4, 9.7, 11.1-11.2_

  - [x] 1.3 Generate Prisma client and seed database
    - Run Prisma migration to create PostgreSQL tables
    - Generate TypeScript types from Prisma schema
    - Create seed script with sample tenant, courses, and components
    - Verify integer storage for weights and scores (0-10000 range)
    - _Requirements: 14.2, Guardrail 1.1-1.3_


- [ ] 2. Implement core utility libraries
  - [x] 2.1 Create integer-decimal conversion utilities
    - Implement `toInteger(decimal: number): number` function (multiply by 100)
    - Implement `toDecimal(integer: number): number` function (divide by 100)
    - Implement `formatPercentage(integer: number): string` function (e.g., "85.50%")
    - Implement `formatScore(integer: number): string` function (e.g., "85.50")
    - Add comprehensive JSDoc comments with examples
    - _Requirements: Guardrail 1.4-1.6_

  - [x] 2.2 Write property test for integer-decimal round-trip
    - **Property 11: Integer-Decimal Conversion Round-Trip**
    - **Validates: Requirements Guardrail 1**
    - Use fast-check to generate random decimals [0.00, 100.00]
    - Assert toDecimal(toInteger(d)) equals d rounded to 2 decimal places
    - Test edge cases: 0.00, 100.00, 0.01, 99.99

  - [x] 2.3 Create Zod validation schemas
    - Define CourseSchema (name: string 1-100 chars, sks: int 1-6, targetGrade: enum)
    - Define ComponentSchema (name: string 1-100 chars, weight: int 1-10000, achievedScore: int 0-10000 nullable)
    - Define ComponentsArraySchema with weight sum validation (10000 ±10 tolerance)
    - Define ScoreUpdateSchema (componentId: UUID, achievedScore: int 0-10000 nullable)
    - Export all schemas with JSDoc comments
    - _Requirements: 14.1, 14.3-14.7, 1.5-1.6, 2.2, 3.2_

  - [ ]* 2.4 Write property test for weight sum validation
    - **Property 5: Component Weight Sum Invariant**
    - **Validates: Requirements 2.3, 2.5, 2.6, 14.4**
    - Use fast-check to generate component arrays with random weights
    - Generate arrays that sum to exactly 10000 (should pass)
    - Generate arrays that sum to 10010 (within tolerance, should pass)
    - Generate arrays that sum to 9000 (outside tolerance, should fail)
    - Assert ComponentsArraySchema validation behaves correctly

  - [x] 2.5 Create transaction utility wrapper
    - Implement `executeTransaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<Result<T>>`
    - Wrap Prisma transaction logic with automatic rollback on error
    - Return typed Result discriminated union { success: boolean; data?: T; error?: string }
    - Add error logging with stack traces (sanitize sensitive data)
    - _Requirements: 9.1-9.3, 9.5, Guardrail 4.4-4.5_


- [x] 3. Build analytics calculation engine
  - [x] 3.1 Implement cumulative actual score calculation
    - Create `calculateCumulativeActual(components: Array<{weight: number; achievedScore: number | null}>): number`
    - Use integer arithmetic: sum((achievedScore * weight) / 10000) for non-null scores
    - Convert result to decimal and round to 2 decimal places
    - Handle all-null scores case (return 0.00)
    - Add JSDoc with formula explanation
    - _Requirements: 4.1-4.3_

  - [ ]* 3.2 Write property test for cumulative actual calculation
    - **Property 6: Cumulative Actual Calculation Correctness**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Use fast-check to generate component arrays with random integer weights and scores
    - Calculate expected result using precise formula
    - Assert calculated result matches expected (with 0.01 tolerance for rounding)
    - Test edge cases: all scores null, single component, all components complete

  - [x] 3.3 Implement required score calculation
    - Create `calculateRequiredScore(components: Array<{weight: number; achievedScore: number | null}>, targetThreshold: number): number | null`
    - Calculate remainingWeight as sum of weights with null achievedScore
    - Return null if remainingWeight equals 0
    - Use formula: (targetThreshold / 100 - cumulativeActual) / (remainingWeight / 100)
    - Allow negative results (target already exceeded)
    - Round result to 2 decimal places
    - _Requirements: 5.1-5.6_

  - [ ]* 3.4 Write property test for required score calculation
    - **Property 7: Required Score Calculation Correctness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
    - Generate scenarios: partial completion, full completion, over-achievement
    - Assert formula correctness with 0.01 tolerance
    - Test edge cases: remainingWeight = 0 (should return null), negative required scores

  - [x] 3.5 Implement alert level classification
    - Create `calculateAlertLevel(requiredScore: number | null): AlertLevel`
    - Return DANGER when requiredScore > 100.00
    - Return WARNING when 90.00 <= requiredScore <= 100.00
    - Return NORMAL when requiredScore < 90.00, null, or negative
    - _Requirements: 6.1-6.4_

  - [ ]* 3.6 Write property test for alert level classification
    - **Property 8: Alert Level Classification**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
    - Test boundary values: 89.99 (NORMAL), 90.00 (WARNING), 100.00 (WARNING), 100.01 (DANGER)
    - Test null and negative inputs (should return NORMAL)
    - Assert exhaustive enum coverage

  - [x] 3.7 Create unified analytics calculation function
    - Implement `calculateCourseAnalytics(components, targetThreshold): CourseAnalytics`
    - Single-pass optimization: calculate all metrics in one iteration
    - Return object with cumulativeActual, requiredScore, remainingWeight, alertLevel, isTargetAchievable
    - Add performance requirement: complete within 200ms for up to 20 components
    - _Requirements: 4.4, 5.6, 19.1_


- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement session management and multi-tenant middleware
  - [x] 5.1 Create session authentication middleware
    - Implement Next.js middleware to validate user session
    - Extract tenantId from authenticated session
    - Attach tenantId to request context for Server Actions
    - Return 401 Unauthorized if session invalid
    - Add security headers (CSRF protection, XSS prevention)
    - _Requirements: 8.1-8.2, 8.5-8.7, Guardrail 2.4_

  - [x] 5.2 Create tenant isolation helper functions
    - Implement `getTenantId(session): string` to extract tenantId from session
    - Implement `validateTenantOwnership(resourceTenantId: string, sessionTenantId: string): boolean`
    - Return 403 Forbidden if tenantId mismatch detected
    - Add audit logging for all tenantId validation failures
    - _Requirements: 7.1-7.4, 8.3-8.4, Guardrail 2.1-2.6_

  - [x]* 5.3 Write integration test for multi-tenant isolation
    - **Property 9: Multi-Tenant Data Isolation**
    - **Validates: Requirements 7.1-7.4, 8.4, Guardrail 2**
    - Create two test tenants with separate courses
    - Attempt cross-tenant data access via queries and mutations
    - Assert all operations return 403 Forbidden or empty results
    - Verify database queries include tenantId filter

- [x] 6. Build Server Actions for course management
  - [x] 6.1 Implement createCourse Server Action
    - Define "use server" function with CourseSchema validation
    - Extract tenantId from session
    - Map targetGrade to integer targetThreshold (A=8000, AB=7500, etc.)
    - Insert Course record with Prisma
    - Return Result<Course> with success/error
    - _Requirements: 1.1-1.2, 7.1, Guardrail 4.1-4.5_

  - [x]* 6.2 Write property test for course CRUD preservation
    - **Property 1: Course CRUD Preservation**
    - **Validates: Requirements 1.1, 1.2, 2.1, 3.1**
    - Use fast-check to generate random course data (name, sks 1-6, targetGrade)
    - Create course via Server Action
    - Retrieve course via getCourseById
    - Assert all fields preserved including default targetGrade "A"
    - Assert targetThreshold stored as integer (8000 for "A")

  - [x] 6.3 Implement getCourses Server Action
    - Extract tenantId from session
    - Query Prisma: `where: { tenantId }`, order by createdAt DESC
    - Include components count in response
    - Return Result<Course[]>
    - _Requirements: 7.2, 11.3-11.6_

  - [x] 6.4 Implement getCourseById Server Action
    - Validate courseId is valid UUID
    - Query Prisma with tenantId filter and include components
    - Calculate analytics using calculateCourseAnalytics
    - Return 404 if course not found or tenantId mismatch
    - Return Result<Course & { analytics: CourseAnalytics }>
    - _Requirements: 7.2, 7.4_


  - [x] 6.5 Implement updateCourse Server Action
    - Validate courseId and partial course data with Zod
    - Use Prisma update with optimistic locking (version field increment)
    - Handle concurrent modification with 409 Conflict error
    - Validate tenantId ownership
    - Return Result<Course>
    - _Requirements: 1.3, 7.4, 9.6_

  - [x] 6.6 Implement deleteCourse Server Action
    - Validate courseId is valid UUID
    - Validate tenantId ownership
    - Use executeTransaction to wrap delete operation
    - Cascade delete components (handled by Prisma schema)
    - Return Result<void>
    - _Requirements: 1.4, 9.1-9.3_

  - [x]* 6.7 Write integration test for cascade deletion
    - **Property 2: Cascade Deletion Completeness**
    - **Validates: Requirements 1.4**
    - Create course with 5 components
    - Delete course via Server Action
    - Query database for orphaned components
    - Assert zero orphaned records remain

- [x] 7. Build Server Actions for component management
  - [x] 7.1 Implement saveComponents Server Action
    - Validate courseId and components array with ComponentsArraySchema
    - Verify weight sum equals 10000 (±10 tolerance) via Zod
    - Use executeTransaction for atomicity
    - Delete existing components for courseId
    - Insert new components with integer weights and scores
    - Return Result<Component[]>
    - _Requirements: 2.1-2.7, 9.1-9.3, Guardrail 1.1_

  - [x]* 7.2 Write property test for weight sum enforcement
    - **Property 5: Component Weight Sum Invariant**
    - **Validates: Requirements 2.3, 2.5, 2.6, 14.4**
    - Generate component arrays with weights summing to 10000 (should succeed)
    - Generate arrays summing to 9500 (should fail with validation error)
    - Generate arrays summing to 10005 (within tolerance, should succeed)
    - Assert transaction rollback on validation failure

  - [x] 7.3 Implement updateComponentScore Server Action
    - Validate componentId and achievedScore with ScoreUpdateSchema
    - Validate achievedScore is integer 0-10000 or null
    - Use Prisma update with version increment
    - Trigger analytics recalculation
    - Return Result<Component>
    - _Requirements: 3.1-3.5, Guardrail 1.1_

  - [x] 7.4 Implement deleteComponent Server Action
    - Validate componentId is valid UUID
    - Validate tenantId ownership via courseId relation
    - Check remaining components still sum to 10000 after deletion
    - Use executeTransaction with validation
    - Return Result<void>
    - _Requirements: 2.6, 7.3, 9.1-9.3_


- [x] 8. Build Server Actions for notifications
  - [ ] 8.1 Implement getNotifications Server Action
    - Extract tenantId from session
    - Query Prisma: `where: { tenantId }`, order by createdAt DESC
    - Return Result<Notification[]>
    - _Requirements: 20.3_

  - [ ] 8.2 Implement markNotificationRead Server Action
    - Validate notificationId is valid UUID
    - Validate tenantId ownership
    - Update isRead to true
    - Return Result<void>
    - _Requirements: 20.4_

  - [ ] 8.3 Implement markAllNotificationsRead Server Action
    - Extract tenantId from session
    - Update all notifications: `where: { tenantId, isRead: false }`, set isRead to true
    - Return Result<void>
    - _Requirements: 20.5_

  - [ ] 8.4 Implement notification creation logic
    - Create helper function: `createAlertNotification(courseId, tenantId, alertLevel, message)`
    - Trigger notification creation when alertLevel changes to DANGER
    - Add to updateComponentScore logic
    - _Requirements: 6.5, 20.1_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Industrial Brutalist design system tokens
  - [x] 10.1 Configure Tailwind with custom brutalist tokens
    - Extend Tailwind config with custom colors: brutal-black (#09090B), brutal-orange (#FF4500), warning-orange (#FB8C00), success-green (#10B981)
    - Add custom font families: Space Grotesk (headings), Space Mono (numeric), Inter (body)
    - Configure custom border widths: border-brutal (2px solid)
    - Set default border-radius to 0 (sharp corners)
    - Add custom shadow utilities for hard shadows
    - _Requirements: Guardrail 3, 13.1-13.5_

  - [x] 10.2 Create reusable UI component primitives
    - Create Button component with brutalist styling (border-2, rounded-none, hover hard shadow)
    - Create Card component (#09090B background, #E2E8F0 border)
    - Create Input component (border-2, focus ring with #FF4500 accent)
    - Create Badge component for alert levels (DANGER=#FF4500, WARNING=#FB8C00, NORMAL=#10B981)
    - Ensure all components use lucide-react icons with strokeWidth={2.5}, size={20}, high-contrast colors
    - Add ARIA labels for accessibility
    - _Requirements: 13.6-13.7, Guardrail 3_

  - [x] 10.3 Create responsive layout shell components
    - Create DesktopSidebar component (w-64, fixed left, visible md:block)
    - Create MobileBottomNav component (fixed bottom, visible md:hidden)
    - Create PageContainer component with proper padding and max-width
    - Ensure all interactive elements are minimum 44x44px on mobile
    - _Requirements: 12.1-12.7_


- [x] 11. Build dashboard page (React Server Component)
  - [x] 11.1 Create dashboard page route (app/dashboard/page.tsx)
    - Fetch courses using getCourses Server Action
    - Render course list as Server Component with analytics preview
    - Display cumulative actual, required score, alert level badge for each course
    - Use brutalist Card components with Space Mono for numeric displays
    - Add "Create Course" button linking to course creation form
    - _Requirements: 11.3-11.6, 13.3-13.4, 19.2-19.3_

  - [x] 11.2 Implement responsive course list layout
    - Mobile (<768px): vertical card stack with Course component
    - Desktop (≥768px): high-density table with columns (Name, SKS, Target, Cumulative, Required, Alert)
    - Add lucide-react icons for navigation and actions (strokeWidth={2.5})
    - _Requirements: 12.1-12.4_

  - [x] 11.3 Write integration test for dashboard data fetching
    - Create test course with components
    - Assert dashboard displays correct cumulative actual and required score
    - Verify alert level badge renders with correct color
    - Test mobile and desktop responsive layouts

- [x] 12. Build course creation form (Client Component with optimistic updates)
  - [x] 12.1 Create CourseForm client component
    - Implement form with fields: name (text), sks (select 1-6), targetGrade (select A-E)
    - Use React Hook Form with Zod validation (CourseSchema)
    - Call createCourse Server Action on submit
    - Display inline validation errors with field-level details
    - Add brutalist Button with "Create Course" label
    - _Requirements: 1.1-1.2, 14.3-14.7, 16.1_

  - [x] 12.2 Implement optimistic UI updates
    - Use React useOptimistic hook to instantly add course to UI
    - Show pending state with visual indicator (opacity or border style)
    - Reconcile with server response on success
    - Revert optimistic update on error and display toast notification
    - _Requirements: 10.1-10.6_

  - [x] 12.3 Add error handling and user feedback
    - Display validation errors below form fields
    - Show toast notifications for network errors (5-second auto-dismiss)
    - Use color coding: error (red #FF4500), success (green #10B981)
    - Handle timeout after 10 seconds with error message
    - _Requirements: 16.1-16.6_


- [x] 13. Build course detail page with component matrix
  - [x] 13.1 Create course detail page route (app/course/[courseId]/page.tsx)
    - Fetch course with components using getCourseById Server Action
    - Display course header with name, SKS, target grade, and analytics summary
    - Render ComponentMatrix client component for interactive score entry
    - Use brutalist typography: Space Grotesk for headings, Space Mono for scores
    - Add "Edit Course" and "Delete Course" buttons with lucide-react icons (strokeWidth={3})
    - _Requirements: 19.1-19.3, 13.3-13.4_

  - [x] 13.2 Implement ComponentMatrix client component
    - Display table with columns: Component Name, Weight (%), Achieved Score, Contribution
    - Make achieved score cells editable (inline input)
    - Debounce score updates (300ms) before calling updateComponentScore
    - Display cumulative actual and required score in footer row
    - Update alert level badge reactively when scores change
    - _Requirements: 3.3-3.5, 19.1-19.2_

  - [x] 13.3 Add real-time analytics calculation
    - Recalculate analytics on every score update within 200ms
    - Update cumulative actual display
    - Update required score display (handle null, negative, >100)
    - Update alert level badge with color transition
    - Display "N/A" for edge cases (NaN, Infinity)
    - _Requirements: 4.4, 5.6, 6.6, 16.6, 19.1_

  - [x] 13.4 Write integration test for real-time updates
    - Create course with 3 components
    - Update achieved score via UI interaction
    - Assert cumulative actual recalculates within 200ms
    - Assert required score updates correctly
    - Assert alert level badge changes when thresholds crossed

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Build component management UI
  - [x] 15.1 Create ComponentEditor client component
    - Display form for adding/editing components
    - Fields: name (text), weight (number input for decimal, converted to integer)
    - Validate weight sum equals 100.00% in real-time
    - Display weight sum with color indicator (red if invalid, green if valid)
    - Call saveComponents Server Action on submit
    - _Requirements: 2.1-2.7, 14.4_

  - [x] 15.2 Implement weight rebalancing helper
    - Add "Auto-balance weights" button to distribute weights evenly
    - Calculate equal weights as 10000 / componentCount
    - Handle rounding to ensure sum equals exactly 10000
    - Update all component weight inputs
    - _Requirements: 2.4-2.6_

  - [x]* 15.3 Write integration test for weight validation
    - **Property 5: Component Weight Sum Invariant**
    - **Validates: Requirements 2.3, 2.5, 2.6, 14.4**
    - Submit components with weights summing to 99.50% (should fail)
    - Submit components summing to 100.05% (within tolerance, should succeed)
    - Verify transaction rollback on validation failure


- [x] 16. Build notification system UI
  - [x] 16.1 Create NotificationPanel client component
    - Fetch notifications using getNotifications Server Action
    - Display notifications sorted by createdAt DESC
    - Show unread count badge in navigation bar
    - Use brutalist Badge components with alert level colors
    - Mark notification as read on click
    - _Requirements: 20.1-20.4_

  - [x] 16.2 Implement notification bell icon with unread count
    - Add bell icon to navigation bar (lucide-react Bell, strokeWidth={2.5})
    - Display unread count badge (#FF4500 background)
    - Toggle NotificationPanel on click
    - Update unread count reactively
    - _Requirements: 20.2_

  - [x] 16.3 Add notification creation trigger
    - Integrate createAlertNotification into updateComponentScore
    - Detect alertLevel changes from previous state
    - Create notification when alertLevel becomes DANGER
    - Include course name and required score in message
    - _Requirements: 6.5, 20.1_

- [x] 17. Implement data export functionality
  - [x] 17.1 Create exportData Server Action
    - Extract tenantId from session
    - Query all courses with components for tenant
    - Calculate analytics for each course
    - Build JSON structure with metadata (timestamp, tenantId)
    - Return Result<string> with JSON content
    - _Requirements: 17.1-17.4_

  - [x]* 17.2 Write property test for export data completeness
    - **Property 13: Export Data Completeness**
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4**
    - Create tenant with multiple courses and components
    - Export data via Server Action
    - Assert JSON contains all courses, components, calculated fields
    - Assert only tenant's data included (no cross-tenant leakage)

  - [x] 17.3 Create ExportButton client component
    - Add "Export Data" button to dashboard
    - Call exportData Server Action on click
    - Trigger browser download with generated JSON file
    - Display success toast notification
    - Handle errors with user-friendly messages
    - _Requirements: 17.5-17.6_


- [x] 18. Implement data import functionality
  - [x] 18.1 Create Parser utility for JSON import
    - Implement `parseImportData(jsonString: string): Result<ImportData>`
    - Validate JSON structure with Zod schema
    - Validate component weights sum to 10000 per course
    - Validate all required fields present
    - Return descriptive errors with line/column information
    - _Requirements: 18.1-18.2, 18.5-18.6_

  - [x] 18.2 Create importData Server Action
    - Parse JSON using Parser utility
    - Extract tenantId from session and assign to all imported courses
    - Use executeTransaction for atomic import
    - Validate no duplicate course names within tenant
    - Return Result<Course[]> with imported courses
    - _Requirements: 18.7, 9.1-9.3_

  - [x]* 18.3 Write property test for import-export round-trip
    - **Property 14: Import-Export Round-Trip Preservation**
    - **Validates: Requirements 18.1, 18.3, 18.4**
    - Use fast-check to generate random course and component data
    - Export data to JSON
    - Import JSON back into system
    - Assert all fields preserved exactly (names, weights, scores, SKS, target grades)

  - [x] 18.4 Create ImportButton client component
    - Add "Import Data" button to dashboard
    - Show file picker for JSON file selection
    - Read file content and call importData Server Action
    - Display validation errors with field-level details
    - Show success toast with imported course count
    - _Requirements: 18.1-18.2_

  - [x]* 18.5 Write property test for parser error reporting
    - **Property 15: Parser Error Reporting**
    - **Validates: Requirements 18.2, 18.6**
    - Generate invalid JSON (malformed syntax, missing fields, invalid ranges)
    - Assert Parser returns descriptive error messages
    - Verify line/column information included for malformed JSON

- [x] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [x] 20. Implement course update and delete functionality
  - [x] 20.1 Create CourseEditForm client component
    - Reuse CourseForm component with pre-populated values
    - Call updateCourse Server Action on submit
    - Handle optimistic locking conflicts with 409 Conflict error
    - Display version conflict message to user
    - Use optimistic updates with reconciliation
    - _Requirements: 1.3, 9.6, 10.1-10.6_

  - [x] 20.2 Create DeleteCourseButton client component
    - Add "Delete Course" button with confirmation dialog
    - Use brutalist modal with #09090B background and #FF4500 accent
    - Call deleteCourse Server Action on confirm
    - Redirect to dashboard on success
    - Display error toast on failure
    - _Requirements: 1.4_

  - [x]* 20.3 Write integration test for optimistic locking
    - Simulate concurrent course updates from two sessions
    - Assert first update succeeds
    - Assert second update returns 409 Conflict
    - Verify database contains only first update

- [x] 21. Add audit trail and timestamp displays
  - [x] 21.1 Display createdAt and updatedAt timestamps
    - Format timestamps as ISO 8601 strings
    - Convert to user's local timezone for display
    - Add "Last updated" label to course detail page
    - Use Space Mono font for timestamp displays
    - _Requirements: 15.1-15.6_

  - [x] 21.2 Create RelativeTime component
    - Display relative time strings ("2 hours ago", "Last week")
    - Use browser Intl.RelativeTimeFormat API
    - Add full timestamp in title attribute on hover
    - _Requirements: 15.4_

- [x] 22. Implement error boundaries and fallback UI
  - [x] 22.1 Create global Error Boundary component
    - Wrap app root with React Error Boundary
    - Display brutalist error page with #FF4500 accent
    - Log errors with stack traces to console/monitoring
    - Provide "Try Again" button to reset boundary
    - _Requirements: Guardrail 4.8_

  - [x] 22.2 Create loading states for Server Components
    - Add loading.tsx files for dashboard and course detail routes
    - Display brutalist skeleton loaders with #09090B background
    - Use lucide-react Loader icon (strokeWidth={2.5}) with spin animation
    - _Requirements: 19.4_

  - [x] 22.3 Add 404 Not Found page
    - Create not-found.tsx with brutalist styling
    - Display "Course Not Found" message
    - Add "Back to Dashboard" button with lucide-react ArrowLeft icon
    - _Requirements: 6.4_


- [ ] 23. Add accessibility features
  - [ ] 23.1 Implement keyboard navigation
    - Ensure all interactive elements focusable with Tab key
    - Add visible focus indicators with #FF4500 ring
    - Support Enter key for button activation
    - Support Escape key to close modals
    - _Requirements: Guardrail 3_

  - [ ] 23.2 Add ARIA labels and semantic HTML
    - Use semantic HTML5 elements (nav, main, article, section)
    - Add aria-label to icon-only buttons
    - Add aria-hidden="true" to decorative lucide-react icons
    - Add aria-live regions for toast notifications
    - Ensure minimum contrast ratio 4.5:1 for body text
    - _Requirements: 13.8-13.9, Guardrail 3_

  - [ ] 23.3 Add screen reader support
    - Add visually-hidden labels for form inputs
    - Announce optimistic updates to screen readers
    - Add role="status" for analytics displays
    - Test with NVDA or VoiceOver
    - _Requirements: 13.9_

- [ ] 24. Performance optimization
  - [ ] 24.1 Add database query optimization
    - Review Prisma queries for N+1 problems
    - Use select and include clauses to fetch only required fields
    - Add pagination for course listings (page size 50)
    - Verify composite indexes used in query plans
    - _Requirements: 11.3-11.6_

  - [ ] 24.2 Implement React Server Component streaming
    - Use Suspense boundaries for parallel data fetching
    - Stream course list and analytics calculations separately
    - Display skeleton loaders during streaming
    - _Requirements: 19.4-19.5_

  - [ ]* 24.3 Write performance test for calculation engine
    - **Property 12: Calculation Performance Under Load**
    - **Validates: Requirements 4.4, 5.6**
    - Generate course with 20 components
    - Measure time to calculate analytics
    - Assert completion within 200ms
    - Test with integer arithmetic vs floating-point (verify integer faster)

- [ ] 25. Final integration and polish
  - [ ] 25.1 Review all TypeScript strict mode compliance
    - Run `tsc --noEmit` and verify zero errors
    - Remove any remaining `any` types
    - Add explicit return types to all functions
    - Add JSDoc comments to public APIs
    - _Requirements: Guardrail 4.1-4.3_

  - [ ] 25.2 Test cross-browser compatibility
    - Test on Chrome, Firefox, Safari
    - Verify CSS Grid and Flexbox layouts
    - Test touch interactions on mobile Safari
    - Verify Space Grotesk and Space Mono fonts load correctly
    - _Requirements: 12.1-12.7_

  - [ ] 25.3 Security audit and hardening
    - Review session management for XSS/CSRF vulnerabilities
    - Verify all user inputs validated with Zod
    - Check tenantId isolation on all queries
    - Add rate limiting to Server Actions (future enhancement)
    - Sanitize error messages to prevent information disclosure
    - _Requirements: 8.5-8.7, Guardrail 2_


- [ ] 26. Final checkpoint - Complete system validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- **Optional Tasks**: Tasks marked with `*` are optional property-based tests that validate correctness properties. These can be skipped for faster MVP but are recommended for production quality.
- **Testing Strategy**: Property-based tests (using fast-check) validate universal properties, while integration tests validate user workflows.
- **Integer Precision**: All calculations use integer arithmetic (multiply by 100 for storage, divide by 100 for display) to eliminate floating-point errors.
- **Multi-Tenant Isolation**: Every database query includes `WHERE tenantId = session.tenantId` filter. Never trust client-provided tenantId.
- **Brutalist Design**: Use thick borders (border-2), sharp corners (rounded-none), high-contrast colors (#09090B background, #FF4500 accent), and lucide-react icons with strokeWidth={2.5} or {3}.
- **Icon Guidelines**: All icons use lucide-react with high-contrast colors (text-[#09090B], text-[#FF4500], text-white) and thick strokes (strokeWidth={2.5} or {3}). Add aria-hidden="true" for decorative icons, aria-label for standalone icon buttons.
- **Checkpoints**: Regular checkpoints ensure incremental validation. Each checkpoint asks user for feedback before proceeding.
- **Requirements Coverage**: Each task references specific requirements for traceability. All 25 functional requirements and 4 architectural guardrails covered.
- **No Orphaned Code**: Each task builds on previous work, with final integration wiring all components together.


## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2"]
    },
    {
      "id": 1,
      "tasks": ["1.3", "2.1", "2.3"]
    },
    {
      "id": 2,
      "tasks": ["2.2", "2.4", "2.5", "3.1"]
    },
    {
      "id": 3,
      "tasks": ["3.2", "3.3", "3.5"]
    },
    {
      "id": 4,
      "tasks": ["3.4", "3.6", "3.7", "5.1", "5.2"]
    },
    {
      "id": 5,
      "tasks": ["5.3", "6.1", "10.1"]
    },
    {
      "id": 6,
      "tasks": ["6.2", "6.3", "6.4", "10.2"]
    },
    {
      "id": 7,
      "tasks": ["6.5", "6.6", "6.7", "7.1", "10.3"]
    },
    {
      "id": 8,
      "tasks": ["7.2", "7.3", "7.4", "8.1", "8.2", "8.3"]
    },
    {
      "id": 9,
      "tasks": ["8.4", "11.1", "11.2"]
    },
    {
      "id": 10,
      "tasks": ["11.3", "12.1"]
    },
    {
      "id": 11,
      "tasks": ["12.2", "12.3", "13.1"]
    },
    {
      "id": 12,
      "tasks": ["13.2", "13.3"]
    },
    {
      "id": 13,
      "tasks": ["13.4", "15.1"]
    },
    {
      "id": 14,
      "tasks": ["15.2", "15.3", "16.1"]
    },
    {
      "id": 15,
      "tasks": ["16.2", "16.3", "17.1"]
    },
    {
      "id": 16,
      "tasks": ["17.2", "17.3", "18.1"]
    },
    {
      "id": 17,
      "tasks": ["18.2", "18.3"]
    },
    {
      "id": 18,
      "tasks": ["18.4", "18.5", "20.1"]
    },
    {
      "id": 19,
      "tasks": ["20.2", "20.3", "21.1", "21.2"]
    },
    {
      "id": 20,
      "tasks": ["22.1", "22.2", "22.3", "23.1"]
    },
    {
      "id": 21,
      "tasks": ["23.2", "23.3", "24.1"]
    },
    {
      "id": 22,
      "tasks": ["24.2", "24.3", "25.1"]
    },
    {
      "id": 23,
      "tasks": ["25.2", "25.3"]
    }
  ]
}
```
