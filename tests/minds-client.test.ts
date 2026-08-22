import test from 'node:test';
import assert from 'node:assert/strict';
import { mock, beforeEach } from 'node:test';
import { getMindMemoryContext, mindsClient, sendMindMessage, writeMindMemory } from '../src/minds/client.ts';
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

  const result = await sendMindMessage({
    campaignTitle: 'CreatorPassport Launch',
    sourceText: 'A new creator workflow agent.',
    platform: 'linkedin',
    creatorProfile: { mind_id: 'agent_test' },
  });

  assert.equal(result.content, 'Real Minds response');
  assert.equal(result.conversationId, 'conversation_test');
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

test('sendMindMessage reuses the provided conversation ID', async () => {
  let capturedInput: AgentChatInput | undefined;

  mock.method(mindsClient.agents, 'chatStreamText', async (_id: string, input: AgentChatInput) => {
    capturedInput = input;
    return {
      content: 'Continuing conversation',
      conversationId: 'existing_conversation',
      chunks: [],
    };
  });

  const result = await sendMindMessage({
    campaignTitle: 'CreatorPassport Launch',
    sourceText: 'A new creator workflow agent.',
    platform: 'linkedin',
    creatorProfile: { mind_id: 'agent_test' },
    conversationId: 'existing_conversation',
  });

  assert.equal(capturedInput?.conversation_id, 'existing_conversation');
  assert.equal(capturedInput?.new_conversation, undefined);
  assert.equal(result.conversationId, 'existing_conversation');
});

test('getMindMemoryContext returns the Minds context string', async () => {
  mock.method(mindsClient.memory, 'context', async () => ({
    data: { context: 'Prefers short sentences' },
  }));

  const context = await getMindMemoryContext('agent_test', 'Launch post');

  assert.equal(context, 'Prefers short sentences');
});

test('getMindMemoryContext returns an empty string when Minds fails', async () => {
  mock.method(mindsClient.memory, 'context', async () => {
    throw new Error('Minds memory unavailable');
  });

  const context = await getMindMemoryContext('agent_test', 'Launch post');

  assert.equal(context, '');
});

test('writeMindMemory stores an agent-scoped fact', async () => {
  let capturedInput: Record<string, unknown> | undefined;

  mock.method(mindsClient.memory.facts, 'add', async (input: Record<string, unknown>) => {
    capturedInput = input;
    return { data: { id: 'fact_test' } };
  });

  await writeMindMemory('agent_test', 'platform:linkedin', {
    finalText: 'Short version',
  });

  assert.equal(capturedInput?.agent_id, 'agent_test');
  assert.deepEqual(capturedInput?.tags, ['creatorpassport']);
  assert.match(String(capturedInput?.fact), /platform:linkedin/);
});
