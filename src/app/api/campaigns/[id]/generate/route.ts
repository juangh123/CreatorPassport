import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendMindMessage } from '@/minds/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    // 1. Get campaign
    const { data: campaign, error: getErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (getErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // 2. Update status to generating
    await supabase.from('campaigns').update({ status: 'generating' }).eq('id', id);

    // 3. Load the creator profile so generation can use the real Minds agent when available.
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

    // 4. For each platform, generate content using Minds (real when configured, mock otherwise).
    const { platforms } = campaign;

    for (const platform of platforms) {
      let generatedText = '';

      try {
        generatedText = await sendMindMessage({
          campaignTitle: campaign.title,
          sourceText: campaign.source_text,
          sponsorConstraints: campaign.sponsor_brief,
          platform: platform,
          creatorProfile,
        });
      } catch (err) {
console.error(`Failed to generate for ${platform}:`, err);
        generatedText = `Error generating content for ${platform}`;
      }

      await supabase.from('platform_versions').insert({
        campaign_id: id,
        platform,
        generated_text: generatedText,
        status: 'pending'
      });
    }
    // 5. Update campaign status to reviewing
    await supabase.from('campaigns').update({ status: 'reviewing' }).eq('id', id);

    return NextResponse.json({ success: true, message: 'Generation complete', campaignId: id });

  } catch (error) {
    console.error('API /campaigns/:id/generate POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
