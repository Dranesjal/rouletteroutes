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
  registered_at: string;
}

interface Roamer {
  id: string;
  name: string;
  role: string;
  created_at: string;
}

interface Props {
  adminName: string;
  registrations: Registration[];
  roamers: Roamer[];
}

type Tab = 'registrations' | 'roamers';

export default function AdminClient({ adminName, registrations, roamers }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('registrations');
  const [filter, setFilter] = useState('');

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
        {([['registrations', `Aanmeldingen (${registrations.length})`], ['roamers', `Roamers (${roamers.length})`]] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className="pb-3 px-1 text-sm font-bold border-b-2 transition-all"
            style={{ borderColor: tab === t ? '#C4622D' : 'transparent', color: tab === t ? '#C4622D' : '#8B5A2B' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Registrations */}
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
                    {['Naam', 'Woonplaats', 'Geboortedatum', 'Geslacht', 'E-mail', 'Telefoon', 'Wandeling', 'Boekje', 'Dieet', 'Opmerking', 'Datum'].map(h => (
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

      {/* Roamers */}
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
