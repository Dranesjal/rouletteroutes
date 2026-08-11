import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getAdminRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  return data?.role as string | undefined;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getAdminRole(supabase, user.id);
  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, betaald } = await req.json();
  if (!id || typeof betaald !== 'boolean') {
    return NextResponse.json({ error: 'id en betaald vereist' }, { status: 400 });
  }

  const service = await createServiceClient();
  const { error } = await service
    .from('registrations')
    .update({
      betaald,
      betaald_op: betaald ? new Date().toISOString() : null,
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
