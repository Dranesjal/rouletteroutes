import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const callerRole = profile?.role as string | undefined;
  if (callerRole !== 'admin' && callerRole !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, role } = await req.json();
  const allowed = callerRole === 'super_admin'
    ? ['roamer', 'admin', 'super_admin']
    : ['roamer', 'admin'];

  if (!id || !allowed.includes(role)) {
    return NextResponse.json({ error: 'Niet toegestaan' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = getAdminClient() as any;
  await service.from('profiles').update({ role }).eq('id', id);
  return NextResponse.json({ ok: true });
}
