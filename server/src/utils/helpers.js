import { HttpError } from '../middleware/errors.js';

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const round = (n, digits = 2) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

export const clampInt = (value, fallback, min, max) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : Math.min(max, Math.max(min, n));
};

export const parseDateParam = (value, name) => {
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) throw new HttpError(400, `Invalid ${name} date`);
  return d;
};

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n');

// Small deterministic PRNG so generated/simulated data is the same on every run.
export function createRandom(seed = 42) {
  let a = seed;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    // weights: [[value, weight], ...]
    weighted: (weights) => {
      const total = weights.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [value, w] of weights) {
        if ((r -= w) < 0) return value;
      }
      return weights[weights.length - 1][0];
    },
  };
}
