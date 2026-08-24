import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCampaignContent } from '@/lib/campaign-generation';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: campaign, error: getErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (getErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    after(async () => {
      try {
        await generateCampaignContent(supabase, campaign);
      } catch (error) {
        console.error('Failed to regenerate campaign content:', error);
      }
    });

    return NextResponse.json({ success: true, message: 'Generation scheduled', campaignId: id });

  } catch (error) {
    console.error('API /campaigns/:id/generate POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
