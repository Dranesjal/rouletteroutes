'use client';
import { useState, useEffect, useCallback } from 'react';

interface Registration {
  id: string;
  wandeling: string;
  name: string;
  email: string;
  phone: string;
  dietary: string;
  message: string;
  registeredAt: string;
}

interface Hike {
  slug: string;
  title: string;
  date: string;
  status: string;
  distanceKm: number;
}

type Tab = 'registrations' | 'hikes';

const DEFAULT_HIKE = {
  slug: '', title: '', subtitle: '', date: '',
  location: '', region: '', distanceKm: 5, durationMin: 90,
  description: '', status: 'upcoming', meetingPoint: '', meetingTime: '10:45',
  startTime: '11:00', registrationOpen: true, maxParticipants: 20,
  hasLunch: false, lunchVenue: '', lunchUrl: '',
  difficulty: 'easy', terrain: '',
};

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('registrations');

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [hikes, setHikes] = useState<{ static: Hike[]; dynamic: Hike[] }>({ static: [], dynamic: [] });
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [hikeForm, setHikeForm] = useState<typeof DEFAULT_HIKE>(DEFAULT_HIKE);
  const [saving, setSaving] = useState(false);

  const authHeader = `Basic ${btoa(`:${password}`)}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, hRes] = await Promise.all([
        fetch('/api/admin/registrations', { headers: { Authorization: authHeader } }),
        fetch('/api/admin/hikes', { headers: { Authorization: authHeader } }),
      ]);
      if (rRes.status === 401) { setAuthed(false); return; }
      const rData = await rRes.json();
      const hData = await hRes.json();
      setRegistrations(rData.registrations ?? []);
      setHikes({ static: hData.static ?? [], dynamic: hData.dynamic ?? [] });
      setAuthed(true);
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await load();
  };

  const deleteHike = async (slug: string) => {
    if (!confirm(`Wandeling "${slug}" verwijderen?`)) return;
    await fetch('/api/admin/hikes', {
      method: 'DELETE',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    await load();
  };

  const saveHike = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body = { ...hikeForm, distanceKm: Number(hikeForm.distanceKm), durationMin: Number(hikeForm.durationMin) };
    await fetch('/api/admin/hikes', {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setShowForm(false);
    setHikeForm(DEFAULT_HIKE);
    await load();
  };

  const setH = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setHikeForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const filteredRegs = registrations.filter((r) =>
    !filter || r.wandeling === filter
  );

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20">
        <h1 className="font-display text-3xl font-black mb-6 text-center" style={{ color: '#2C1A0E' }}>Admin</h1>
        <form onSubmit={handleLogin} className="card p-6 space-y-4">
          <div>
            <label className="label-sm block mb-1">Wachtwoord</label>
            <input type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Inloggen...' : 'Inloggen'}
          </button>
        </form>
      </div>
    );
  }

  const allHikes = [...hikes.static, ...hikes.dynamic];
  const uniqueWandelingen = [...new Set(registrations.map((r) => r.wandeling))];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-black" style={{ color: '#2C1A0E' }}>Admin</h1>
        <button onClick={() => setAuthed(false)} className="text-sm" style={{ color: '#8B5A2B' }}>Uitloggen</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b" style={{ borderColor: '#EDD49A' }}>
        {([['registrations', 'Aanmeldingen'], ['hikes', 'Wandelingen']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className="pb-3 px-1 text-sm font-bold border-b-2 transition-all"
            style={{ borderColor: tab === t ? '#C4622D' : 'transparent', color: tab === t ? '#C4622D' : '#8B5A2B' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Registrations tab */}
      {tab === 'registrations' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color: '#5C3D1E' }}>{filteredRegs.length} aanmelding(en)</p>
            {uniqueWandelingen.length > 1 && (
              <select className="field text-sm py-1" style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">Alle wandelingen</option>
                {uniqueWandelingen.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            )}
          </div>

          {filteredRegs.length === 0 ? (
            <p className="text-center py-12" style={{ color: '#8B5A2B' }}>Geen aanmeldingen gevonden.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#EDD49A' }}>
              <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <thead style={{ background: '#F5E4C0' }}>
                  <tr>
                    {['Naam', 'E-mail', 'Telefoon', 'Wandeling', 'Dieet', 'Opmerking', 'Datum'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wide" style={{ color: '#8B5A2B' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRegs.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#FAF3E3' : 'white', color: '#2C1A0E' }}>
                      <td className="px-4 py-3 font-semibold">{r.name}</td>
                      <td className="px-4 py-3">{r.email}</td>
                      <td className="px-4 py-3">{r.phone || '-'}</td>
                      <td className="px-4 py-3">{r.wandeling}</td>
                      <td className="px-4 py-3">{r.dietary || '-'}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{r.message || '-'}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#8B5A2B' }}>
                        {new Date(r.registeredAt).toLocaleDateString('nl-NL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Hikes tab */}
      {tab === 'hikes' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-semibold" style={{ color: '#5C3D1E' }}>{allHikes.length} wandeling(en)</p>
            <button className="btn-primary" onClick={() => { setShowForm(true); setHikeForm(DEFAULT_HIKE); }}>+ Wandeling toevoegen</button>
          </div>

          {/* Hike list */}
          <div className="space-y-3 mb-8">
            {allHikes.map((h) => {
              const isDynamic = hikes.dynamic.some((d) => d.slug === h.slug);
              return (
                <div key={h.slug} className="card p-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-sm" style={{ color: '#2C1A0E' }}>{h.title}</span>
                    <span className="ml-2 text-xs" style={{ color: '#8B5A2B' }}>{h.date} · {h.distanceKm} km</span>
                    {!isDynamic && <span className="ml-2 text-xs italic" style={{ color: '#8B5A2B' }}>static</span>}
                  </div>
                  {isDynamic && (
                    <button onClick={() => deleteHike(h.slug)} className="text-xs px-3 py-1 rounded-lg" style={{ background: '#FEF2F2', color: '#991B1B' }}>
                      Verwijderen
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add hike form */}
          {showForm && (
            <div className="card p-6">
              <h2 className="font-display font-bold text-lg mb-5" style={{ color: '#2C1A0E' }}>Nieuwe wandeling</h2>
              <form onSubmit={saveHike} className="grid sm:grid-cols-2 gap-4">
                {[
                  { k: 'slug', label: 'Slug (URL)', placeholder: 'bijv-schaijk-aug-2026', required: true },
                  { k: 'title', label: 'Titel', placeholder: 'Schaijk · De Boshut loop', required: true },
                  { k: 'subtitle', label: 'Subtitel', placeholder: 'Door het bos rondom Schaijk' },
                  { k: 'date', label: 'Datum', type: 'date', required: true },
                  { k: 'location', label: 'Locatie (adres)', placeholder: 'Boshut, Udensedreef 14, Schaijk' },
                  { k: 'region', label: 'Regio', placeholder: 'Noord-Brabant', required: true },
                  { k: 'distanceKm', label: 'Afstand (km)', type: 'number' },
                  { k: 'durationMin', label: 'Duur (min)', type: 'number' },
                  { k: 'meetingPoint', label: 'Vertrekpunt', placeholder: 'Volledig adres' },
                  { k: 'meetingTime', label: 'Verzameltijd', placeholder: '10:45' },
                  { k: 'startTime', label: 'Starttijd', placeholder: '11:00' },
                  { k: 'terrain', label: 'Ondergrond', placeholder: 'Bospaden, goed begaanbaar' },
                  { k: 'lunchVenue', label: 'Lunch locatie', placeholder: 'De Boshut' },
                  { k: 'lunchUrl', label: 'Lunch URL', placeholder: 'https://...' },
                ].map(({ k, label, placeholder, type, required }) => (
                  <div key={k}>
                    <label className="label-sm block mb-1">{label}{required && <span style={{ color: '#C4622D' }}> *</span>}</label>
                    <input className="field" type={type ?? 'text'} placeholder={placeholder} value={(hikeForm as Record<string, unknown>)[k] as string}
                      onChange={setH(k)} required={required} step={type === 'number' ? '0.01' : undefined} />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label className="label-sm block mb-1">Beschrijving</label>
                  <textarea className="field" rows={4} value={hikeForm.description} onChange={setH('description')} />
                </div>

                <div>
                  <label className="label-sm block mb-1">Status</label>
                  <select className="field" value={hikeForm.status} onChange={setH('status')}>
                    <option value="upcoming">Aankomend</option>
                    <option value="completed">Gedaan</option>
                  </select>
                </div>
                <div>
                  <label className="label-sm block mb-1">Moeilijkheid</label>
                  <select className="field" value={hikeForm.difficulty} onChange={setH('difficulty')}>
                    <option value="easy">Makkelijk</option>
                    <option value="moderate">Gemiddeld</option>
                    <option value="hard">Zwaar</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#2C1A0E' }}>
                    <input type="checkbox" checked={hikeForm.registrationOpen} onChange={setH('registrationOpen')} className="w-4 h-4" />
                    Inschrijving open
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#2C1A0E' }}>
                    <input type="checkbox" checked={hikeForm.hasLunch} onChange={setH('hasLunch')} className="w-4 h-4" />
                    Lunch inbegrepen
                  </label>
                </div>

                <div className="sm:col-span-2 flex gap-3 pt-2">
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Opslaan...' : 'Wandeling opslaan'}</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuleren</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
