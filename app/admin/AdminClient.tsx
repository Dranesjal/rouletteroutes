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

interface Props {
  adminName: string;
  adminRole: 'admin' | 'super_admin';
  registrations: Registration[];
  roamers: Roamer[];
  hikes: HikeSummary[];
  kosten: Kost[];
}

type Tab = 'registrations' | 'lunch' | 'wandelingen' | 'roamers';

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

export default function AdminClient({ adminName, adminRole, registrations, roamers, hikes, kosten: initialKosten }: Props) {
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
          ['lunch', `Lunch (${regs.filter(r => r.wil_lunchen && r.actief).length})`],
          ['wandelingen', `Wandelingen (${uniqueWandelingen.length})`],
          ['roamers', `Roamers (${roamers.length})`],
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

      {/* ── Lunch ── */}
      {tab === 'lunch' && (
        <div className="space-y-8">
          {uniqueWandelingen.length === 0 ? (
            <p className="text-center py-12" style={{ color: '#8B5A2B' }}>Geen aanmeldingen.</p>
          ) : uniqueWandelingen.map(wandeling => {
            const all = regs.filter(r => r.wandeling === wandeling && r.actief);
            const lunchers = all.filter(r => r.wil_lunchen);
            return (
              <div key={wandeling} className="rounded-xl border overflow-hidden" style={{ borderColor: '#EDD49A' }}>
                <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#F5E4C0' }}>
                  <span className="font-bold text-sm" style={{ color: '#2C1A0E' }}>{wandeling}</span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: '#C4622D', color: 'white' }}>
                    {lunchers.length} / {all.length} lunch
                  </span>
                </div>
                {lunchers.length === 0 ? (
                  <p className="px-5 py-4 text-sm" style={{ color: '#8B5A2B' }}>Niemand aangemeld voor lunch.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr style={{ background: '#FAF3E3' }}>
                      {['Naam', 'E-mail', 'Telefoon', 'Dieetwensen', 'Betaald'].map(h => (
                        <th key={h} className="text-left px-4 py-2 font-bold text-xs uppercase tracking-wide" style={{ color: '#8B5A2B' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {lunchers.map((r, i) => (
                        <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#FAF3E3', color: '#2C1A0E' }}>
                          <td className="px-4 py-3 font-semibold">{r.name}</td>
                          <td className="px-4 py-3">{r.email}</td>
                          <td className="px-4 py-3">{r.phone || '-'}</td>
                          <td className="px-4 py-3">{r.dietary || '-'}</td>
                          <td className="px-4 py-3">
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
            );
          })}
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
    </div>
  );

}
