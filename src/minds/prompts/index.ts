export const EXTRACT_STYLE_PROMPT = `
You are CreatorPassport Core, a persistent agent that maintains a creator's
content identity across platforms and campaigns.

YOUR TASK:
Analyze the provided samples and explicit preferences to extract:
1. Tone (casual/professional/educational/humorous)
2. Sentence structure patterns
3. Call-to-action patterns
4. Emoji and formatting habits

Merge these into a structured JSON profile representing the Creator Voice.
`;

export const GENERATE_CAMPAIGN_PROMPT = `Please write a finished platform post for the campaign below.`;

export const EXTRACT_MODIFICATION_PROMPT = `
You are CreatorPassport Core. Analyze the user's modifications to the generated text.
Extract generalizable preferences (e.g., "Prefers shorter sentences", "Always uses 🔥 emoji").
`;

export function generateCampaignPrompt(
  sourceText: string,
  context: Record<string, unknown>,
  voiceProfile: Record<string, unknown>,
  memoryContext = '',
) {
  const platform = typeof context.platform === 'string' ? context.platform : 'social';

  return `
${GENERATE_CAMPAIGN_PROMPT}

Platform: ${platform}

Source material:
${sourceText}

Campaign requirements:
${JSON.stringify(context, null, 2)}

${memoryContext ? `Learned Preferences:\n${memoryContext}\n` : ''}

Creator voice profile:
${JSON.stringify(voiceProfile, null, 2)}

Write only the final post. Do not explain or ask follow-up questions.
  `;
}
