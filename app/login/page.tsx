'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus('error');
      setErrorMsg('Onjuist e-mailadres of wachtwoord.');
      return;
    }
    // Check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/roamer');
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <div className="text-center mb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C4622D' }}>Inloggen</p>
        <h1 className="font-display text-3xl font-black" style={{ color: '#2C1A0E' }}>Welkom terug, Roamer</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label-sm block mb-1">E-mailadres</label>
          <input className="field" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        </div>
        <div>
          <label className="label-sm block mb-1">Wachtwoord</label>
          <input className="field" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>

        {status === 'error' && (
          <p className="text-sm p-3 rounded-lg" style={{ background: '#FEF2F2', color: '#991B1B' }}>{errorMsg}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={status === 'loading'}>
          {status === 'loading' ? 'Inloggen...' : 'Inloggen'}
        </button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: '#8B5A2B' }}>
        Nog geen account?{' '}
        <Link href="/signup" className="font-semibold" style={{ color: '#C4622D' }}>Aanmaken</Link>
      </p>
    </div>
  );
}
