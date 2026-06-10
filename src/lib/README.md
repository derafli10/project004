# Library Utilities

This directory contains core utility modules for the Grade Optimizer application.

## Modules

### `converters.ts` - Integer-Decimal Conversion Utilities

Provides utilities for converting between decimal display values and integer storage values, implementing the **Integer-Based Precision Mathematics** guardrail.

#### Why Integer Storage?

JavaScript's floating-point arithmetic suffers from IEEE 754 binary precision errors (e.g., `0.1 + 0.2 !== 0.3`). To avoid these issues, all decimal values (scores, weights, thresholds) are stored as integers by multiplying by 100.

#### Conversion Rules

| Display Value | Database Storage | Conversion |
|--------------|------------------|------------|
| 85.50% | 8550 | `85.50 * 100` |
| 20.00% | 2000 | `20.00 * 100` |
| 100.00% | 10000 | `100.00 * 100` |
| 0.01% | 1 | `0.01 * 100` |

#### Functions

- `toInteger(decimal: number): number` - Converts decimal to integer for database storage
- `toDecimal(integer: number): number` - Converts integer to decimal for display
- `formatPercentage(integer: number): string` - Formats integer as percentage string
- `formatScore(integer: number): string` - Formats integer as score string

### `validations.ts` - Zod Validation Schemas

Zod validation schemas for form inputs and API requests.
- Course creation/update validation
- Component validation
- Input sanitization and type safety

### `transactions.ts` - Transaction Management Wrapper

Transaction management wrapper for Prisma with automatic rollback and error handling, implementing **Requirement 9: Database Transaction Integrity**.

#### Features

- **ACID Compliance**: Wraps Prisma's `$transaction` API for atomic operations
- **Automatic Rollback**: All changes revert if any operation fails
- **Type-Safe Results**: `Result<T>` discriminated union for success/failure handling
- **Error Logging**: Comprehensive error logging with stack traces
- **Data Sanitization**: Automatically redacts sensitive data (passwords, tokens) from logs
- **Field Errors**: Support for field-level validation errors

#### Type Definition

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

#### Usage

```typescript
import { executeTransaction } from '@/src/lib/transactions';

// Simple transaction
const result = await executeTransaction(async (tx) => {
  const course = await tx.course.create({
    data: { name: 'Database Systems', sks: 3, tenantId: '...' }
  });
  return course;
});

if (result.success) {
  console.log('Course created:', result.data);
} else {
  console.error('Error:', result.error);
}

// Complex multi-step transaction with validation
const result = await executeTransaction(async (tx) => {
  // Step 1: Validate total weights
  const components = await tx.component.findMany({
    where: { courseId: 'course-id' }
  });
  
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight > 10000) {
    throw new Error('Total component weight exceeds 100%');
  }
  
  // Step 2: Update course (optimistic locking)
  const course = await tx.course.update({
    where: { id: 'course-id' },
    data: { version: { increment: 1 } }
  });
  
  // Step 3: Create notification
  await tx.notification.create({
    data: {
      courseId: course.id,
      tenantId: course.tenantId,
      alertLevel: 'NORMAL',
      message: 'Course updated'
    }
  });
  
  return course;
});

// If ANY operation fails, ALL changes are automatically rolled back
```

## Usage Examples

### Integer Precision

```typescript
import { toInteger, toDecimal, formatPercentage } from '@/src/lib/converters';

// Store user input
const weight = 85.50; // User enters 85.50%
const dbWeight = toInteger(weight); // Store as 8550 in database

// Display database value
const dbValue = 8550;
const displayValue = toDecimal(dbValue); // Show as 85.50
const formatted = formatPercentage(dbValue); // Show as "85.50%"
```

## Testing

All modules include comprehensive unit tests. Run tests with:

```bash
# Test all library utilities
npm test src/lib

# Test specific module
npm test -- src/lib/converters.test.ts
npm test -- src/lib/transactions.test.ts
npm test -- src/lib/validations.test.ts
```

## Requirements Coverage

- **Guardrail 1** (Integer Precision): `converters.ts`
- **Guardrail 2** (Multi-tenant Isolation): Enforced in Server Actions using `transactions.ts`
- **Requirement 9** (Transaction Integrity): `transactions.ts`
- **Requirement 14** (Type Safety): All modules use strict TypeScript
