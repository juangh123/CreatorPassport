import test from 'node:test';
import assert from 'node:assert/strict';
import { mock, beforeEach } from 'node:test';
import { mindsClient, sendMindMessage } from '../src/minds/client.ts';
import type { AgentChatInput } from '@minds/sdk';

beforeEach(() => {
  mock.restoreAll();
});

test('sendMindMessage rejects when no Minds agent is configured', async () => {
  await assert.rejects(
    () => sendMindMessage({
      campaignTitle: 'CreatorPassport Launch',
      sourceText: 'A new creator workflow agent.',
      platform: 'twitter',
    }),
    /Minds agent is not configured/,
  );
});

test('sendMindMessage returns chatStreamText content for a configured agent', async () => {
  mock.method(mindsClient.agents, 'chatStreamText', async () => ({
    content: 'Real Minds response',
    conversationId: 'conversation_test',
    chunks: [],
  }));

  const text = await sendMindMessage({
    campaignTitle: 'CreatorPassport Launch',
    sourceText: 'A new creator workflow agent.',
    platform: 'linkedin',
    creatorProfile: { mind_id: 'agent_test' },
  });

  assert.equal(text, 'Real Minds response');
});

test('sendMindMessage rejects when Minds returns empty content', async () => {
  mock.method(mindsClient.agents, 'chatStreamText', async () => ({
    content: '',
    conversationId: 'conversation_test',
    chunks: [],
  }));

  await assert.rejects(
    () => sendMindMessage({
      campaignTitle: 'CreatorPassport Launch',
      sourceText: 'A new creator workflow agent.',
      platform: 'linkedin',
      creatorProfile: { mind_id: 'agent_test' },
    }),
    /Minds returned empty content/,
  );
});

test('sendMindMessage includes sponsor context and memory context in the generated prompt', async () => {
  let capturedMessage = '';

  mock.method(mindsClient.agents, 'chatStreamText', async (_id: string, input: AgentChatInput) => {
    capturedMessage = input.message;
    return {
      content: 'Memory-aware Minds response',
      conversationId: 'conversation_test',
      chunks: [],
    };
  });

  await sendMindMessage({
    campaignTitle: 'CreatorPassport Launch',
    sourceText: 'A new creator workflow agent.',
    sponsorConstraints: { tag: '@sponsor' },
    platform: 'linkedin',
    creatorProfile: { mind_id: 'agent_test', tone: 'professional' },
    memoryContext: 'Prefers short sentences',
  });

  assert.match(capturedMessage, /@sponsor/);
  assert.match(capturedMessage, /Learned Preferences:\nPrefers short sentences/);
});
