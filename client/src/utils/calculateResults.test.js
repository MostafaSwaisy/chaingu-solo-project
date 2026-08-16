import { describe, it, expect } from 'vitest';
import { calculateResults } from './calculateResults.js';

describe('calculateResults', () => {
  it('computes rounded percentages for each option', () => {
    const result = calculateResults([
      { text: 'A', votes: 3 },
      { text: 'B', votes: 1 },
    ]);
    expect(result).toEqual([
      { text: 'A', votes: 3, percentage: 75 },
      { text: 'B', votes: 1, percentage: 25 },
    ]);
  });

  it('returns 0 percent for every option when there are no votes', () => {
    const result = calculateResults([
      { text: 'A', votes: 0 },
      { text: 'B', votes: 0 },
    ]);
    expect(result).toEqual([
      { text: 'A', votes: 0, percentage: 0 },
      { text: 'B', votes: 0, percentage: 0 },
    ]);
  });
});
