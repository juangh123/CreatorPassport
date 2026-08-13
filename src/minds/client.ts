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
};

function getAgentId(creatorProfile?: CreatorProfile) {
  if (typeof creatorProfile?.mind_id === 'string' && creatorProfile.mind_id) {
    return creatorProfile.mind_id;
  }

  return process.env.MINDS_AGENT_ID || null;
}

function getToneInstruction(creatorProfile?: CreatorProfile) {
  return typeof creatorProfile?.tone === 'string' && creatorProfile.tone
    ? `(Adaptive Tone: ${creatorProfile.tone})`
    : '(Default Tone: Casual)';
}

function getMockResponse(input: SendMindMessageInput) {
  const { campaignTitle, sponsorConstraints, platform, creatorProfile } = input;
  const toneInstruction = getToneInstruction(creatorProfile);

  if (platform === 'twitter') {
    return `1/ ${campaignTitle}

Just tested this out and here are the results.

2/ The new features are mostly what we expected.
${sponsorConstraints ? `Note: ${JSON.stringify(sponsorConstraints)}` : ''}

3/ Final thoughts? It's solid. ${toneInstruction} #techreview`;
  }

  if (platform === 'instagram') {
    return `${campaignTitle} - Is it worth it?

I've been testing this all week. Here's what you need to know:
- Amazing new design
- Finally fixed the battery issue
- The camera is... okay.

${sponsorConstraints ? `Required Context: ${JSON.stringify(sponsorConstraints)}` : ''}

#techreview #creator #gadgets ${toneInstruction}`;
  }

  if (platform === 'linkedin') {
    return `I just reviewed the ${campaignTitle} and it taught me a valuable lesson about product design.

When building hardware, the most overlooked feature is often the most important. The integration here is seamless.

${sponsorConstraints ? `Required Context: ${JSON.stringify(sponsorConstraints)}` : ''}

Would you use this in your workflow? ${toneInstruction}`;
  }

  return `[Mock Response for ${platform}] Based on: ${campaignTitle}`;
}

export async function sendMindMessage(input: SendMindMessageInput) {
  const agentId = getAgentId(input.creatorProfile);

  if (agentId) {
    try {
      const prompt = generateCampaignPrompt(
        input.sourceText,
        {
          campaignTitle: input.campaignTitle,
          platform: input.platform,
          sponsorConstraints: input.sponsorConstraints,
        },
        input.creatorProfile ?? {},
      );

      const response = await mindsClient.agents.chat(agentId, {
        message: prompt,
        new_conversation: true,
      });

      return response.data.content;
    } catch (error) {
      console.error('Minds generation failed; falling back to mock response:', error);
    }
  }

  return getMockResponse(input);
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
