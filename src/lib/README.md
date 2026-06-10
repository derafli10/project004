# Integer-Decimal Conversion Utilities

This module provides utilities for converting between decimal display values and integer storage values, implementing the **Integer-Based Precision Mathematics** guardrail.

## Why Integer Storage?

JavaScript's floating-point arithmetic suffers from IEEE 754 binary precision errors (e.g., `0.1 + 0.2 !== 0.3`). To avoid these issues, all decimal values (scores, weights, thresholds) are stored as integers by multiplying by 100.

## Conversion Rules

| Display Value | Database Storage | Conversion |
|--------------|------------------|------------|
| 85.50% | 8550 | `85.50 * 100` |
| 20.00% | 2000 | `20.00 * 100` |
| 100.00% | 10000 | `100.00 * 100` |
| 0.01% | 1 | `0.01 * 100` |

## Functions

### `toInteger(decimal: number): number`

Converts a decimal to integer for database storage (multiply by 100).

```typescript
toInteger(85.50);  // Returns 8550
toInteger(20.00);  // Returns 2000
```

### `toDecimal(integer: number): number`

Converts an integer from database to decimal for display (divide by 100).

```typescript
toDecimal(8550);  // Returns 85.50
toDecimal(2000);  // Returns 20.00
```

### `formatPercentage(integer: number): string`

Formats an integer as a percentage string with two decimal places.

```typescript
formatPercentage(8550);  // Returns "85.50%"
formatPercentage(2000);  // Returns "20.00%"
```

### `formatScore(integer: number): string`

Formats an integer as a score string with two decimal places (no % symbol).

```typescript
formatScore(8550);  // Returns "85.50"
formatScore(2000);  // Returns "20.00"
```

## Usage

```typescript
import { toInteger, toDecimal, formatPercentage, formatScore } from '@/lib/converters';

// User enters 85.50% weight
const userInput = 85.50;
const dbValue = toInteger(userInput);  // Store 8550 in database

// Display stored value
const weight = 8550;  // From database
const displayValue = toDecimal(weight);  // 85.50
const formattedWeight = formatPercentage(weight);  // "85.50%"
const formattedScore = formatScore(weight);  // "85.50"
```

## Testing

Run unit tests with:

```bash
npm test -- converters.test.ts --run
```

All functions include comprehensive unit tests covering:
- Standard conversions
- Edge cases (0, 0.01, 99.99, 100.00)
- Round-trip conversion integrity
- Floating-point precision handling
