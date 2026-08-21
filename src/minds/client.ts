import { Minds } from '@minds/sdk';
import { generateCampaignPrompt } from './prompts/index.ts';

if (!process.env.MINDS_API_KEY) {
  console.warn('MINDS_API_KEY is not set in the environment. Minds API calls will fail.');
}

// Initialize the global Minds client.
// allowNoKey keeps imports safe in tests and preview environments;
// real generation calls still require MINDS_API_KEY or an agent ID.
const mindsApiKey = process.env.MINDS_API_KEY || '';

export const mindsClient = new Minds(
  mindsApiKey ? { apiKey: mindsApiKey } : { allowNoKey: true },
);

type CreatorProfile = Record<string, unknown>;

type SendMindMessageInput = {
  campaignTitle: string;
  sourceText: string;
  sponsorConstraints?: Record<string, unknown>;
  platform: string;
  creatorProfile?: CreatorProfile;
  memoryContext?: string;
};

export function getAgentId(creatorProfile?: CreatorProfile) {
  if (typeof creatorProfile?.mind_id === 'string' && creatorProfile.mind_id) {
    return creatorProfile.mind_id;
  }

  return process.env.MINDS_AGENT_ID || null;
}

export async function sendMindMessage(input: SendMindMessageInput) {
  const agentId = getAgentId(input.creatorProfile);

  if (!agentId) {
    throw new Error('Minds agent is not configured. Bind an agent ID or set MINDS_AGENT_ID.');
  }

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

  const { content } = await mindsClient.agents.chatStreamText(agentId, {
    message: prompt,
    new_conversation: true,
  });

  if (!content?.trim()) {
    throw new Error('Minds returned empty content');
  }

  return content;
}

/**
 * Builds a memory context block from Minds for prompt injection.
 */
export async function getMindMemoryContext(
  mindId: string,
  message: string,
  maxTokens = 1200,
): Promise<string> {
  try {
    const response = await mindsClient.memory.context({
      message,
      agent_id: mindId,
      max_tokens: maxTokens,
    });

    return response.data?.context ?? '';
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
    const response = await mindsClient.memory.search({
      query: key,
      agent_id: mindId,
    });

    return response.data;
  } catch (error) {
    console.error(`Error reading memory ${key} from Minds API:`, error);
    return null;
  }
}

/**
 * Writes memory to Minds.
 */
export async function writeMindMemory(mindId: string, key: string, value: unknown): Promise<void> {
  try {
    await mindsClient.memory.facts.add({
      fact: `${key}: ${JSON.stringify(value)}`,
      agent_id: mindId,
      source: 'manual',
      tags: ['creatorpassport'],
    });
  } catch (error) {
    console.error(`Error writing memory ${key} to Minds API:`, error);
    throw new Error('Failed to update Minds memory');
  }
}
