'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type AuthState = 'loading' | 'guest' | 'roamer' | 'admin';

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>('loading');

  useEffect(() => {
    const supabase = createClient();

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuth('guest'); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const role = profile?.role as string | undefined;
      setAuth(role === 'admin' || role === 'super_admin' ? 'admin' : 'roamer');
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => checkAuth());
    return () => subscription.unsubscribe();
  }, []);

  const links = [
    { href: '/', label: 'Home', exact: true },
    { href: '/wandelingen', label: 'Wandelingen' },
    { href: '/over', label: 'Over ons' },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const authSection = () => {
    if (auth === 'loading') return null;
    if (auth === 'guest') return (
      <>
        <Link href="/signup"
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: '#C4622D', color: 'white' }}>
          Word Roamer
        </Link>
        <Link href="/login"
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ color: isActive('/login') ? '#C4622D' : '#D5B08A', background: isActive('/login') ? 'rgba(196,98,45,0.15)' : 'transparent' }}>
          Inloggen
        </Link>
      </>
    );
    if (auth === 'admin') return (
      <Link href="/admin"
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
        style={{ background: '#C4622D', color: 'white' }}>
        Admin
      </Link>
    );
    return (
      <Link href="/roamer"
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
        style={{ background: isActive('/roamer') ? '#C4622D' : 'rgba(196,98,45,0.15)', color: isActive('/roamer') ? 'white' : '#C4622D' }}>
        Mijn profiel
      </Link>
    );
  };

  const mobileAuthSection = () => {
    if (auth === 'loading') return null;
    if (auth === 'guest') return (
      <>
        <Link href="/signup" onClick={() => setOpen(false)}
          className="block py-3 text-sm font-semibold border-b"
          style={{ color: '#C4622D', borderColor: '#3E2610' }}>
          Word Roamer
        </Link>
        <Link href="/login" onClick={() => setOpen(false)}
          className="block py-3 text-sm font-semibold border-b"
          style={{ color: isActive('/login') ? '#C4622D' : '#D5B08A', borderColor: '#3E2610' }}>
          Inloggen
        </Link>
      </>
    );
    if (auth === 'admin') return (
      <Link href="/admin" onClick={() => setOpen(false)}
        className="block py-3 text-sm font-semibold border-b"
        style={{ color: '#C4622D', borderColor: '#3E2610' }}>
        Admin
      </Link>
    );
    return (
      <Link href="/roamer" onClick={() => setOpen(false)}
        className="block py-3 text-sm font-semibold border-b"
        style={{ color: '#C4622D', borderColor: '#3E2610' }}>
        Mijn profiel
      </Link>
    );
  };

  return (
    <header style={{ background: '#2C1A0E' }}>
      <nav className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Roulette Routes Roamers" className="h-10 w-10 object-contain rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span className="font-display font-bold text-sm leading-tight hidden sm:block" style={{ color: '#F5E4C0' }}>
            Roulette Routes<br />
            <span style={{ color: '#C4622D' }}>Roamers</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                color: isActive(l.href, l.exact) ? '#C4622D' : '#D5B08A',
                background: isActive(l.href, l.exact) ? 'rgba(196,98,45,0.15)' : 'transparent',
              }}>
              {l.label}
            </Link>
          ))}
          <div className="w-px h-5 mx-2" style={{ background: '#3E2610' }} />
          {authSection()}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 rounded-lg" style={{ color: '#D5B08A' }} onClick={() => setOpen(!open)}>
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t px-4 pb-4" style={{ borderColor: '#3E2610' }}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block py-3 text-sm font-semibold border-b"
              style={{ color: isActive(l.href, l.exact) ? '#C4622D' : '#D5B08A', borderColor: '#3E2610' }}>
              {l.label}
            </Link>
          ))}
          {mobileAuthSection()}
        </div>
      )}
    </header>
  );
}
