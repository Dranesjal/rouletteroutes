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
  hasLunch: boolean;
  wandelboekje?: boolean;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = [
  'Januari','Februari','Maart','April','Mei','Juni',
  'Juli','Augustus','September','Oktober','November','December',
];
const YEARS = Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 18 - i);

const VELUWE_SLUG = 'hoge-veluwe-okt-2026';

function AanmeldenForm() {
  const searchParams = useSearchParams();
  const preselect = searchParams.get('wandeling') ?? '';

  const [hikes, setHikes] = useState<Hike[]>([]);
  const [form, setForm] = useState({
    wandeling: preselect,
    name: '',
    adres: '',
    postcode: '',
    woonplaats: '',
    land: 'Nederland',
    geboorteDag: '',
    geboorteMaand: '',
    geboorteJaar: '',
    geslacht: '',
    phone: '',
    email: '',
    emailConfirm: '',
    dietary: '',
    message: '',
    wiltBoekje: false,
  });
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
  const setCheck = (k: 'wiltBoekje') => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.checked }));

  const selectedHike = hikes.find((h) => h.slug === form.wandeling);
  const isVeluwe = form.wandeling === VELUWE_SLUG;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.email !== form.emailConfirm) {
      setStatus('error');
      setErrorMsg('E-mailadressen komen niet overeen.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const geboortedatum = form.geboorteDag && form.geboorteMaand && form.geboorteJaar
        ? `${form.geboorteDag} ${MONTHS[parseInt(form.geboorteMaand) - 1]} ${form.geboorteJaar}`
        : '';
      const payload = {
        wandeling: form.wandeling,
        name: form.name,
        adres: form.adres,
        postcode: form.postcode,
        woonplaats: form.woonplaats,
        land: form.land,
        geboortedatum,
        geslacht: form.geslacht,
        phone: form.phone,
        email: form.email,
        dietary: form.dietary,
        message: form.message,
        wiltBoekje: form.wiltBoekje,
      };
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        <p className="text-base mb-3" style={{ color: '#5C3D1E' }}>
          Bedankt voor je aanmelding. Je ontvangt een bevestiging per e-mail met verdere details.
        </p>
        {isVeluwe && (
          <p className="text-sm mb-6 p-3 rounded-lg" style={{ background: '#FFF8EC', color: '#7A4B00', border: '1px solid #F5D78A' }}>
            Voor de Veluwedag ontvang je een Tikkie voor de entree (dagkaart € 13,85 p.p.). Lunch wordt apart geregeld indien van toepassing.
          </p>
        )}
        <a href="/" className="btn-primary">Terug naar home</a>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C4622D' }}>Inschrijven</p>
        <h1 className="font-display text-4xl font-black mb-3" style={{ color: '#2C1A0E' }}>Aanmelden, Roamer!</h1>
        <p style={{ color: '#5C3D1E' }}>Vul je gegevens in zodat we alles voor je kunnen regelen.</p>

      </div>

      {/* Veluwe info block */}
      {isVeluwe && (
        <div className="mb-8 rounded-xl overflow-hidden border" style={{ borderColor: '#EDD49A' }}>
          <div className="px-5 py-3 font-bold text-sm" style={{ background: '#4A7C59', color: 'white' }}>
            📋 Informatie Veluwedag · 3 oktober 2026
          </div>
          <div className="p-5 space-y-3 text-sm" style={{ background: '#FDFAF4', color: '#3E2610' }}>
            <p>
              <strong>Deze gegevens zijn nodig voor aanmelding bij het Nationaal Park De Hoge Veluwe.</strong>
            </p>
            <div className="flex items-start gap-2">
              <span>🎟️</span>
              <p>Entree van het park is voor eigen rekening. <strong>Dagkaart Park Volwassene: € 13,85 p.p.</strong> Je ontvangt hiervoor een Tikkie na aanmelding.</p>
            </div>
            <div className="flex items-start gap-2">
              <span>✅</span>
              <p>Wij regelen alles van inschrijving tot en met de eventuele lunch. Jij hoeft alleen te verschijnen.</p>
            </div>
            <div className="flex items-start gap-2">
              <span>📱</span>
              <p>Na aanmelding ontvang je een <strong>Tikkie</strong> voor de entreekosten. Lunchwensen worden apart doorgenomen.</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Wandeling */}
        {hikes.length > 1 && (
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

        {/* Section: Persoonlijke gegevens */}
        <div className="pt-2">
          <h2 className="font-display font-bold text-base mb-4 pb-2 border-b" style={{ color: '#2C1A0E', borderColor: '#EDD49A' }}>
            Persoonlijke gegevens
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label-sm block mb-1">Voor- en achternaam <span style={{ color: '#C4622D' }}>*</span></label>
              <input className="field" type="text" placeholder="Je volledige naam" value={form.name} onChange={set('name')} required />
            </div>

            <div>
              <label className="label-sm block mb-1">Adres <span style={{ color: '#C4622D' }}>*</span></label>
              <input className="field" type="text" placeholder="Straat en huisnummer" value={form.adres} onChange={set('adres')} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-sm block mb-1">Postcode <span style={{ color: '#C4622D' }}>*</span></label>
                <input className="field" type="text" placeholder="1234 AB" value={form.postcode} onChange={set('postcode')} required />
              </div>
              <div>
                <label className="label-sm block mb-1">Woonplaats <span style={{ color: '#C4622D' }}>*</span></label>
                <input className="field" type="text" placeholder="Woonplaats" value={form.woonplaats} onChange={set('woonplaats')} required />
              </div>
            </div>

            <div>
              <label className="label-sm block mb-1">Land <span style={{ color: '#C4622D' }}>*</span></label>
              <select className="field" value={form.land} onChange={set('land')} required>
                <option>Nederland</option>
                <option>België</option>
                <option>Duitsland</option>
                <option>Anders</option>
              </select>
            </div>

            <div>
              <label className="label-sm block mb-1">Geboortedatum <span style={{ color: '#C4622D' }}>*</span></label>
              <div className="grid grid-cols-3 gap-2">
                <select className="field" value={form.geboorteDag} onChange={set('geboorteDag')} required>
                  <option value="">Dag</option>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="field" value={form.geboorteMaand} onChange={set('geboorteMaand')} required>
                  <option value="">Maand</option>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select className="field" value={form.geboorteJaar} onChange={set('geboorteJaar')} required>
                  <option value="">Jaar</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label-sm block mb-2">Geslacht <span style={{ color: '#C4622D' }}>*</span></label>
              <div className="flex gap-6">
                {['Man', 'Vrouw'].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: '#2C1A0E' }}>
                    <input type="radio" name="geslacht" value={g} checked={form.geslacht === g}
                      onChange={set('geslacht')} required className="w-4 h-4 accent-[#C4622D]" />
                    {g}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Contactgegevens */}
        <div className="pt-2">
          <h2 className="font-display font-bold text-base mb-4 pb-2 border-b" style={{ color: '#2C1A0E', borderColor: '#EDD49A' }}>
            Contactgegevens
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label-sm block mb-1">Telefoonnummer</label>
              <input className="field" type="tel" placeholder="+31 6 ..." value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="label-sm block mb-1">E-mailadres <span style={{ color: '#C4622D' }}>*</span></label>
              <input className="field" type="email" placeholder="jij@voorbeeld.nl" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label-sm block mb-1">E-mailadres (controle) <span style={{ color: '#C4622D' }}>*</span></label>
              <input className="field" type="email" placeholder="Herhaal je e-mailadres" value={form.emailConfirm} onChange={set('emailConfirm')} required />
            </div>
          </div>
        </div>

        {/* Section: Extra */}
        <div className="pt-2">
          <h2 className="font-display font-bold text-base mb-4 pb-2 border-b" style={{ color: '#2C1A0E', borderColor: '#EDD49A' }}>
            Overig
          </h2>
          <div className="space-y-4">
            {selectedHike?.wandelboekje && (
              <div className="p-4 rounded-xl border" style={{ background: '#F2F8F4', borderColor: '#b6d9c0' }}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.wiltBoekje} onChange={setCheck('wiltBoekje')}
                    className="mt-0.5 w-4 h-4 flex-shrink-0" style={{ accentColor: '#4A7C59' }} />
                  <span className="text-sm leading-relaxed" style={{ color: '#2C3E2E' }}>
                    <strong>Ik wil een Wandelkilometerboekje ontvangen bij de start</strong>
                    <span className="block mt-1 text-xs" style={{ color: '#4A7C59' }}>
                      Met het boekje houd je al je wandelprestaties bij. Na 250 km kun je een wandelprestatiekruis bestellen. Wij zorgen dat je het boekje bij de start ontvangt.
                    </span>
                  </span>
                </label>
              </div>
            )}
            <div>
              <label className="label-sm block mb-1">Dieetwensen / allergieën</label>
              <input className="field" type="text" placeholder="Bijv. vegetarisch, glutenvrij..." value={form.dietary} onChange={set('dietary')} />
            </div>
            <div>
              <label className="label-sm block mb-1">Opmerkingen</label>
              <textarea className="field" rows={3} placeholder="Iets wat we moeten weten?" value={form.message} onChange={set('message')} />
            </div>
          </div>
        </div>

        {status === 'error' && (
          <p className="text-sm p-3 rounded-lg" style={{ background: '#FEF2F2', color: '#991B1B' }}>{errorMsg}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={status === 'loading'}>
          {status === 'loading' ? 'Aanmelden...' : 'Aanmelden'}
        </button>

        <p className="text-xs text-center" style={{ color: '#8B5A2B' }}>
          Velden met <span style={{ color: '#C4622D' }}>*</span> zijn verplicht
        </p>
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
