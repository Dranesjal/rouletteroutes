'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Registration {
  id: string;
  wandeling: string;
  name: string;
  adres: string;
  postcode: string;
  woonplaats: string;
  land: string;
  geboortedatum: string;
  geslacht: string;
  email: string;
  phone: string;
  dietary: string;
  message: string;
  wilt_boekje: boolean;
  wil_lunchen: boolean;
  profile_id: string | null;
  registered_at: string;
}

interface Roamer {
  id: string;
  name: string;
  role: string;
  created_at: string;
}

interface HikeSummary {
  slug: string;
  title: string;
  date: string;
  distanceKm: number;
  status: 'upcoming' | 'completed';
}

interface Props {
  adminName: string;
  registrations: Registration[];
  roamers: Roamer[];
  hikes: HikeSummary[];
}

type Tab = 'registrations' | 'lunch' | 'wandelingen' | 'roamers';

export default function AdminClient({ adminName, registrations, roamers, hikes }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('registrations');
  const [filter, setFilter] = useState('');
  const [completing, setCompleting] = useState<string | null>(null);
  const [completeResults, setCompleteResults] = useState<Record<string, { created: number; message?: string } | { error: string }>>({});

  const uniqueWandelingen = [...new Set(registrations.map(r => r.wandeling))];
  const filtered = registrations.filter(r => !filter || r.wandeling === filter);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const makeAdmin = async (id: string) => {
    await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role: 'admin' }),
    });
    router.refresh();
  };

  const removeAdmin = async (id: string) => {
    await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role: 'roamer' }),
    });
    router.refresh();
  };

  const completeHike = async (slug: string) => {
    setCompleting(slug);
    try {
      const res = await fetch('/api/admin/complete-hike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      setCompleteResults(prev => ({ ...prev, [slug]: data }));
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-black" style={{ color: '#2C1A0E' }}>Admin</h1>
          <p className="text-sm mt-1" style={{ color: '#8B5A2B' }}>Ingelogd als {adminName}</p>
        </div>
        <button onClick={handleLogout} className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: '#F5E4C0', color: '#5C3D1E' }}>
          Uitloggen
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b" style={{ borderColor: '#EDD49A' }}>
        {([
          ['registrations', `Aanmeldingen (${registrations.length})`],
          ['lunch', `Lunch (${registrations.filter(r => r.wil_lunchen).length})`],
          ['wandelingen', `Wandelingen (${uniqueWandelingen.length})`],
          ['roamers', `Roamers (${roamers.length})`],
        ] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className="pb-3 px-1 text-sm font-bold border-b-2 transition-all"
            style={{ borderColor: tab === t ? '#C4622D' : 'transparent', color: tab === t ? '#C4622D' : '#8B5A2B' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Aanmeldingen ── */}
      {tab === 'registrations' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color: '#5C3D1E' }}>{filtered.length} aanmelding(en)</p>
            {uniqueWandelingen.length > 1 && (
              <select className="field text-sm py-1" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="">Alle wandelingen</option>
                {uniqueWandelingen.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            )}
          </div>
          {filtered.length === 0 ? (
            <p className="text-center py-12" style={{ color: '#8B5A2B' }}>Geen aanmeldingen.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#EDD49A' }}>
              <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <thead style={{ background: '#F5E4C0' }}>
                  <tr>
                    {['Naam', 'Woonplaats', 'Geboortedatum', 'Geslacht', 'E-mail', 'Telefoon', 'Wandeling', 'Account', 'Lunch', 'Boekje', 'Dieet', 'Opmerking', 'Datum'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wide whitespace-nowrap" style={{ color: '#8B5A2B' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#FAF3E3' : 'white', color: '#2C1A0E' }}>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{r.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{r.woonplaats || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{r.geboortedatum || '-'}</td>
                      <td className="px-4 py-3">{r.geslacht || '-'}</td>
                      <td className="px-4 py-3">{r.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{r.phone || '-'}</td>
                      <td className="px-4 py-3">{r.wandeling}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: r.profile_id ? '#D1FAE5' : '#F3F4F6', color: r.profile_id ? '#065F46' : '#6B7280' }}>
                          {r.profile_id ? 'Roamer' : 'Gast'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{r.wil_lunchen ? '✅ Ja' : 'Nee'}</td>
                      <td className="px-4 py-3">{r.wilt_boekje ? '✅ Ja' : 'Nee'}</td>
                      <td className="px-4 py-3">{r.dietary || '-'}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{r.message || '-'}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#8B5A2B' }}>
                        {new Date(r.registered_at).toLocaleDateString('nl-NL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Lunch per wandeling ── */}
      {tab === 'lunch' && (
        <div className="space-y-8">
          {uniqueWandelingen.length === 0 ? (
            <p className="text-center py-12" style={{ color: '#8B5A2B' }}>Geen aanmeldingen.</p>
          ) : (
            uniqueWandelingen.map(wandeling => {
              const all = registrations.filter(r => r.wandeling === wandeling);
              const lunchers = all.filter(r => r.wil_lunchen);
              return (
                <div key={wandeling} className="rounded-xl border overflow-hidden" style={{ borderColor: '#EDD49A' }}>
                  <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#F5E4C0' }}>
                    <span className="font-bold text-sm" style={{ color: '#2C1A0E' }}>{wandeling}</span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: '#C4622D', color: 'white' }}>
                      {lunchers.length} / {all.length} mee met lunch
                    </span>
                  </div>
                  {lunchers.length === 0 ? (
                    <p className="px-5 py-4 text-sm" style={{ color: '#8B5A2B' }}>Niemand heeft zich aangemeld voor de lunch.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: '#FAF3E3' }}>
                          {['Naam', 'E-mail', 'Telefoon', 'Dieetwensen'].map(h => (
                            <th key={h} className="text-left px-4 py-2 font-bold text-xs uppercase tracking-wide" style={{ color: '#8B5A2B' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lunchers.map((r, i) => (
                          <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#FAF3E3', color: '#2C1A0E' }}>
                            <td className="px-4 py-3 font-semibold whitespace-nowrap">{r.name}</td>
                            <td className="px-4 py-3">{r.email}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{r.phone || '-'}</td>
                            <td className="px-4 py-3">{r.dietary || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Wandelingen beheer ── */}
      {tab === 'wandelingen' && (
        <div className="space-y-5">
          <p className="text-sm mb-2" style={{ color: '#8B5A2B' }}>
            Sluit een wandeling af om voor alle deelnemers <em>met een Roamer-account</em> automatisch een looprecord aan te maken.
            Gasten zonder account krijgen hun record als ze later alsnog een account aanmaken.
          </p>
          {uniqueWandelingen.length === 0 ? (
            <p className="text-center py-12" style={{ color: '#8B5A2B' }}>Geen aanmeldingen.</p>
          ) : (
            uniqueWandelingen.map(slug => {
              const hike = hikes.find(h => h.slug === slug);
              const regs = registrations.filter(r => r.wandeling === slug);
              const linked = regs.filter(r => r.profile_id !== null);
              const guests = regs.filter(r => r.profile_id === null);
              const result = completeResults[slug];
              const isLoading = completing === slug;

              return (
                <div key={slug} className="card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h3 className="font-display font-bold text-lg" style={{ color: '#2C1A0E' }}>
                        {hike?.title ?? slug}
                      </h3>
                      {hike && (
                        <p className="text-sm mt-0.5" style={{ color: '#8B5A2B' }}>
                          {new Date(hike.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          {' · '}{hike.distanceKm} km
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => completeHike(slug)}
                      disabled={isLoading || !!result}
                      className="text-sm font-semibold px-4 py-2 rounded-lg flex-shrink-0 transition-all"
                      style={{
                        background: result ? '#D1FAE5' : isLoading ? '#F5E4C0' : '#2C1A0E',
                        color: result ? '#065F46' : isLoading ? '#8B5A2B' : 'white',
                        cursor: result ? 'default' : 'pointer',
                      }}>
                      {isLoading ? 'Bezig...' : result ? '✓ Afgerond' : 'Wandeling afsluiten'}
                    </button>
                  </div>

                  {/* Statistieken */}
                  <div className="flex gap-4 mt-4 text-sm flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#C4622D' }} />
                      <strong>{regs.length}</strong> aanmeldingen
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#4A7C59' }} />
                      <strong>{linked.length}</strong> Roamer-account
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#8B5A2B' }} />
                      <strong>{guests.length}</strong> gast
                    </span>
                  </div>

                  {/* Resultaat na afsluiten */}
                  {result && (
                    <div className="mt-3 text-sm px-3 py-2 rounded-lg"
                      style={{ background: 'error' in result ? '#FEF2F2' : '#D1FAE5', color: 'error' in result ? '#991B1B' : '#065F46' }}>
                      {'error' in result
                        ? `Fout: ${result.error}`
                        : result.message
                          ? result.message
                          : `${result.created} looprecord${result.created !== 1 ? 's' : ''} aangemaakt.`}
                    </div>
                  )}

                  {/* Deelnemers met account */}
                  {linked.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-xs font-semibold cursor-pointer" style={{ color: '#4A7C59' }}>
                        Toon {linked.length} Roamer{linked.length !== 1 ? 's' : ''} die record krijgen
                      </summary>
                      <ul className="mt-2 text-xs space-y-1" style={{ color: '#2C1A0E' }}>
                        {linked.map(r => (
                          <li key={r.id} className="flex gap-2">
                            <span className="font-semibold">{r.name}</span>
                            <span style={{ color: '#8B5A2B' }}>{r.email}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {/* Gasten zonder account */}
                  {guests.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs font-semibold cursor-pointer" style={{ color: '#8B5A2B' }}>
                        Toon {guests.length} gast{guests.length !== 1 ? 'en' : ''} zonder account
                      </summary>
                      <ul className="mt-2 text-xs space-y-1" style={{ color: '#5C3D1E' }}>
                        {guests.map(r => (
                          <li key={r.id}>{r.name} ({r.email})</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Roamers ── */}
      {tab === 'roamers' && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#EDD49A' }}>
          <table className="w-full text-sm">
            <thead style={{ background: '#F5E4C0' }}>
              <tr>
                {['Naam', 'Rol', 'Aangemeld op', 'Acties'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wide" style={{ color: '#8B5A2B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roamers.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? '#FAF3E3' : 'white', color: '#2C1A0E' }}>
                  <td className="px-4 py-3 font-semibold">{r.name || '(geen naam)'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{ background: r.role === 'admin' ? '#C4622D' : '#EDD49A', color: r.role === 'admin' ? 'white' : '#5C3D1E' }}>
                      {r.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8B5A2B' }}>
                    {new Date(r.created_at).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-4 py-3">
                    {r.role === 'roamer' ? (
                      <button onClick={() => makeAdmin(r.id)} className="text-xs px-3 py-1 rounded-lg font-semibold"
                        style={{ background: '#FFF8EC', color: '#7A4B00', border: '1px solid #F5D78A' }}>
                        Maak admin
                      </button>
                    ) : (
                      <button onClick={() => removeAdmin(r.id)} className="text-xs px-3 py-1 rounded-lg font-semibold"
                        style={{ background: '#FEF2F2', color: '#991B1B' }}>
                        Verwijder admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
