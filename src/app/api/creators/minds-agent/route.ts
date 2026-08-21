import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId } = await req.json();
    const normalizedAgentId = typeof agentId === 'string' && agentId.trim()
      ? agentId.trim()
      : null;

    const { error } = await supabase.from('creators').upsert({
      id: user.id,
      email: user.email ?? null,
      mind_id: normalizedAgentId,
    }, { onConflict: 'id' });

    if (error) {
      console.error('Error binding Minds agent:', error);
      return NextResponse.json({ error: 'Failed to bind Minds agent' }, { status: 500 });
    }

    return NextResponse.json({ success: true, agentId: normalizedAgentId });
  } catch (error) {
    console.error('PATCH /api/creators/minds-agent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
