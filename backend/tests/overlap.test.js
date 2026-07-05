import { test } from 'node:test';
import assert from 'node:assert/strict';
import { intervalsOverlap } from '../src/utils/overlap.js';

const iso = (h, m = 0) =>
  `2026-07-04T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`;

test('detects a partial overlap', () => {
  assert.equal(intervalsOverlap(iso(9), iso(10), iso(9, 30), iso(10, 30)), true);
});

test('detects full containment', () => {
  assert.equal(intervalsOverlap(iso(9), iso(12), iso(10), iso(11)), true);
});

test('back-to-back slots do not overlap', () => {
  assert.equal(intervalsOverlap(iso(9), iso(10), iso(10), iso(11)), false);
});

test('separate slots do not overlap', () => {
  assert.equal(intervalsOverlap(iso(9), iso(10), iso(14), iso(15)), false);
});

test('identical slots overlap', () => {
  assert.equal(intervalsOverlap(iso(9), iso(10), iso(9), iso(10)), true);
});

test('overlap is symmetric', () => {
  const a = intervalsOverlap(iso(9), iso(10), iso(9, 30), iso(10, 30));
  const b = intervalsOverlap(iso(9, 30), iso(10, 30), iso(9), iso(10));
  assert.equal(a, b);
});
