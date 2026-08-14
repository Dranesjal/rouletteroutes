import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { formatDate } from '@/lib/hikes';
import ProfileForm from './ProfileForm';

export const metadata = { title: 'Mijn profiel | Roulette Routes Roamers' };

export default async function RoamerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, dietary')
    .eq('id', user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = getAdminClient() as any;

  type Reg = {
    id: string; wandeling: string; registered_at: string; actief: boolean; profile_id: string | null;
    betaald: boolean; betaald_op: string | null; wilt_boekje: boolean; wil_lunchen: boolean;
    name: string; adres: string | null; postcode: string | null; woonplaats: string | null;
    telefoon: string | null; dietary: string | null;
  };

  // Fetch by profile_id AND by email (catches pre-account registrations)
  const [{ data: byId }, { data: byEmail }] = await Promise.all([
    service.from('registrations')
      .select('*')
      .eq('profile_id', user.id)
      .order('registered_at', { ascending: false }) as Promise<{ data: Reg[] | null }>,
    service.from('registrations')
      .select('*')
      .eq('email', user.email ?? '')
      .is('profile_id', null)
      .order('registered_at', { ascending: false }) as Promise<{ data: Reg[] | null }>,
  ]);

  // Backfill profile_id for registrations found by email
  const unlinked = (byEmail ?? []).filter(r => !r.profile_id);
  if (unlinked.length > 0) {
    await service.from('registrations')
      .update({ profile_id: user.id })
      .in('id', unlinked.map((r: Reg) => r.id));
  }

  // Merge and deduplicate
  const seen = new Set((byId ?? []).map(r => r.id));
  const registrations: Reg[] = [
    ...(byId ?? []),
    ...(byEmail ?? []).filter(r => !seen.has(r.id)),
  ].sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime());

  const regSlugs = [...new Set(registrations.map(r => r.wandeling))];

  const [{ data: walkRecords }, { data: regProductsData }, { data: hikeDetails }] = await Promise.all([
    supabase
      .from('walk_records')
      .select('walk_slug, title, date, distance_km')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    service.from('registration_products').select('registration_id, product_id, naam, prijs') as Promise<{ data: { registration_id: string; product_id: string; naam: string | null; prijs: number | null }[] | null }>,
    regSlugs.length > 0
      ? service.from('hikes').select('slug, title, date, meeting_point, meeting_time, start_time').in('slug', regSlugs) as Promise<{ data: { slug: string; title: string; date: string; meeting_point: string; meeting_time: string; start_time: string }[] | null }>
      : Promise.resolve({ data: [] }),
  ]);

  type RegProductRow = { registration_id: string; product_id: string; naam: string | null; prijs: number | null };
  const regProductsMap: Record<string, RegProductRow[]> = {};
  for (const rp of regProductsData ?? []) {
    if (!regProductsMap[rp.registration_id]) regProductsMap[rp.registration_id] = [];
    regProductsMap[rp.registration_id].push(rp);
  }
  const hikeMap: Record<string, { title: string; date: string; meeting_point: string; meeting_time: string; start_time: string }> =
    Object.fromEntries((hikeDetails ?? []).map(h => [h.slug, h]));

  const regAmount = (r: Reg) =>
    (regProductsMap[r.id] ?? []).reduce((s, rp) => s + Number(rp.prijs ?? 0), 0);

  // Fetch group photos for walked hikes
  type HikePhoto = { slug: string; group_photo_url: string };
  const slugsWithPhoto = (walkRecords ?? []).map(r => r.walk_slug).filter(Boolean) as string[];
  let hikePhotos: HikePhoto[] = [];
  if (slugsWithPhoto.length > 0) {
    const { data } = await service.from('hikes').select('slug, group_photo_url').in('slug', slugsWithPhoto);
    hikePhotos = (data as HikePhoto[] | null) ?? [];
  }
  const photoMap: Record<string, string> = Object.fromEntries(
    hikePhotos.filter((h: HikePhoto) => h.group_photo_url).map((h: HikePhoto) => [h.slug, h.group_photo_url])
  );

  const totalKm = walkRecords?.reduce((sum, r) => sum + (r.distance_km ?? 0), 0) ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C4622D' }}>Mijn profiel</p>
        <h1 className="font-display text-4xl font-black" style={{ color: '#2C1A0E' }}>
          Hoi, {profile?.name ?? user.email}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="card p-5 text-center">
          <p className="text-3xl font-black font-display" style={{ color: '#C4622D' }}>{walkRecords?.length ?? 0}</p>
          <p className="text-xs uppercase tracking-wider font-bold mt-1" style={{ color: '#8B5A2B' }}>Wandelingen gelopen</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-black font-display" style={{ color: '#C4622D' }}>{totalKm} km</p>
          <p className="text-xs uppercase tracking-wider font-bold mt-1" style={{ color: '#8B5A2B' }}>Totaal gelopen</p>
        </div>
      </div>

      {/* Profiel bewerken */}
      <div className="mb-10">
        <h2 className="font-display font-bold text-xl mb-4" style={{ color: '#2C1A0E' }}>Mijn gegevens</h2>
        <div className="card p-5">
          <ProfileForm
            userId={user.id}
            initialName={profile?.name ?? ''}
            initialDietary={profile?.dietary ?? ''}
          />
        </div>
      </div>

      {/* Aanmeldingen */}
      <div className="mb-10">
        <h2 className="font-display font-bold text-xl mb-4" style={{ color: '#2C1A0E' }}>Aanmeldingen</h2>
        {registrations?.length ? (
          <div className="space-y-3">
            {registrations.map((r) => {
              const amount = regAmount(r);
              const hike = hikeMap[r.wandeling];
              const products = regProductsMap[r.id] ?? [];
              return (
                <div key={r.id} className="card p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold" style={{ color: '#2C1A0E' }}>{hike?.title ?? r.wandeling}</p>
                      {hike?.date && (
                        <p className="text-xs mt-0.5" style={{ color: '#8B5A2B' }}>{formatDate(hike.date)}</p>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${r.actief ? 'badge-upcoming' : 'badge-past'}`}>
                      {r.actief ? 'Actief' : 'Inactief'}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-1" style={{ borderTop: '1px solid #EDD49A' }}>
                    {hike?.meeting_point && (
                      <div>
                        <p className="font-bold uppercase tracking-wide mb-0.5" style={{ color: '#8B5A2B' }}>Vertrekpunt</p>
                        <p style={{ color: '#2C1A0E' }}>{hike.meeting_point}</p>
                      </div>
                    )}
                    {(hike?.meeting_time || hike?.start_time) && (
                      <div>
                        <p className="font-bold uppercase tracking-wide mb-0.5" style={{ color: '#8B5A2B' }}>Tijden</p>
                        <p style={{ color: '#2C1A0E' }}>
                          {hike.meeting_time && <>Verzamelen {hike.meeting_time}</>}
                          {hike.meeting_time && hike.start_time && <br />}
                          {hike.start_time && <>Start {hike.start_time}</>}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="font-bold uppercase tracking-wide mb-0.5" style={{ color: '#8B5A2B' }}>Lunch</p>
                      <p style={{ color: '#2C1A0E' }}>{r.wil_lunchen ? 'Ja' : 'Nee'}</p>
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-wide mb-0.5" style={{ color: '#8B5A2B' }}>Boekje</p>
                      <p style={{ color: '#2C1A0E' }}>{r.wilt_boekje ? 'Ja' : 'Nee'}</p>
                    </div>
                    {(r.adres || r.postcode || r.woonplaats) && (
                      <div className="col-span-2">
                        <p className="font-bold uppercase tracking-wide mb-0.5" style={{ color: '#8B5A2B' }}>Adres</p>
                        <p style={{ color: '#2C1A0E' }}>
                          {[r.adres, [r.postcode, r.woonplaats].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                    {r.telefoon && (
                      <div>
                        <p className="font-bold uppercase tracking-wide mb-0.5" style={{ color: '#8B5A2B' }}>Telefoon</p>
                        <p style={{ color: '#2C1A0E' }}>{r.telefoon}</p>
                      </div>
                    )}
                    {r.dietary && (
                      <div>
                        <p className="font-bold uppercase tracking-wide mb-0.5" style={{ color: '#8B5A2B' }}>Dieetwensen</p>
                        <p style={{ color: '#2C1A0E' }}>{r.dietary}</p>
                      </div>
                    )}
                  </div>

                  {/* Betaling */}
                  {products.length > 0 && (
                    <div className="pt-2 space-y-1.5" style={{ borderTop: '1px solid #EDD49A' }}>
                      {products.map((rp, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span style={{ color: '#5C3D1E' }}>{rp.naam}</span>
                          <span style={{ color: '#2C1A0E', fontVariantNumeric: 'tabular-nums' }}>
                            € {Number(rp.prijs ?? 0).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-1.5" style={{ borderTop: '1px dashed #EDD49A' }}>
                        <span className="text-xs font-bold" style={{ color: '#8B5A2B' }}>Totaal</span>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ background: r.betaald ? '#D1FAE5' : '#FEF3C7', color: r.betaald ? '#065F46' : '#92400E' }}>
                          {r.betaald ? '✓ Betaald' : 'Open'} · € {amount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      {r.betaald && r.betaald_op && (
                        <p className="text-xs" style={{ color: '#4A7C59' }}>
                          Betaald op {new Date(r.betaald_op).toLocaleDateString('nl-NL')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card p-6 text-center" style={{ color: '#8B5A2B' }}>
            <p className="mb-3">Je hebt je nog niet aangemeld voor een wandeling.</p>
            <Link href="/wandelingen" className="btn-primary">Bekijk wandelingen</Link>
          </div>
        )}
      </div>

      {/* Wandelhistorie */}
      <div>
        <h2 className="font-display font-bold text-xl mb-4" style={{ color: '#2C1A0E' }}>Gelopen wandelingen</h2>
        {walkRecords?.length ? (
          <div className="space-y-3">
            {walkRecords.map((r) => {
              const photo = r.walk_slug ? photoMap[r.walk_slug] : undefined;
              return (
                <div key={r.walk_slug} className="card overflow-hidden">
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={`Groepsfoto ${r.title}`} className="w-full object-cover max-h-48" />
                  )}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#2C1A0E' }}>{r.title ?? r.walk_slug}</p>
                      {r.date && (
                        <p className="text-xs mt-0.5" style={{ color: '#8B5A2B' }}>{formatDate(r.date)}</p>
                      )}
                    </div>
                    {r.distance_km && (
                      <span className="text-sm font-bold" style={{ color: '#C4622D' }}>{r.distance_km} km</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: '#8B5A2B' }}>Nog geen gedane wandelingen geregistreerd.</p>
        )}
      </div>
    </div>
  );
}
