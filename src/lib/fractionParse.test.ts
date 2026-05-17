import { describe, expect, it } from 'vitest';
import { parseFractionDecimal, parseSpecSortKey, textContainsFraction } from './fractionParse';

describe('fractionParse', () => {
  it('parses simple fractions', () => {
    expect(parseFractionDecimal('3/4')).toBe(0.75);
    expect(parseFractionDecimal('1/2')).toBe(0.5);
  });

  it('parses mixed numbers', () => {
    expect(parseFractionDecimal('1-1/2')).toBe(1.5);
    expect(parseFractionDecimal('1 1/2')).toBe(1.5);
  });

  it('sorts facet values correctly', () => {
    const values = ['1"', '3/4"', '1/2"', '1-1/2"', '2"'];
    const sorted = [...values].sort((a, b) => {
      const na = parseSpecSortKey(a)!;
      const nb = parseSpecSortKey(b)!;
      return na - nb;
    });
    expect(sorted).toEqual(['1/2"', '3/4"', '1"', '1-1/2"', '2"']);
  });

  it('matches search variants', () => {
    expect(textContainsFraction('Муфта 32х1 1/2" М', '1-1/2')).toBe(true);
    expect(textContainsFraction('соединение 3/4 дюйм', '3/4')).toBe(true);
  });
});
