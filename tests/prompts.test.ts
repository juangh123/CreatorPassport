import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCampaignPrompt, GENERATE_CAMPAIGN_PROMPT } from '../src/minds/prompts/index.ts';

test('generateCampaignPrompt includes the source text', () => {
  const prompt = generateCampaignPrompt(
    'CreatorPassport launch',
    { platform: 'linkedin', sponsorConstraints: { tag: '@sponsor' } },
    { tone: 'professional' },
  );

  assert.match(prompt, /CreatorPassport launch/);
  assert.match(prompt, /linkedin/);
  assert.match(prompt, /@sponsor/);
  assert.match(prompt, /professional/);
});

test('generateCampaignPrompt includes the system instructions', () => {
  const prompt = generateCampaignPrompt('source', {}, {});

  assert.match(prompt, new RegExp(GENERATE_CAMPAIGN_PROMPT.trim()));
});

test('generateCampaignPrompt includes learned preferences when supplied', () => {
  const prompt = generateCampaignPrompt('source', {}, {}, 'Prefers short sentences');

  assert.match(prompt, /Learned Preferences:\nPrefers short sentences/);
});
