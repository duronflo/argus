import { describe, expect, it } from 'vitest';
import { CHANGELOG, VERSION } from './version';
import pkg from '../package.json';

describe('version', () => {
  it('matches package.json', () => {
    expect(VERSION).toBe(pkg.version);
  });

  it('lists versions newest first without duplicates', () => {
    const versions = CHANGELOG.map((e) => e.version);
    expect(new Set(versions).size).toBe(versions.length);
    const dates = CHANGELOG.map((e) => e.datum);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});
