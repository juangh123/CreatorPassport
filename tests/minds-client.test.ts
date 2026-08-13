import test from 'node:test';
import assert from 'node:assert/strict';
import { sendMindMessage } from '../src/minds/client.ts';

test('sendMindMessage returns deterministic mock output without an agent ID', async () => {
  const text = await sendMindMessage({
    campaignTitle: 'CreatorPassport Launch',
    sourceText: 'A new creator workflow agent.',
    platform: 'twitter',
  });

  assert.match(text, /CreatorPassport Launch/);
  assert.match(text, /Default Tone: Casual/);
});

test('sendMindMessage includes sponsor context in mock fallback', async () => {
  const text = await sendMindMessage({
    campaignTitle: 'CreatorPassport Launch',
    sourceText: 'A new creator workflow agent.',
    sponsorConstraints: { tag: '@sponsor' },
    platform: 'linkedin',
  });

  assert.match(text, /CreatorPassport Launch/);
  assert.match(text, /@sponsor/);
});

test('sendMindMessage has a generic fallback for unknown platforms', async () => {
  const text = await sendMindMessage({
    campaignTitle: 'CreatorPassport Launch',
    sourceText: 'A new creator workflow agent.',
    platform: 'tiktok',
  });

  assert.match(text, /Mock Response for tiktok/);
  assert.match(text, /CreatorPassport Launch/);
});
