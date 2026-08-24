import test from 'node:test';
import assert from 'node:assert/strict';
import { mock, beforeEach } from 'node:test';
import { getMindMemoryContext, mindsClient, sendMindMessage, writeMindMemory } from '../src/minds/client.ts';

beforeEach(() => {
  mock.restoreAll();
});

function stubConversation() {
  mock.method(mindsClient, 'ensureConversation', async (alias: string, mindId: string) => ({
    conversationId: `conversation:${alias}`,
    alias,
    mindId,
  }));
}

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

test('sendMindMessage returns the Mind reply for a configured agent', async () => {
  stubConversation();
  mock.method(mindsClient, 'sendMessage', async () => ({}));
  mock.method(mindsClient, 'waitForReply', async () => ({
    timedOut: false,
    reply: {
      fingerprint: 'reply_test',
      messageText: 'Real Minds response',
      senderType: 0,
    },
  }));

  const result = await sendMindMessage({
    campaignTitle: 'CreatorPassport Launch',
    sourceText: 'A new creator workflow agent.',
    platform: 'linkedin',
    creatorProfile: { mind_id: 'agent_test' },
  });

  assert.equal(result.content, 'Real Minds response');
  assert.equal(result.conversationId, 'creatorpassport:agent_test');
});

test('sendMindMessage rejects when Minds returns empty content', async () => {
  stubConversation();
  mock.method(mindsClient, 'sendMessage', async () => ({}));
  mock.method(mindsClient, 'waitForReply', async () => ({
    timedOut: false,
    reply: {
      fingerprint: 'reply_test',
      messageText: '',
      senderType: 0,
    },
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
  stubConversation();
  let capturedMessage = '';

  mock.method(mindsClient, 'sendMessage', async (body: { alias: string; messageText: string }) => {
    capturedMessage = body.messageText;
    return {};
  });
  mock.method(mindsClient, 'waitForReply', async () => ({
    timedOut: false,
    reply: {
      fingerprint: 'reply_test',
      messageText: 'Memory-aware Minds response',
      senderType: 0,
    },
  }));

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

test('sendMindMessage reuses the provided conversation alias', async () => {
  let capturedAlias = '';

  mock.method(mindsClient, 'ensureConversation', async (alias: string) => {
    capturedAlias = alias;
    return { conversationId: `conversation:${alias}`, alias };
  });
  mock.method(mindsClient, 'sendMessage', async () => ({}));
  mock.method(mindsClient, 'waitForReply', async () => ({
    timedOut: false,
    reply: {
      fingerprint: 'reply_test',
      messageText: 'Continuing conversation',
      senderType: 0,
    },
  }));

  const result = await sendMindMessage({
    campaignTitle: 'CreatorPassport Launch',
    sourceText: 'A new creator workflow agent.',
    platform: 'linkedin',
    creatorProfile: { mind_id: 'agent_test' },
    conversationId: 'creatorpassport:agent_test',
  });

  assert.equal(capturedAlias, 'creatorpassport:agent_test');
  assert.equal(result.conversationId, 'creatorpassport:agent_test');
});

test('getMindMemoryContext returns recent Minds replies', async () => {
  mock.method(mindsClient, 'getHistory', async () => [
    { messageText: 'Prefers short sentences', senderType: 0 },
  ]);

  const context = await getMindMemoryContext('agent_test', 'Launch post');

  assert.equal(context, 'Prefers short sentences');
});

test('getMindMemoryContext returns an empty string when Minds fails', async () => {
  mock.method(mindsClient, 'getHistory', async () => {
    throw new Error('Minds history unavailable');
  });

  const context = await getMindMemoryContext('agent_test', 'Launch post');

  assert.equal(context, '');
});

test('writeMindMemory sends a preference note to the persistent conversation', async () => {
  let capturedMessage = '';

  mock.method(mindsClient, 'ensureConversation', async (alias: string, mindId: string) => ({
    conversationId: `conversation:${alias}`,
    alias,
    mindId,
  }));
  mock.method(mindsClient, 'sendMessage', async (body: { alias: string; messageText: string }) => {
    capturedMessage = body.messageText;
    return {};
  });

  await writeMindMemory('agent_test', 'platform:linkedin', {
    finalText: 'Short version',
  });

  assert.match(capturedMessage, /CreatorPassport memory update/);
  assert.match(capturedMessage, /platform:linkedin/);
  assert.match(capturedMessage, /Short version/);
});
