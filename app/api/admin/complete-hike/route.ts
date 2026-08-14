import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Auth: alleen admins
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role as string | undefined;
  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: 'slug vereist' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = getAdminClient() as any;

  const { data: hike } = await service.from('hikes').select('slug, title, distance_km, date').eq('slug', slug).single();
  if (!hike) return NextResponse.json({ error: 'Wandeling niet gevonden' }, { status: 404 });

  // Haal alle aanmeldingen op met een gekoppeld account
  const { data: registrations, error: regError } = await service
    .from('registrations')
    .select('profile_id')
    .eq('wandeling', slug)
    .not('profile_id', 'is', null);

  if (regError) {
    return NextResponse.json({ error: regError.message }, { status: 500 });
  }

  if (!registrations?.length) {
    return NextResponse.json({ created: 0, message: 'Geen gekoppelde Roamers voor deze wandeling.' });
  }

  // Maak walk_records aan, upsert om duplicaten te skippen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records = registrations.map((r: any) => ({
    user_id: r.profile_id as string,
    type: 'rrr' as const,
    walk_slug: hike.slug,
    title: hike.title,
    distance_km: hike.distance_km,
    date: hike.date,
    verified: true,
    is_circular: false,
  }));

  const { error: insertError } = await service
    .from('walk_records')
    .upsert(records, { onConflict: 'user_id,walk_slug', ignoreDuplicates: true });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ created: records.length });
}
