import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSponsorCompliance } from '../src/lib/compliance.ts';

test('compliance passes when required terms are present and forbidden terms are absent', () => {
  const result = checkSponsorCompliance('Use code LAUNCH10 for 20% off this SaaS plan.', {
    required_terms: ['LAUNCH10', 'SaaS'],
    forbidden_terms: ['guarantee', 'competitor'],
  });

  assert.deepEqual(result, {
    compliant: true,
    missing: [],
    violations: [],
  });
});

test('compliance reports missing required terms case-insensitively', () => {
  const result = checkSponsorCompliance('CreatorPassport is now live.', {
    required_terms: ['pricing'],
  });

  assert.equal(result.compliant, false);
  assert.deepEqual(result.missing, ['pricing']);
  assert.deepEqual(result.violations, []);
});

test('compliance reports forbidden terms case-insensitively', () => {
  const result = checkSponsorCompliance('We guarantee a 10x return.', {
    forbidden_terms: ['GUARANTEE'],
  });

  assert.equal(result.compliant, false);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.violations, ['guarantee']);
});

test('compliance treats an empty brief as compliant', () => {
  const result = checkSponsorCompliance('This is a generic post.', null);

  assert.deepEqual(result, {
    compliant: true,
    missing: [],
    violations: [],
  });
});
