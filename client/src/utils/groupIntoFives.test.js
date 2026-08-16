import { describe, it, expect } from 'vitest';
import { groupIntoFives } from './groupIntoFives.js';

describe('groupIntoFives', () => {
  it('returns no groups and no remainder for zero', () => {
    expect(groupIntoFives(0)).toEqual({ fullGroups: 0, remainder: 0 });
  });

  it('returns a remainder-only result under five', () => {
    expect(groupIntoFives(4)).toEqual({ fullGroups: 0, remainder: 4 });
  });

  it('returns exactly one full group for five', () => {
    expect(groupIntoFives(5)).toEqual({ fullGroups: 1, remainder: 0 });
  });

  it('splits into full groups and a remainder for twelve', () => {
    expect(groupIntoFives(12)).toEqual({ fullGroups: 2, remainder: 2 });
  });
});
