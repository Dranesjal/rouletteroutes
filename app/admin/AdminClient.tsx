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
  betaald: boolean;
  betaald_op: string | null;
  actief: boolean;
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

interface Kost {
  id: string;
  wandeling_slug: string;
  omschrijving: string;
  bedrag: number;
}

interface WalkRecord {
  id: string;
  user_id: string;
  walk_slug: string | null;
  title: string;
  date: string | null;
  distance_km: number | null;
  notes: string;
  verified: boolean;
}

interface DbHike {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  location: string;
  region: string;
  distance_km: number;
  duration_min: number;
  description: string;
  status: 'upcoming' | 'completed';
  meeting_point: string;
  meeting_time: string;
  start_time: string;
  registration_open: boolean;
  has_lunch: boolean;
  lunch_venue: string;
  lunch_url: string;
  difficulty: string;
  terrain: string;
  wandelboekje: boolean;
}

const EMPTY_HIKE: DbHike = {
  slug: '', title: '', subtitle: '', date: '', location: '', region: '',
  distance_km: 0, duration_min: 0, description: '', status: 'upcoming',
  meeting_point: '', meeting_time: '', start_time: '', registration_open: false,
  has_lunch: false, lunch_venue: '', lunch_url: '', difficulty: 'easy', terrain: '', wandelboekje: false,
};

interface Props {
  adminName: string;
  adminRole: 'admin' | 'super_admin';
  registrations: Registration[];
  roamers: Roamer[];
  hikes: HikeSummary[];
  kosten: Kost[];
  walkRecords: WalkRecord[];
  allHikes: DbHike[];
}

type Tab = 'registrations' | 'wandelingen' | 'roamers' | 'looprecords' | 'hikes';

const euro = (n: number) => `€ ${n.toFixed(2).replace('.', ',')}`;

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{
      background: role === 'super_admin' ? '#7C3AED' : role === 'admin' ? '#C4622D' : '#EDD49A',
      color: role === 'roamer' ? '#5C3D1E' : 'white',
    }}>
      {role === 'super_admin' ? 'Super admin' : role}
    </span>
  );
}

export default function AdminClient({ adminName, adminRole, registrations, roamers, hikes, kosten: initialKosten, walkRecords: initialWalkRecords, allHikes: initialAllHikes }: Props) {
  const router = useRouter();
  const isSuperAdmin = adminRole === 'super_admin';

  const [tab, setTab] = useState<Tab>('registrations');
  const [filter, setFilter] = useState('');
  const [showInactief, setShowInactief] = useState(false);

  // Optimistic registration state
  const [regs, setRegs] = useState<Registration[]>(registrations);

  // Kosten local state
  const [kosten, setKosten] = useState<Kost[]>(initialKosten);
  const [kostForm, setKostForm] = useState<Record<string, { omschrijving: string; bedrag: string }>>({});

  // Walk records state
  const [walkRecords, setWalkRecords] = useState<WalkRecord[]>(initialWalkRecords);
  const [walkForm, setWalkForm] = useState({ user_id: '', walk_slug: '', title: '', date: '', distance_km: '', notes: '' });
  const [walkSaving, setWalkSaving] = useState(false);
  const [walkError, setWalkError] = useState('');

  // Hike beheer state
  const [allHikes, setAllHikes] = useState<DbHike[]>(initialAllHikes);
  const [hikeForm, setHikeForm] = useState<DbHike>(EMPTY_HIKE);
  const [hikeEditing, setHikeEditing] = useState<string | null>(null);
  const [hikeSaving, setHikeSaving] = useState(false);
  const [hikeError, setHikeError] = useState('');

  // Lunch open/dicht per wandeling
  const [lunchOpen, setLunchOpen] = useState<Record<string, boolean>>({});

  // Wandelingen complete state
  const [completing, setCompleting] = useState<string | null>(null);
  const [completeResults, setCompleteResults] = useState<Record<string, { created: number; message?: string } | { error: string }>>({});

  const uniqueWandelingen = [...new Set(regs.map(r => r.wandeling))];
  const filtered = regs.filter(r =>
    (!filter || r.wandeling === filter) &&
    (showInactief || r.actief)
  );

  // ── Auth ──
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // ── Betaald toggle ──
  const toggleBetaald = async (id: string, current: boolean) => {
    const betaald = !current;
    setRegs(prev => prev.map(r => r.id === id ? { ...r, betaald, betaald_op: betaald ? new Date().toISOString() : null } : r));
    await fetch('/api/admin/toggle-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, betaald }),
    });
  };

  // ── Actief toggle ──
  const toggleActief = async (id: string, current: boolean) => {
    const actief = !current;
    setRegs(prev => prev.map(r => r.id === id ? { ...r, actief } : r));
    await fetch('/api/admin/toggle-actief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, actief }),
    });
  };

  // ── Verwijderen (super_admin only) ──
  const deleteReg = async (id: string, name: string) => {
    if (!confirm(`Aanmelding van ${name} definitief verwijderen?`)) return;
    setRegs(prev => prev.filter(r => r.id !== id));
    await fetch('/api/admin/delete-registration', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  };

  // ── Rollen ──
  const setRole = async (id: string, role: string) => {
    await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    });
    router.refresh();
  };

  // ── Kosten ──
  const addKost = async (slug: string) => {
    const form = kostForm[slug];
    if (!form?.omschrijving?.trim() || !form?.bedrag) return;
    const res = await fetch('/api/admin/kosten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wandeling_slug: slug, omschrijving: form.omschrijving, bedrag: form.bedrag }),
    });
    const { kost } = await res.json();
    if (kost) {
      setKosten(prev => [...prev, kost]);
      setKostForm(prev => ({ ...prev, [slug]: { omschrijving: '', bedrag: '' } }));
    }
  };

  const deleteKost = async (id: string) => {
    setKosten(prev => prev.filter(k => k.id !== id));
    await fetch('/api/admin/kosten', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  };

  // ── Hikes CRUD ──
  const saveHike = async () => {
    setHikeError('');
    if (!hikeForm.slug.trim() || !hikeForm.title.trim() || !hikeForm.date) {
      setHikeError('Slug, naam en datum zijn verplicht.');
      return;
    }
    setHikeSaving(true);
    try {
      const res = await fetch('/api/admin/hikes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hikeForm),
      });
      const data = await res.json();
      if (data.error) { setHikeError(data.error); return; }
      setAllHikes(prev => {
        const idx = prev.findIndex(h => h.slug === data.hike.slug);
        return idx >= 0 ? prev.map((h, i) => i === idx ? data.hike : h) : [data.hike, ...prev];
      });
      setHikeForm(EMPTY_HIKE);
      setHikeEditing(null);
    } finally {
      setHikeSaving(false);
    }
  };

  const editHike = (hike: DbHike) => {
    setHikeForm(hike);
    setHikeEditing(hike.slug);
  };

  const deleteHike = async (slug: string) => {
    if (!confirm(`Wandeling "${slug}" definitief verwijderen?`)) return;
    setAllHikes(prev => prev.filter(h => h.slug !== slug));
    await fetch('/api/admin/hikes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
  };

  const setHikeField = <K extends keyof DbHike>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setHikeForm(f => ({ ...f, [k]: e.target.value }));

  const setHikeCheck = (k: keyof DbHike) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setHikeForm(f => ({ ...f, [k]: e.target.checked }));

  // ── Walk records ──
  const saveWalkRecord = async () => {
    setWalkError('');
    if (!walkForm.user_id || !walkForm.title || !walkForm.date) {
      setWalkError('Roamer, naam en datum zijn verplicht.');
      return;
    }
    setWalkSaving(true);
    try {
      const res = await fetch('/api/admin/walk-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walkForm),
      });
      const data = await res.json();
      if (data.error) { setWalkError(data.error); return; }
      setWalkRecords(prev => [data.record, ...prev.filter(r => r.id !== data.record.id)]);
      setWalkForm({ user_id: '', walk_slug: '', title: '', date: '', distance_km: '', notes: '' });
    } finally {
      setWalkSaving(false);
    }
  };

  const deleteWalkRecord = async (id: string) => {
    if (!confirm('Looprecord verwijderen?')) return;
    setWalkRecords(prev => prev.filter(r => r.id !== id));
    await fetch('/api/admin/walk-records', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  };

  const fillFromHike = (slug: string) => {
    const hike = hikes.find(h => h.slug === slug);
    if (!hike) return;
    setWalkForm(f => ({ ...f, walk_slug: slug, title: hike.title, date: hike.date, distance_km: String(hike.distanceKm) }));
  };

  // ── Wandeling afsluiten ──
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-black" style={{ color: '#2C1A0E' }}>Admin</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm" style={{ color: '#8B5A2B' }}>Ingelogd als {adminName}</p>
            <RoleBadge role={adminRole} />
          </div>
        </div>
        <button onClick={handleLogout} className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: '#F5E4C0', color: '#5C3D1E' }}>
          Uitloggen
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b overflow-x-auto" style={{ borderColor: '#EDD49A' }}>
        {([
          ['registrations', `Aanmeldingen (${regs.filter(r => r.actief).length})`],
          ['wandelingen', `Wandelingen (${uniqueWandelingen.length})`],
          ['roamers', `Roamers (${roamers.length})`],
          ['looprecords', `Looprecords (${walkRecords.length})`],
          ['hikes', `Hikes (${allHikes.length})`],
        ] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className="pb-3 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap"
            style={{ borderColor: tab === t ? '#C4622D' : 'transparent', color: tab === t ? '#C4622D' : '#8B5A2B' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Aanmeldingen ── */}
      {tab === 'registrations' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold" style={{ color: '#5C3D1E' }}>{filtered.length} aanmelding(en)</p>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: '#8B5A2B' }}>
                <input type="checkbox" checked={showInactief} onChange={e => setShowInactief(e.target.checked)} />
                Toon inactief
              </label>
            </div>
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
                    {['Naam', 'E-mail', 'Telefoon', 'Wandeling', 'Account', 'Actief', 'Betaald', 'Lunch', 'Boekje', 'Datum', ''].map(h => (
                      <th key={h} className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wide whitespace-nowrap" style={{ color: '#8B5A2B' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id} style={{ background: !r.actief ? '#FEF9F0' : i % 2 === 0 ? '#FAF3E3' : 'white', color: r.actief ? '#2C1A0E' : '#A07850', opacity: r.actief ? 1 : 0.7 }}>
                      <td className="px-3 py-2 font-semibold whitespace-nowrap">{r.name}</td>
                      <td className="px-3 py-2">{r.email}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.phone || '-'}</td>
                      <td className="px-3 py-2 text-xs">{r.wandeling}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: r.profile_id ? '#D1FAE5' : '#F3F4F6', color: r.profile_id ? '#065F46' : '#6B7280' }}>
                          {r.profile_id ? 'Roamer' : 'Gast'}
                        </span>
                      </td>
                      {/* Actief toggle */}
                      <td className="px-3 py-2">
                        <button onClick={() => toggleActief(r.id, r.actief)}
                          className="text-xs px-2 py-1 rounded font-semibold"
                          style={{ background: r.actief ? '#D1FAE5' : '#FEE2E2', color: r.actief ? '#065F46' : '#991B1B' }}>
                          {r.actief ? 'Actief' : 'Inactief'}
                        </button>
                      </td>
                      {/* Betaald toggle */}
                      <td className="px-3 py-2">
                        <button onClick={() => toggleBetaald(r.id, r.betaald)}
                          className="text-xs px-2 py-1 rounded font-semibold"
                          style={{ background: r.betaald ? '#D1FAE5' : '#FEF3C7', color: r.betaald ? '#065F46' : '#92400E' }}>
                          {r.betaald ? '✓ Betaald' : 'Open'}
                        </button>
                      </td>
                      <td className="px-3 py-2">{r.wil_lunchen ? '✅' : '-'}</td>
                      <td className="px-3 py-2">{r.wilt_boekje ? '✅' : '-'}</td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: '#8B5A2B' }}>
                        {new Date(r.registered_at).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-3 py-2">
                        {isSuperAdmin && (
                          <button onClick={() => deleteReg(r.id, r.name)}
                            className="text-xs px-2 py-1 rounded font-semibold"
                            style={{ background: '#FEE2E2', color: '#991B1B' }}>
                            ✕
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
      )}

      {/* ── Wandelingen ── */}
      {tab === 'wandelingen' && (
        <div className="space-y-6">
          {uniqueWandelingen.length === 0 ? (
            <p className="text-center py-12" style={{ color: '#8B5A2B' }}>Geen aanmeldingen.</p>
          ) : uniqueWandelingen.map(slug => {
            const hike = hikes.find(h => h.slug === slug);
            const wandRegs = regs.filter(r => r.wandeling === slug && r.actief);
            const linked = wandRegs.filter(r => r.profile_id !== null);
            const guests = wandRegs.filter(r => r.profile_id === null);
            const betaald = wandRegs.filter(r => r.betaald).length;
            const wandKosten = kosten.filter(k => k.wandeling_slug === slug);
            const totalPerPersoon = wandKosten.reduce((s, k) => s + Number(k.bedrag), 0);
            const result = completeResults[slug];
            const isLoading = completing === slug;
            const form = kostForm[slug] ?? { omschrijving: '', bedrag: '' };

            return (
              <div key={slug} className="card p-5 space-y-5">
                {/* Header */}
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
                  <button onClick={() => completeHike(slug)} disabled={isLoading || !!result}
                    className="text-sm font-semibold px-4 py-2 rounded-lg flex-shrink-0"
                    style={{ background: result ? '#D1FAE5' : isLoading ? '#F5E4C0' : '#2C1A0E', color: result ? '#065F46' : isLoading ? '#8B5A2B' : 'white', cursor: result ? 'default' : 'pointer' }}>
                    {isLoading ? 'Bezig...' : result ? '✓ Afgerond' : 'Wandeling afsluiten'}
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  {[
                    { label: 'Deelnemers', value: wandRegs.length },
                    { label: 'Roamer-account', value: linked.length },
                    { label: 'Gasten', value: guests.length },
                    { label: 'Betaald', value: `${betaald} / ${wandRegs.length}` },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: '#FAF3E3' }}>
                      <p className="font-display font-black text-xl" style={{ color: '#C4622D' }}>{s.value}</p>
                      <p className="text-xs" style={{ color: '#8B5A2B' }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Kosten */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#8B5A2B' }}>Kosten per persoon</p>
                  {wandKosten.length === 0 ? (
                    <p className="text-sm" style={{ color: '#A07850' }}>Nog geen kostenposten.</p>
                  ) : (
                    <table className="w-full text-sm mb-2">
                      <tbody>
                        {wandKosten.map(k => (
                          <tr key={k.id}>
                            <td className="py-1" style={{ color: '#2C1A0E' }}>{k.omschrijving}</td>
                            <td className="py-1 text-right font-semibold" style={{ color: '#2C1A0E', fontVariantNumeric: 'tabular-nums' }}>{euro(Number(k.bedrag))}</td>
                            <td className="py-1 pl-3">
                              <button onClick={() => deleteKost(k.id)} className="text-xs px-2 py-0.5 rounded" style={{ background: '#FEE2E2', color: '#991B1B' }}>✕</button>
                            </td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '1px solid #EDD49A' }}>
                          <td className="pt-2 font-bold text-xs uppercase" style={{ color: '#8B5A2B' }}>Totaal p.p.</td>
                          <td className="pt-2 text-right font-black" style={{ color: '#C4622D', fontVariantNumeric: 'tabular-nums' }}>{euro(totalPerPersoon)}</td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {/* Kosten toevoegen */}
                  <div className="flex gap-2 mt-2">
                    <input
                      className="field text-sm py-1.5 flex-1"
                      placeholder="Omschrijving (bijv. Parkentree)"
                      value={form.omschrijving}
                      onChange={e => setKostForm(prev => ({ ...prev, [slug]: { ...form, omschrijving: e.target.value } }))}
                    />
                    <input
                      className="field text-sm py-1.5 w-24"
                      placeholder="€ 0,00"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.bedrag}
                      onChange={e => setKostForm(prev => ({ ...prev, [slug]: { ...form, bedrag: e.target.value } }))}
                    />
                    <button onClick={() => addKost(slug)}
                      className="text-sm font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: '#C4622D', color: 'white' }}>
                      + Toevoegen
                    </button>
                  </div>

                  {/* Betalingsstatus */}
                  {wandRegs.length > 0 && totalPerPersoon > 0 && (
                    <div className="mt-3 text-sm p-3 rounded-lg" style={{ background: '#F5E4C0' }}>
                      <span style={{ color: '#2C1A0E' }}>
                        <strong>{betaald}</strong> van <strong>{wandRegs.length}</strong> hebben betaald ·{' '}
                        ontvangen: <strong style={{ color: '#4A7C59' }}>{euro(betaald * totalPerPersoon)}</strong> ·{' '}
                        verwacht: <strong>{euro(wandRegs.length * totalPerPersoon)}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Lunch */}
                {(() => {
                  const lunchers = wandRegs.filter(r => r.wil_lunchen);
                  const isOpen = lunchOpen[slug] ?? false;
                  return (
                    <div>
                      <button
                        onClick={() => setLunchOpen(prev => ({ ...prev, [slug]: !isOpen }))}
                        className="flex items-center gap-2 text-sm font-bold w-full text-left"
                        style={{ color: '#2C1A0E' }}
                      >
                        <span style={{ color: '#8B5A2B', fontSize: '0.7rem' }}>{isOpen ? '▼' : '▶'}</span>
                        Lunch
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-1"
                          style={{ background: lunchers.length > 0 ? '#C4622D' : '#EDD49A', color: lunchers.length > 0 ? 'white' : '#8B5A2B' }}>
                          {lunchers.length} van {wandRegs.length}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="mt-3 rounded-xl overflow-hidden border" style={{ borderColor: '#EDD49A' }}>
                          {lunchers.length === 0 ? (
                            <p className="px-4 py-3 text-sm" style={{ color: '#8B5A2B' }}>Niemand aangemeld voor lunch.</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead><tr style={{ background: '#FAF3E3' }}>
                                {['Naam', 'Dieetwensen', 'Betaald'].map(h => (
                                  <th key={h} className="text-left px-4 py-2 font-bold text-xs uppercase tracking-wide" style={{ color: '#8B5A2B' }}>{h}</th>
                                ))}
                              </tr></thead>
                              <tbody>
                                {lunchers.map((r, i) => (
                                  <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#FAF3E3', color: '#2C1A0E' }}>
                                    <td className="px-4 py-2 font-semibold">{r.name}</td>
                                    <td className="px-4 py-2 text-sm">{r.dietary || '-'}</td>
                                    <td className="px-4 py-2">
                                      <button onClick={() => toggleBetaald(r.id, r.betaald)}
                                        className="text-xs px-2 py-1 rounded font-semibold"
                                        style={{ background: r.betaald ? '#D1FAE5' : '#FEF3C7', color: r.betaald ? '#065F46' : '#92400E' }}>
                                        {r.betaald ? '✓ Betaald' : 'Open'}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Afsluiten resultaat */}
                {result && (
                  <div className="text-sm px-3 py-2 rounded-lg"
                    style={{ background: 'error' in result ? '#FEE2E2' : '#D1FAE5', color: 'error' in result ? '#991B1B' : '#065F46' }}>
                    {'error' in result ? `Fout: ${result.error}` : result.message ?? `${result.created} looprecord(s) aangemaakt.`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Looprecords ── */}
      {tab === 'looprecords' && (
        <div className="space-y-8">
          {/* Formulier */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg mb-4" style={{ color: '#2C1A0E' }}>Looprecord toevoegen</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-sm block mb-1">Roamer <span style={{ color: '#C4622D' }}>*</span></label>
                <select className="field" value={walkForm.user_id}
                  onChange={e => setWalkForm(f => ({ ...f, user_id: e.target.value }))}>
                  <option value="">Kies een roamer...</option>
                  {roamers.map(r => (
                    <option key={r.id} value={r.id}>{r.name || r.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-sm block mb-1">Wandeling (kies of typ zelf)</label>
                <select className="field" value={walkForm.walk_slug}
                  onChange={e => { setWalkForm(f => ({ ...f, walk_slug: e.target.value })); fillFromHike(e.target.value); }}>
                  <option value="">Handmatig invullen...</option>
                  {hikes.map(h => (
                    <option key={h.slug} value={h.slug}>{h.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-sm block mb-1">Naam wandeling <span style={{ color: '#C4622D' }}>*</span></label>
                <input className="field" placeholder="bijv. Hoge Veluwe · Wandeldag"
                  value={walkForm.title}
                  onChange={e => setWalkForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="label-sm block mb-1">Datum <span style={{ color: '#C4622D' }}>*</span></label>
                <input className="field" type="date"
                  value={walkForm.date}
                  onChange={e => setWalkForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="label-sm block mb-1">Afstand (km)</label>
                <input className="field" type="number" step="0.1" min="0" placeholder="bijv. 11"
                  value={walkForm.distance_km}
                  onChange={e => setWalkForm(f => ({ ...f, distance_km: e.target.value }))} />
              </div>
              <div>
                <label className="label-sm block mb-1">Notitie (optioneel)</label>
                <input className="field" placeholder="bijv. Eerste editie"
                  value={walkForm.notes}
                  onChange={e => setWalkForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            {walkError && (
              <p className="text-sm mt-3 p-3 rounded-lg" style={{ background: '#FEE2E2', color: '#991B1B' }}>{walkError}</p>
            )}
            <button onClick={saveWalkRecord} disabled={walkSaving}
              className="btn-primary mt-4"
              style={{ opacity: walkSaving ? 0.7 : 1 }}>
              {walkSaving ? 'Opslaan...' : '+ Toevoegen'}
            </button>
          </div>

          {/* Bestaande records */}
          <div>
            <h2 className="font-display font-bold text-lg mb-4" style={{ color: '#2C1A0E' }}>
              Alle looprecords ({walkRecords.length})
            </h2>
            {walkRecords.length === 0 ? (
              <p className="text-sm" style={{ color: '#8B5A2B' }}>Nog geen looprecords.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#EDD49A' }}>
                <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <thead style={{ background: '#F5E4C0' }}>
                    <tr>
                      {['Roamer', 'Wandeling', 'Datum', 'Afstand', 'Notitie', ''].map(h => (
                        <th key={h} className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wide whitespace-nowrap" style={{ color: '#8B5A2B' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {walkRecords.map((r, i) => {
                      const roamer = roamers.find(ro => ro.id === r.user_id);
                      return (
                        <tr key={r.id} style={{ background: i % 2 === 0 ? '#FAF3E3' : 'white', color: '#2C1A0E' }}>
                          <td className="px-3 py-2 font-semibold whitespace-nowrap">{roamer?.name || r.user_id.slice(0, 8)}</td>
                          <td className="px-3 py-2">{r.title}</td>
                          <td className="px-3 py-2 whitespace-nowrap" style={{ color: '#8B5A2B' }}>
                            {r.date ? new Date(r.date).toLocaleDateString('nl-NL') : '-'}
                          </td>
                          <td className="px-3 py-2">{r.distance_km ? `${r.distance_km} km` : '-'}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: '#8B5A2B' }}>{r.notes || '-'}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => deleteWalkRecord(r.id)}
                              className="text-xs px-2 py-1 rounded font-semibold"
                              style={{ background: '#FEE2E2', color: '#991B1B' }}>✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
                  <td className="px-4 py-3"><RoleBadge role={r.role} /></td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8B5A2B' }}>
                    {new Date(r.created_at).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {r.role === 'roamer' && (
                        <button onClick={() => setRole(r.id, 'admin')}
                          className="text-xs px-3 py-1 rounded-lg font-semibold"
                          style={{ background: '#FFF8EC', color: '#7A4B00', border: '1px solid #F5D78A' }}>
                          Maak admin
                        </button>
                      )}
                      {r.role === 'admin' && (
                        <>
                          <button onClick={() => setRole(r.id, 'roamer')}
                            className="text-xs px-3 py-1 rounded-lg font-semibold"
                            style={{ background: '#FEE2E2', color: '#991B1B' }}>
                            Verwijder admin
                          </button>
                          {isSuperAdmin && (
                            <button onClick={() => setRole(r.id, 'super_admin')}
                              className="text-xs px-3 py-1 rounded-lg font-semibold"
                              style={{ background: '#EDE9FE', color: '#5B21B6' }}>
                              Maak super admin
                            </button>
                          )}
                        </>
                      )}
                      {r.role === 'super_admin' && isSuperAdmin && (
                        <button onClick={() => setRole(r.id, 'admin')}
                          className="text-xs px-3 py-1 rounded-lg font-semibold"
                          style={{ background: '#FEE2E2', color: '#991B1B' }}>
                          Verlaag naar admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Hikes ── */}
      {tab === 'hikes' && (
        <div className="space-y-8">
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg mb-4" style={{ color: '#2C1A0E' }}>
              {hikeEditing ? `Bewerken: ${hikeEditing}` : 'Nieuwe wandeling toevoegen'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-sm block mb-1">Slug <span style={{ color: '#C4622D' }}>*</span></label>
                <input className="field" placeholder="bijv. amsterdam-bos-mrt-2027"
                  value={hikeForm.slug} onChange={setHikeField('slug')}
                  readOnly={!!hikeEditing} style={hikeEditing ? { background: '#F5F5F5' } : undefined} />
              </div>
              <div>
                <label className="label-sm block mb-1">Naam <span style={{ color: '#C4622D' }}>*</span></label>
                <input className="field" placeholder="bijv. Amsterdam · Bos loop" value={hikeForm.title} onChange={setHikeField('title')} />
              </div>
              <div>
                <label className="label-sm block mb-1">Ondertitel</label>
                <input className="field" placeholder="Korte beschrijving" value={hikeForm.subtitle} onChange={setHikeField('subtitle')} />
              </div>
              <div>
                <label className="label-sm block mb-1">Datum <span style={{ color: '#C4622D' }}>*</span></label>
                <input className="field" type="date" value={hikeForm.date} onChange={setHikeField('date')} />
              </div>
              <div>
                <label className="label-sm block mb-1">Locatie</label>
                <input className="field" placeholder="Adres startpunt" value={hikeForm.location} onChange={setHikeField('location')} />
              </div>
              <div>
                <label className="label-sm block mb-1">Regio</label>
                <input className="field" placeholder="bijv. Noord-Brabant" value={hikeForm.region} onChange={setHikeField('region')} />
              </div>
              <div>
                <label className="label-sm block mb-1">Afstand (km)</label>
                <input className="field" type="number" step="0.01" min="0" value={hikeForm.distance_km || ''} onChange={setHikeField('distance_km')} />
              </div>
              <div>
                <label className="label-sm block mb-1">Duur (minuten)</label>
                <input className="field" type="number" min="0" value={hikeForm.duration_min || ''} onChange={setHikeField('duration_min')} />
              </div>
              <div>
                <label className="label-sm block mb-1">Verzameltijd</label>
                <input className="field" type="time" value={hikeForm.meeting_time} onChange={setHikeField('meeting_time')} />
              </div>
              <div>
                <label className="label-sm block mb-1">Starttijd</label>
                <input className="field" type="time" value={hikeForm.start_time} onChange={setHikeField('start_time')} />
              </div>
              <div>
                <label className="label-sm block mb-1">Moeilijkheidsgraad</label>
                <select className="field" value={hikeForm.difficulty} onChange={setHikeField('difficulty')}>
                  <option value="easy">Makkelijk</option>
                  <option value="moderate">Gemiddeld</option>
                  <option value="hard">Zwaar</option>
                </select>
              </div>
              <div>
                <label className="label-sm block mb-1">Terrein</label>
                <input className="field" placeholder="bijv. Bospaden, goed begaanbaar" value={hikeForm.terrain} onChange={setHikeField('terrain')} />
              </div>
              <div>
                <label className="label-sm block mb-1">Status</label>
                <select className="field" value={hikeForm.status} onChange={setHikeField('status')}>
                  <option value="upcoming">Aankomend</option>
                  <option value="completed">Voltooid</option>
                </select>
              </div>
              <div>
                <label className="label-sm block mb-1">Verzamelpunt</label>
                <input className="field" placeholder="Volledig adres verzamelpunt" value={hikeForm.meeting_point} onChange={setHikeField('meeting_point')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label-sm block mb-1">Beschrijving</label>
                <textarea className="field" rows={4} placeholder="Volledige beschrijving van de wandeling..." value={hikeForm.description} onChange={setHikeField('description')} />
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: '#2C1A0E' }}>
                  <input type="checkbox" checked={hikeForm.registration_open} onChange={setHikeCheck('registration_open')} className="w-4 h-4" style={{ accentColor: '#C4622D' }} />
                  <strong>Aanmelding open</strong>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: '#2C1A0E' }}>
                  <input type="checkbox" checked={hikeForm.wandelboekje} onChange={setHikeCheck('wandelboekje')} className="w-4 h-4" style={{ accentColor: '#C4622D' }} />
                  <strong>Wandelkilometerboekje</strong>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: '#2C1A0E' }}>
                  <input type="checkbox" checked={hikeForm.has_lunch} onChange={setHikeCheck('has_lunch')} className="w-4 h-4" style={{ accentColor: '#C4622D' }} />
                  <strong>Lunch / diner</strong>
                </label>
              </div>
              {hikeForm.has_lunch && (
                <>
                  <div>
                    <label className="label-sm block mb-1">Locatie lunch</label>
                    <input className="field" placeholder="bijv. De Boshut" value={hikeForm.lunch_venue} onChange={setHikeField('lunch_venue')} />
                  </div>
                  <div>
                    <label className="label-sm block mb-1">Link menukaart (optioneel)</label>
                    <input className="field" type="url" placeholder="https://..." value={hikeForm.lunch_url} onChange={setHikeField('lunch_url')} />
                  </div>
                </>
              )}
            </div>
            {hikeError && (
              <p className="text-sm mt-3 p-3 rounded-lg" style={{ background: '#FEE2E2', color: '#991B1B' }}>{hikeError}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={saveHike} disabled={hikeSaving} className="btn-primary" style={{ opacity: hikeSaving ? 0.7 : 1 }}>
                {hikeSaving ? 'Opslaan...' : hikeEditing ? 'Wijzigingen opslaan' : '+ Wandeling toevoegen'}
              </button>
              {hikeEditing && (
                <button onClick={() => { setHikeForm(EMPTY_HIKE); setHikeEditing(null); }}
                  className="text-sm font-semibold px-4 py-2 rounded-lg"
                  style={{ background: '#F5E4C0', color: '#5C3D1E' }}>
                  Annuleren
                </button>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display font-bold text-lg mb-4" style={{ color: '#2C1A0E' }}>Alle wandelingen ({allHikes.length})</h2>
            {allHikes.length === 0 ? (
              <p className="text-sm" style={{ color: '#8B5A2B' }}>Nog geen wandelingen in de database. Voer eerst de SQL seed uit in Supabase.</p>
            ) : (
              <div className="space-y-3">
                {allHikes.map(h => (
                  <div key={h.slug} className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm" style={{ color: '#2C1A0E' }}>{h.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${h.status === 'upcoming' ? 'badge-upcoming' : 'badge-past'}`}>
                          {h.status === 'upcoming' ? 'Aankomend' : 'Voltooid'}
                        </span>
                        {h.registration_open && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#D1FAE5', color: '#065F46' }}>Aanmelding open</span>}
                        {h.has_lunch && <span className="text-xs" style={{ color: '#8B5A2B' }}>🍽 {h.lunch_venue || 'Lunch'}</span>}
                        {h.wandelboekje && <span className="text-xs" style={{ color: '#8B5A2B' }}>📓 Boekje</span>}
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#8B5A2B' }}>
                        {new Date(h.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {h.distance_km ? ` · ${h.distance_km} km` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => editHike(h)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: '#F5E4C0', color: '#5C3D1E' }}>Bewerken</button>
                      <button onClick={() => deleteHike(h.slug)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: '#FEE2E2', color: '#991B1B' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

}
