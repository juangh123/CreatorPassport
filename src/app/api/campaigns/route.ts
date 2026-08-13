import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { title, source_text, platforms, sponsor_brief } = await req.json();

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
        source_text,
        sponsor_brief,
        platforms,
        status: 'draft'
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Error inserting campaign:', campaignError);
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    // Await the generation so it doesn't fail due to serverless early exit.
    // In production, consider using a background queue like Inngest, Trigger.dev, or Next.js after().
    await fetch(new URL(`/api/campaigns/${campaign.id}/generate`, req.url), {
      method: 'POST',
    }).catch(err => console.error("Async trigger error:", err));

    return NextResponse.json({ success: true, id: campaign.id });

  } catch (error) {
    console.error('API /campaigns POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
