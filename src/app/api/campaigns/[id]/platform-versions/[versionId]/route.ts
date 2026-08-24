import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { writeMindMemory } from '@/minds/client';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id: campaignId, versionId } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, creator_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const finalText = typeof body.final_text === 'string' ? body.final_text.trim() : '';

    if (!finalText) {
      return NextResponse.json({ error: 'final_text is required' }, { status: 400 });
    }

    const { data: version, error: versionError } = await supabase
      .from('platform_versions')
      .select('id, campaign_id, platform, generated_text')
      .eq('id', versionId)
      .eq('campaign_id', campaignId)
      .single();

    if (versionError || !version) {
      return NextResponse.json({ error: 'Platform version not found' }, { status: 404 });
    }

    const { data: updatedVersion, error: updateError } = await supabase
      .from('platform_versions')
      .update({ final_text: finalText, status: 'reviewed' })
      .eq('id', version.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to persist platform version edit:', updateError);
      return NextResponse.json({ error: 'Failed to save edit' }, { status: 500 });
    }

    const { error: learningError } = await supabase
      .from('learning_events')
      .insert({
        creator_id: user.id,
        event_type: 'modification',
        original_text: version.generated_text,
        modified_text: finalText,
        context: `Campaign ${campaignId}, platform ${version.platform}`,
        extracted_pattern: 'User edited generated content.',
        applied_to_campaigns: [campaignId],
      });

    if (learningError) {
      console.error('Failed to record learning event:', learningError);
      return NextResponse.json({ error: 'Failed to record learning event' }, { status: 500 });
    }

    const { data: creator } = await supabase
      .from('creators')
      .select('mind_id')
      .eq('id', user.id)
      .single();

    let memorySynced = false;

    if (creator?.mind_id) {
      try {
        await writeMindMemory(creator.mind_id, `platform:${version.platform}`, {
          campaignId,
          platform: version.platform,
          finalText,
          updatedAt: new Date().toISOString(),
        });
        memorySynced = true;
      } catch (error) {
        console.error('Minds memory write failed:', error);
      }
    }

    return NextResponse.json({
      success: true,
      version: updatedVersion,
      memorySynced,
    });
  } catch (error) {
    console.error('PATCH /api/campaigns/:id/platform-versions/:versionId error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
