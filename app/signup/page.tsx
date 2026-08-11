'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setStatus('error');
      setErrorMsg('Wachtwoorden komen niet overeen.');
      return;
    }
    if (form.password.length < 8) {
      setStatus('error');
      setErrorMsg('Wachtwoord moet minimaal 8 tekens zijn.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } },
    });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message === 'User already registered'
        ? 'Dit e-mailadres is al geregistreerd.'
        : 'Er is iets misgegaan. Probeer het opnieuw.');
      return;
    }
    setStatus('success');
  };

  if (status === 'success') {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="font-display text-2xl font-black mb-3" style={{ color: '#2C1A0E' }}>Bevestig je e-mail</h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: '#5C3D1E' }}>
          We hebben een bevestigingslink gestuurd naar <strong>{form.email}</strong>. Klik op de link om je account te activeren.
        </p>
        <Link href="/" className="btn-primary">Terug naar home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <div className="text-center mb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C4622D' }}>Account aanmaken</p>
        <h1 className="font-display text-3xl font-black" style={{ color: '#2C1A0E' }}>Word een Roamer</h1>
        <p className="text-sm mt-2" style={{ color: '#8B5A2B' }}>Houd je wandelingen bij en volg je prestaties.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label-sm block mb-1">Naam <span style={{ color: '#C4622D' }}>*</span></label>
          <input className="field" type="text" placeholder="Je voornaam" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className="label-sm block mb-1">E-mailadres <span style={{ color: '#C4622D' }}>*</span></label>
          <input className="field" type="email" placeholder="jij@voorbeeld.nl" value={form.email} onChange={set('email')} required />
        </div>
        <div>
          <label className="label-sm block mb-1">Wachtwoord <span style={{ color: '#C4622D' }}>*</span></label>
          <input className="field" type="password" placeholder="Minimaal 8 tekens" value={form.password} onChange={set('password')} required />
        </div>
        <div>
          <label className="label-sm block mb-1">Wachtwoord herhalen <span style={{ color: '#C4622D' }}>*</span></label>
          <input className="field" type="password" placeholder="Herhaal wachtwoord" value={form.confirm} onChange={set('confirm')} required />
        </div>

        {status === 'error' && (
          <p className="text-sm p-3 rounded-lg" style={{ background: '#FEF2F2', color: '#991B1B' }}>{errorMsg}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={status === 'loading'}>
          {status === 'loading' ? 'Account aanmaken...' : 'Account aanmaken'}
        </button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: '#8B5A2B' }}>
        Al een account?{' '}
        <Link href="/login" className="font-semibold" style={{ color: '#C4622D' }}>Inloggen</Link>
      </p>
    </div>
  );
}
