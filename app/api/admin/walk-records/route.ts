import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  const role = data?.role as string | undefined;
  return role === 'admin' || role === 'super_admin';
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await checkAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { user_id, walk_slug, title, date, distance_km, notes } = await req.json();
  if (!user_id || !title || !date) {
    return NextResponse.json({ error: 'user_id, title en date zijn verplicht' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = getAdminClient() as any;
  const { data, error } = await service
    .from('walk_records')
    .upsert({
      user_id,
      walk_slug: walk_slug || null,
      title,
      date,
      distance_km: distance_km ? parseFloat(distance_km) : null,
      notes: notes || '',
      verified: true,
      type: 'rrr',
    }, { onConflict: 'user_id,walk_slug', ignoreDuplicates: false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await checkAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id vereist' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = getAdminClient() as any;
  const { error } = await service.from('walk_records').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
