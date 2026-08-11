import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, role } = await req.json();
  if (!id || !['admin', 'roamer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  }

  const service = await createServiceClient();
  await service.from('profiles').update({ role }).eq('id', id);
  return NextResponse.json({ ok: true });
}
