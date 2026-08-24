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

export const GENERATE_CAMPAIGN_PROMPT = `Hi, I'm working on CreatorPassport. It helps creators turn one long-form idea into platform-native posts while keeping their voice consistent. Please use your social_media_marketing skill and write a finished platform post for the campaign below.`;

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
  const sponsorConstraints =
    context.sponsorConstraints && typeof context.sponsorConstraints === 'object' && !Array.isArray(context.sponsorConstraints)
      ? context.sponsorConstraints as Record<string, unknown>
      : {};
  const audience = typeof sponsorConstraints.audience === 'string' ? sponsorConstraints.audience.trim() : '';
  const tone = typeof sponsorConstraints.tone === 'string' ? sponsorConstraints.tone.trim() : '';
  const rules = typeof sponsorConstraints.rules === 'string' ? sponsorConstraints.rules.trim() : '';
  const requiredTerms = Array.isArray(sponsorConstraints.required_terms)
    ? sponsorConstraints.required_terms.filter((term): term is string => typeof term === 'string' && Boolean(term.trim()))
    : [];
  const additionalConstraints = Object.entries(sponsorConstraints)
    .filter(([key]) => !['audience', 'tone', 'rules', 'required_terms'].includes(key))
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  const voiceEntries = Object.entries(voiceProfile)
    .filter(([key, value]) => key !== 'mind_id' && value !== '' && value !== null && value !== undefined);

  return `
${GENERATE_CAMPAIGN_PROMPT}

Here is the source I want repurposed:
${sourceText}

${audience ? `Target audience: ${audience}.` : ''}
${tone ? `Tone: ${tone}.` : ''}
${rules ? `Brand rules: ${rules}.` : ''}
${requiredTerms.length > 0 ? `Please make sure the post includes: ${requiredTerms.join(', ')}.` : ''}
${additionalConstraints.length > 0 ? `Additional context:\n${additionalConstraints.join('\n')}` : ''}

${memoryContext ? `Learned Preferences:\n${memoryContext}\n` : ''}

${voiceEntries.length > 0 ? `Creator voice profile:\n${JSON.stringify(Object.fromEntries(voiceEntries), null, 2)}` : ''}

Please use your social_media_marketing skill to draft a ${platform} post.
Return only the finished post, no commentary.
  `;
}
