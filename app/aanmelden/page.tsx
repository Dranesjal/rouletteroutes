'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Hike {
  slug: string;
  title: string;
  date: string;
  status: string;
  registrationOpen: boolean;
  registrationRequired?: boolean;
}

function AanmeldenForm() {
  const searchParams = useSearchParams();
  const preselect = searchParams.get('wandeling') ?? '';

  const [hikes, setHikes] = useState<Hike[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', wandeling: preselect, dietary: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/hikes').then((r) => r.json()).then((data) => {
      const open = (data.hikes as Hike[]).filter((h) => h.status === 'upcoming' && h.registrationOpen);
      setHikes(open);
      if (!preselect && open.length === 1) setForm((f) => ({ ...f, wandeling: open[0].slug }));
    }).catch(() => {});
  }, [preselect]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { setStatus('success'); }
      else { setStatus('error'); setErrorMsg(data.error ?? 'Er is iets misgegaan.'); }
    } catch {
      setStatus('error');
      setErrorMsg('Kan geen verbinding maken. Probeer het opnieuw.');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">🥾</div>
        <h1 className="font-display text-3xl font-black mb-4" style={{ color: '#2C1A0E' }}>Aanmelding ontvangen!</h1>
        <p className="text-base mb-6" style={{ color: '#5C3D1E' }}>
          Bedankt voor je aanmelding. Je ontvangt een bevestiging per e-mail met verdere details over de wandeling.
        </p>
        <a href="/" className="btn-primary">Terug naar home</a>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C4622D' }}>Inschrijven</p>
        <h1 className="font-display text-4xl font-black mb-3" style={{ color: '#2C1A0E' }}>Aanmelden</h1>
        <p style={{ color: '#5C3D1E' }}>Vul je gegevens in en we nemen contact op voor bevestiging.</p>
        {hikes.find((h) => h.slug === form.wandeling)?.registrationRequired === false && (
          <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: '#EEF6F0', color: '#2E5B3A', border: '1px solid #b6d9c0' }}>
            Aanmelden voor deze wandeling is <strong>niet verplicht</strong> — je bent ook welkom zonder aanmelding.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Wandeling */}
        {hikes.length > 0 && (
          <div>
            <label className="label-sm block mb-1">Wandeling</label>
            <select className="field" value={form.wandeling} onChange={set('wandeling')} required>
              <option value="">Selecteer een wandeling</option>
              {hikes.map((h) => (
                <option key={h.slug} value={h.slug}>{h.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="label-sm block mb-1">Naam <span style={{ color: '#C4622D' }}>*</span></label>
          <input className="field" type="text" placeholder="Je volledige naam" value={form.name} onChange={set('name')} required />
        </div>

        {/* Email */}
        <div>
          <label className="label-sm block mb-1">E-mailadres <span style={{ color: '#C4622D' }}>*</span></label>
          <input className="field" type="email" placeholder="jij@voorbeeld.nl" value={form.email} onChange={set('email')} required />
        </div>

        {/* Phone */}
        <div>
          <label className="label-sm block mb-1">Telefoonnummer</label>
          <input className="field" type="tel" placeholder="+31 6 ..." value={form.phone} onChange={set('phone')} />
        </div>

        {/* Dietary */}
        <div>
          <label className="label-sm block mb-1">Dieetwensen / allergieën</label>
          <input className="field" type="text" placeholder="Bijv. vegetarisch, glutenvrij..." value={form.dietary} onChange={set('dietary')} />
        </div>

        {/* Message */}
        <div>
          <label className="label-sm block mb-1">Opmerkingen</label>
          <textarea className="field" rows={3} placeholder="Iets wat we moeten weten?" value={form.message} onChange={set('message')} />
        </div>

        {status === 'error' && (
          <p className="text-sm p-3 rounded-lg" style={{ background: '#FEF2F2', color: '#991B1B' }}>{errorMsg}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={status === 'loading'}>
          {status === 'loading' ? 'Aanmelden...' : 'Aanmelden'}
        </button>
      </form>
    </div>
  );
}

export default function AanmeldenPage() {
  return (
    <Suspense>
      <AanmeldenForm />
    </Suspense>
  );
}
