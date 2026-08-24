import { checkSponsorCompliance } from '@/lib/compliance';
import { getAgentId, getMindAlias, getMindMemoryContext, sendMindMessage } from '@/minds/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type CampaignGenerationRecord = {
  id: string;
  creator_id: string | null;
  title: string;
  source_text?: string | null;
  sponsor_brief?: Record<string, unknown> | null;
  platforms?: string[] | null;
  status?: string;
  mind_session_id?: string | null;
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
  const stableMindAlias = mindAgentId
    ? getMindAlias(mindAgentId)
    : undefined;
  let conversationAlias =
    campaign.mind_session_id?.startsWith('creatorpassport:') && campaign.mind_session_id?.endsWith(':v2')
      ? campaign.mind_session_id
      : stableMindAlias;
  const failedPlatforms: string[] = [];

  for (const platform of platforms) {
    let generatedText = '';

    try {
      const result = await sendMindMessage({
        campaignTitle: campaign.title,
        sourceText: campaign.source_text ?? '',
        sponsorConstraints: campaign.sponsor_brief ?? {},
        platform,
        creatorProfile,
        memoryContext,
        conversationId: conversationAlias,
      });

      generatedText = result.content;

      if (result.conversationId) {
        conversationAlias = result.conversationId;
      }
    } catch (err) {
      console.error(`Failed to generate for ${platform}:`, err);
      generatedText = `Error generating content for ${platform}`;
      failedPlatforms.push(platform);
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

  if (conversationAlias && conversationAlias !== campaign.mind_session_id) {
    await supabase
      .from('campaigns')
      .update({ mind_session_id: conversationAlias })
      .eq('id', campaign.id);
  }

  if (failedPlatforms.length > 0) {
    await supabase.from('follow_up_tasks').insert(
      failedPlatforms.map((platform) => ({
        campaign_id: campaign.id,
        task_type: 'incomplete_versions',
        description: `Regenerate the ${platform} version after a Minds generation error.`,
        status: 'pending',
        scheduled_at: new Date().toISOString(),
        mind_decision: { failed_platform: platform },
      })),
    );
  }

  await supabase.from('campaigns').update({ status: 'reviewing' }).eq('id', campaign.id);
}
