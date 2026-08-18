import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership before delete
  const { data: campaign, error: fetchError } = await supabase
    .from('campaigns')
    .select('id, creator_id')
    .eq('id', id)
    .single()

  if (fetchError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  if (campaign.creator_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete cascade handles platform_versions, or delete campaign directly
  const { error: deleteError } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, id })
}
