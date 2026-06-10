/**
 * Unit tests for integer-decimal conversion utilities
 */

import { describe, it, expect } from 'vitest';
import { toInteger, toDecimal, formatPercentage, formatScore } from './converters';

describe('toInteger', () => {
  it('converts decimal to integer by multiplying by 100', () => {
    expect(toInteger(85.50)).toBe(8550);
    expect(toInteger(20.00)).toBe(2000);
    expect(toInteger(100.00)).toBe(10000);
    expect(toInteger(0.01)).toBe(1);
  });

  it('handles zero correctly', () => {
    expect(toInteger(0)).toBe(0);
    expect(toInteger(0.00)).toBe(0);
  });

  it('handles edge case percentages', () => {
    expect(toInteger(99.99)).toBe(9999);
    expect(toInteger(0.50)).toBe(50);
    expect(toInteger(50.00)).toBe(5000);
  });

  it('rounds properly for floating point edge cases', () => {
    // JavaScript floating point precision issues
    expect(toInteger(85.505)).toBe(8551); // Rounds up
    expect(toInteger(85.504)).toBe(8550); // Rounds down
  });
});

describe('toDecimal', () => {
  it('converts integer to decimal by dividing by 100', () => {
    expect(toDecimal(8550)).toBe(85.50);
    expect(toDecimal(2000)).toBe(20.00);
    expect(toDecimal(10000)).toBe(100.00);
    expect(toDecimal(1)).toBe(0.01);
  });

  it('handles zero correctly', () => {
    expect(toDecimal(0)).toBe(0);
  });

  it('handles edge case values', () => {
    expect(toDecimal(9999)).toBe(99.99);
    expect(toDecimal(50)).toBe(0.50);
    expect(toDecimal(5000)).toBe(50.00);
  });
});

describe('formatPercentage', () => {
  it('formats integer as percentage string with two decimal places', () => {
    expect(formatPercentage(8550)).toBe('85.50%');
    expect(formatPercentage(2000)).toBe('20.00%');
    expect(formatPercentage(10000)).toBe('100.00%');
    expect(formatPercentage(1)).toBe('0.01%');
  });

  it('handles zero correctly', () => {
    expect(formatPercentage(0)).toBe('0.00%');
  });

  it('formats edge case values correctly', () => {
    expect(formatPercentage(9999)).toBe('99.99%');
    expect(formatPercentage(50)).toBe('0.50%');
    expect(formatPercentage(5000)).toBe('50.00%');
  });

  it('always shows two decimal places', () => {
    expect(formatPercentage(8500)).toBe('85.00%');
    expect(formatPercentage(100)).toBe('1.00%');
  });
});

describe('formatScore', () => {
  it('formats integer as score string with two decimal places', () => {
    expect(formatScore(8550)).toBe('85.50');
    expect(formatScore(2000)).toBe('20.00');
    expect(formatScore(10000)).toBe('100.00');
    expect(formatScore(1)).toBe('0.01');
  });

  it('handles zero correctly', () => {
    expect(formatScore(0)).toBe('0.00');
  });

  it('formats edge case values correctly', () => {
    expect(formatScore(9999)).toBe('99.99');
    expect(formatScore(50)).toBe('0.50');
    expect(formatScore(5000)).toBe('50.00');
  });

  it('always shows two decimal places', () => {
    expect(formatScore(8500)).toBe('85.00');
    expect(formatScore(100)).toBe('1.00');
  });

  it('does not include percentage symbol', () => {
    const result = formatScore(8550);
    expect(result).not.toContain('%');
    expect(result).toBe('85.50');
  });
});

describe('round-trip conversion', () => {
  it('maintains precision through conversion cycle', () => {
    const original = 85.50;
    const integer = toInteger(original);
    const restored = toDecimal(integer);
    expect(restored).toBe(original);
  });

  it('handles multiple round-trip conversions', () => {
    const values = [0.01, 20.00, 50.50, 85.75, 99.99, 100.00];
    
    values.forEach(value => {
      const integer = toInteger(value);
      const restored = toDecimal(integer);
      expect(restored).toBe(value);
    });
  });
});
