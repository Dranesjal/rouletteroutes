import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  const role = data?.role as string | undefined;
  return role === 'admin' || role === 'super_admin';
}

export async function GET() {
  const service = await createServiceClient();
  const { data } = await service.from('hikes').select('*').order('date', { ascending: false });
  return NextResponse.json({ hikes: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await checkAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { slug, title, date } = body;
  if (!slug?.trim() || !title?.trim() || !date) {
    return NextResponse.json({ error: 'slug, title en date zijn verplicht' }, { status: 400 });
  }

  const service = await createServiceClient();
  const { data, error } = await service.from('hikes').upsert({
    slug: slug.trim(),
    title: title.trim(),
    subtitle: body.subtitle?.trim() || '',
    date,
    location: body.location?.trim() || '',
    region: body.region?.trim() || '',
    distance_km: body.distance_km ? parseFloat(body.distance_km) : 0,
    duration_min: body.duration_min ? parseInt(body.duration_min) : 0,
    description: body.description?.trim() || '',
    status: body.status || 'upcoming',
    meeting_point: body.meeting_point?.trim() || '',
    meeting_time: body.meeting_time?.trim() || '',
    start_time: body.start_time?.trim() || '',
    registration_open: body.registration_open === true,
    registration_required: body.registration_required === true,
    max_participants: body.max_participants ? parseInt(body.max_participants) : null,
    has_lunch: body.has_lunch === true,
    lunch_venue: body.lunch_venue?.trim() || '',
    lunch_url: body.lunch_url?.trim() || '',
    difficulty: body.difficulty || 'easy',
    terrain: body.terrain?.trim() || '',
    wandelboekje: body.wandelboekje === true,
  }, { onConflict: 'slug' }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ hike: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await checkAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: 'slug vereist' }, { status: 400 });

  const service = await createServiceClient();
  const { error } = await service.from('hikes').delete().eq('slug', slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
