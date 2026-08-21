import { checkSponsorCompliance } from '@/lib/compliance';
import { getAgentId, getMindMemoryContext, sendMindMessage } from '@/minds/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type CampaignGenerationRecord = {
  id: string;
  creator_id: string | null;
  title: string;
  source_text?: string | null;
  sponsor_brief?: Record<string, unknown> | null;
  platforms?: string[] | null;
  status?: string;
};

export async function generateCampaignContent(
  supabase: SupabaseClient,
  campaign: CampaignGenerationRecord,
) {
  await supabase.from('campaigns').update({ status: 'generating' }).eq('id', campaign.id);

  const { data: creator } = await supabase
    .from('creators')
    .select('mind_id, voice_profile')
    .eq('id', campaign.creator_id)
    .single();

  const creatorProfile: Record<string, unknown> = creator
    ? {
        ...(creator.voice_profile as Record<string, unknown> | null ?? {}),
        mind_id: creator.mind_id,
      }
    : {};

  const mindAgentId = getAgentId(creatorProfile);
  const memoryContext = mindAgentId
    ? await getMindMemoryContext(
        mindAgentId,
        `${campaign.title}\n${campaign.source_text ?? ''}`,
      )
    : '';

  const platforms = Array.isArray(campaign.platforms) ? campaign.platforms : [];

  for (const platform of platforms) {
    let generatedText = '';

    try {
      generatedText = await sendMindMessage({
        campaignTitle: campaign.title,
        sourceText: campaign.source_text ?? '',
        sponsorConstraints: campaign.sponsor_brief ?? {},
        platform,
        creatorProfile,
        memoryContext,
      });
    } catch (err) {
      console.error(`Failed to generate for ${platform}:`, err);
      generatedText = `Error generating content for ${platform}`;
    }

    const compliance = checkSponsorCompliance(
      generatedText,
      campaign.sponsor_brief ?? null,
    );

    await supabase
      .from('platform_versions')
      .delete()
      .eq('campaign_id', campaign.id)
      .eq('platform', platform);

    await supabase.from('platform_versions').insert({
      campaign_id: campaign.id,
      platform,
      generated_text: generatedText,
      status: 'pending',
      consistency_checks: compliance,
    });
  }

  await supabase.from('campaigns').update({ status: 'reviewing' }).eq('id', campaign.id);
}
