import { describe, expect, it } from 'vitest';
import { nextSort, sortBy } from './sort';

const items = [
  { name: 'Maler', betrag: 4800 },
  { name: 'dach', betrag: 22000 },
  { name: 'Elektro 10', betrag: 8500 },
  { name: 'Elektro 9', betrag: 8500 },
];
const accessors = { name: (x) => x.name, betrag: (x) => x.betrag };
const names = (list) => list.map((x) => x.name);

describe('sortBy', () => {
  it('keeps the original order without a sort', () => {
    expect(sortBy(items, null, accessors)).toBe(items);
  });

  it('sorts text case-insensitively and numbers inside text naturally', () => {
    expect(names(sortBy(items, { key: 'name', dir: 'asc' }, accessors)))
      .toEqual(['dach', 'Elektro 9', 'Elektro 10', 'Maler']);
  });

  it('sorts amounts descending and keeps ties in their original order', () => {
    expect(names(sortBy(items, { key: 'betrag', dir: 'desc' }, accessors)))
      .toEqual(['dach', 'Elektro 10', 'Elektro 9', 'Maler']);
  });
});

describe('nextSort (clicking a column header)', () => {
  it('sorts, reverses, then returns to the default order', () => {
    const first = nextSort(null, 'geplant', 'desc', null);
    expect(first).toEqual({ key: 'geplant', dir: 'desc' });
    const second = nextSort(first, 'geplant', 'desc', null);
    expect(second).toEqual({ key: 'geplant', dir: 'asc' });
    expect(nextSort(second, 'geplant', 'desc', null)).toBeNull();
  });

  it('starts fresh when another column is clicked', () => {
    expect(nextSort({ key: 'name', dir: 'desc' }, 'status', 'asc', null)).toEqual({ key: 'status', dir: 'asc' });
  });
});
