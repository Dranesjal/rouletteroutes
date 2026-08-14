import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  const role = data?.role as string | undefined;
  return role === 'admin' || role === 'super_admin';
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from('hikes').select('*').order('date', { ascending: false });
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = getAdminClient() as any;
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
    registration_note: body.registration_note?.trim() || '',
    registration_success_note: body.registration_success_note?.trim() || '',
    registration_form: body.registration_form === 'full' ? 'full' : 'basic',
    route_image_url: body.route_image_url?.trim() || '',
    group_photo_url: body.group_photo_url?.trim() || '',
    boekje_prijs: body.boekje_prijs ? parseFloat(body.boekje_prijs) : 0,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = getAdminClient() as any;
  const { error } = await service.from('hikes').delete().eq('slug', slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
