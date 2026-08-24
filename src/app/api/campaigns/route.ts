import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCampaignContent } from '@/lib/campaign-generation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const sourceText = typeof body.source_text === 'string' ? body.source_text.trim() : '';
    const platforms = Array.isArray(body.platforms)
      ? body.platforms.filter((platform: unknown): platform is string => typeof platform === 'string')
      : [];
    const sponsorBrief = body.sponsor_brief && typeof body.sponsor_brief === 'object' && !Array.isArray(body.sponsor_brief)
      ? body.sponsor_brief
      : {};

    if (!title || !sourceText || platforms.length === 0) {
      return NextResponse.json(
        { error: 'title, source_text, and at least one platform are required' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure a creators profile row exists for existing auth users as well.
    await supabase.from('creators').upsert({
      id: user.id,
      email: user.email ?? null,
    }, { onConflict: 'id' });

    // Insert campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        creator_id: user.id,
        title,
        source_text: sourceText,
        sponsor_brief: sponsorBrief,
        platforms,
        status: 'draft'
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Error inserting campaign:', campaignError);
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    // Return immediately and run Minds generation after the response is sent.
    after(async () => {
      try {
        await generateCampaignContent(supabase, campaign);
      } catch (err) {
        console.error('Failed to generate campaign content:', err);
      }
    });

    return NextResponse.json({ success: true, id: campaign.id });

  } catch (error) {
    console.error('API /campaigns POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
