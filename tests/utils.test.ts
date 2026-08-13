import test from 'node:test';
import assert from 'node:assert/strict';
import { cn } from '../src/lib/utils.ts';

test('cn joins class names', () => {
  assert.equal(cn('a', 'b'), 'a b');
});

test('cn removes falsy values', () => {
  assert.equal(cn('a', false, null, undefined, 'b'), 'a b');
});

test('cn resolves simple tailwind conflicts', () => {
  assert.equal(cn('p-4', 'p-2'), 'p-2');
});
