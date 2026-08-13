import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/hikes';

export const metadata = { title: 'Mijn profiel | Roulette Routes Roamers' };

export default async function RoamerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single();

  const service = await createServiceClient();
  const { data: registrations } = await service
    .from('registrations')
    .select('id, wandeling, registered_at, actief')
    .eq('profile_id', user.id)
    .order('registered_at', { ascending: false });

  const { data: walkRecords } = await supabase
    .from('walk_records')
    .select('walk_slug, title, date, distance_km')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

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

      {/* Aanmeldingen */}
      <div className="mb-10">
        <h2 className="font-display font-bold text-xl mb-4" style={{ color: '#2C1A0E' }}>Aanmeldingen</h2>
        {registrations?.length ? (
          <div className="space-y-3">
            {registrations.map((r) => (
              <div key={r.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: '#2C1A0E' }}>{r.wandeling}</p>
                  {r.registered_at && (
                    <p className="text-xs mt-0.5" style={{ color: '#8B5A2B' }}>
                      Aangemeld op {new Date(r.registered_at).toLocaleDateString('nl-NL')}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.actief ? 'badge-upcoming' : 'badge-past'}`}>
                  {r.actief ? 'Actief' : 'Inactief'}
                </span>
              </div>
            ))}
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
            {walkRecords.map((r) => (
              <div key={r.walk_slug} className="card p-4 flex items-center justify-between">
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
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: '#8B5A2B' }}>Nog geen gedane wandelingen geregistreerd.</p>
        )}
      </div>
    </div>
  );
}
