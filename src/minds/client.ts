import {
  BUILDER_API_KEY_ENV,
  createMindsClient,
  type MindsClient,
} from '@animocabrands/minds-client-lib';
import { generateCampaignPrompt } from './prompts/index.ts';

const mindsBuilderApiKey =
  process.env[BUILDER_API_KEY_ENV] || process.env.MINDS_API_KEY || '';

if (!mindsBuilderApiKey) {
  console.warn('MINDS_BUILDER_API_KEY is not set. Minds Builder API calls will fail.');
}

export const mindsClient: MindsClient = createMindsClient(
  mindsBuilderApiKey ? { builderApiKey: mindsBuilderApiKey } : {},
);

type CreatorProfile = Record<string, unknown>;

type SendMindMessageInput = {
  campaignTitle: string;
  sourceText: string;
  sponsorConstraints?: Record<string, unknown>;
  platform: string;
  creatorProfile?: CreatorProfile;
  memoryContext?: string;
  conversationId?: string;
};

export type SendMindMessageResult = {
  content: string;
  conversationId: string;
};

export function getAgentId(creatorProfile?: CreatorProfile) {
  if (typeof creatorProfile?.mind_id === 'string' && creatorProfile.mind_id) {
    return creatorProfile.mind_id;
  }

  return process.env.MINDS_AGENT_ID || null;
}

function getMindAlias(mindId: string) {
  return `creatorpassport:${mindId}`;
}

export async function sendMindMessage(input: SendMindMessageInput): Promise<SendMindMessageResult> {
  const agentId = getAgentId(input.creatorProfile);

  if (!agentId) {
    throw new Error('Minds agent is not configured. Bind an agent ID or set MINDS_AGENT_ID.');
  }

  const alias = input.conversationId?.trim() || getMindAlias(agentId);

  const prompt = generateCampaignPrompt(
    input.sourceText,
    {
      campaignTitle: input.campaignTitle,
      platform: input.platform,
      sponsorConstraints: input.sponsorConstraints,
    },
    input.creatorProfile ?? {},
    input.memoryContext ?? '',
  );

  await mindsClient.ensureConversation(alias, agentId);
  await mindsClient.sendMessage({ alias, messageText: prompt });

  const outcome = await mindsClient.waitForReply({
    alias,
    sentMessageText: prompt,
    timeoutMs: 120_000,
  });

  if (outcome.timedOut || !outcome.reply.messageText?.trim()) {
    throw new Error('Minds returned empty content');
  }

  return {
    content: outcome.reply.messageText,
    conversationId: alias,
  };
}

/**
 * Builds a lightweight memory context block from recent Minds replies.
 *
 * The official Builder API does not expose a separate memory-facts endpoint.
 * Keeping the same conversation alias gives the Mind persistent context across
 * generations, and this function turns recent replies into prompt context for
 * the next call.
 */
export async function getMindMemoryContext(
  mindId: string,
  _message: string,
  maxTokens = 1200,
): Promise<string> {
  try {
    const alias = getMindAlias(mindId);
    const history = await mindsClient.getHistory(alias, { limit: 20 });
    const recentReplies = history
      .map((row) => row.messageText)
      .filter((text): text is string => Boolean(text?.trim()))
      .slice(-6);

    if (recentReplies.length === 0) {
      return '';
    }

    const maxChars = maxTokens * 4;
    const context = recentReplies.join('\n');
    return context.length <= maxChars ? context : context.slice(-maxChars);
  } catch (error) {
    console.error('Error loading Minds memory context:', error);
    return '';
  }
}

/**
 * Reads memory from Minds, or returns null when the SDK call fails.
 */
export async function readMindMemory(mindId: string, key: string): Promise<unknown> {
  try {
    const alias = getMindAlias(mindId);
    const history = await mindsClient.getHistory(alias, { limit: 50 });

    return history
      .filter((row) => row.messageText?.includes(key))
      .map((row) => ({
        message: row.messageText,
        senderType: row.senderType,
        createdAt: row.createdAt,
      }));
  } catch (error) {
    console.error(`Error reading memory ${key} from Minds API:`, error);
    return null;
  }
}

/**
 * Writes a preference note into the persistent Minds conversation.
 */
export async function writeMindMemory(mindId: string, key: string, value: unknown): Promise<void> {
  try {
    const alias = getMindAlias(mindId);
    await mindsClient.ensureConversation(alias, mindId);
    await mindsClient.sendMessage({
      alias,
      messageText: [
        'CreatorPassport memory update.',
        'Remember this preference for future generation tasks.',
        `${key}: ${JSON.stringify(value)}`,
      ].join('\n'),
    });
  } catch (error) {
    console.error(`Error writing memory ${key} to Minds API:`, error);
    throw new Error('Failed to update Minds memory');
  }
}
