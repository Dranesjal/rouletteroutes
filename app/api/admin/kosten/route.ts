import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  const role = data?.role as string | undefined;
  return role === 'admin' || role === 'super_admin';
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await checkAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const slug = req.nextUrl.searchParams.get('slug');
  const service = await createServiceClient();
  const query = service.from('wandeling_kosten').select('*').order('created_at');
  const { data, error } = slug ? await query.eq('wandeling_slug', slug) : await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kosten: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await checkAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { wandeling_slug, omschrijving, bedrag } = await req.json();
  if (!wandeling_slug || !omschrijving || bedrag == null) {
    return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
  }

  const service = await createServiceClient();
  const { data, error } = await service
    .from('wandeling_kosten')
    .insert({ wandeling_slug, omschrijving, bedrag: parseFloat(bedrag) })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kost: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await checkAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id vereist' }, { status: 400 });

  const service = await createServiceClient();
  const { error } = await service.from('wandeling_kosten').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
