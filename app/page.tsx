import Link from 'next/link';
import { getAllHikes, formatDate, formatDuration } from '@/lib/hikes';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const hikes = await getAllHikes();
  const upcoming = hikes.find((h) => h.status === 'upcoming' && h.registrationOpen);
  const nextHike = hikes.find((h) => h.status === 'upcoming') ?? null;
  const pastCount = hikes.filter((h) => h.status === 'completed').length;

  return (
    <>
      {/* Hero */}
      <section style={{ background: '#2C1A0E' }} className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #C4622D 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4A7C59 0%, transparent 40%)',
        }} />
        <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-xl">
            <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: '#C4622D' }}>
              Dwalen met bedoeling
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-black leading-tight mb-6" style={{ color: '#F5E4C0' }}>
              Geen vaste route.<br />Wel goede<br />
              <span style={{ color: '#C4622D' }}>gezelschap.</span>
            </h1>
            <p className="text-lg leading-relaxed mb-8" style={{ color: '#D5B08A' }}>
              Bij Roulette Routes Roamers kiezen we onze wandelingen willekeurig — soms in het bos, soms door de stad, soms over een dijk. Wat vaststaat? Goede gesprekken, een aangenaam tempo en soms een lunch achteraf.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/wandelingen" className="btn-primary">Bekijk wandelingen</Link>
              <Link href="/aanmelden" className="btn-secondary" style={{ borderColor: '#5C3D1E', color: '#D5B08A' }}>Aanmelden</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Next walk banner */}
      {nextHike && (
        <section style={{ background: '#F5E4C0', borderBottom: '1px solid #EDD49A' }}>
          <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-3xl">🥾</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B5A2B' }}>
                  {nextHike.status === 'upcoming' ? 'Volgende wandeling' : 'Meest recente wandeling'}
                </p>
                <p className="font-display font-bold text-lg" style={{ color: '#2C1A0E' }}>{nextHike.title}</p>
                <p className="text-sm" style={{ color: '#5C3D1E' }}>
                  {formatDate(nextHike.date)} · {nextHike.distanceKm} km · {nextHike.region}
                </p>
              </div>
            </div>
            {nextHike.registrationOpen ? (
              <Link href={`/aanmelden?wandeling=${nextHike.slug}`} className="btn-primary flex-shrink-0">Aanmelden →</Link>
            ) : (
              <Link href={`/wandelingen/${nextHike.slug}`} className="btn-secondary flex-shrink-0">Bekijken →</Link>
            )}
          </div>
        </section>
      )}

      {/* About */}
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C4622D' }}>Over ons</p>
            <h2 className="font-display text-3xl font-black mb-5" style={{ color: '#2C1A0E' }}>Roamen, dwalen, ontdekken</h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: '#5C3D1E' }}>
              We wandelen niet om de snelste tijd te halen, maar om de tijd even los te laten. Onderweg verhalen delen, elkaar leren kennen en genieten van het moment.
            </p>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#5C3D1E' }}>
              Elke wandeling is anders: een andere route, een andere omgeving, maar altijd dezelfde sfeer. We sluiten soms af met een lunch of borrel — gezelligheid hoort erbij.
            </p>
            <div className="flex gap-6">
              <div>
                <p className="font-display text-3xl font-black" style={{ color: '#C4622D' }}>{pastCount}</p>
                <p className="text-sm" style={{ color: '#8B5A2B' }}>Wandeling{pastCount !== 1 ? 'en' : ''} gedaan</p>
              </div>
              <div>
                <p className="font-display text-3xl font-black" style={{ color: '#C4622D' }}>∞</p>
                <p className="text-sm" style={{ color: '#8B5A2B' }}>Verhalen gedeeld</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Roulette Routes Roamers" className="w-56 md:w-72 object-contain opacity-90" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: '#F5E4C0', borderTop: '1px solid #EDD49A', borderBottom: '1px solid #EDD49A' }}>
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="font-display text-2xl font-black text-center mb-10" style={{ color: '#2C1A0E' }}>Hoe het werkt</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: '🎲', title: 'Willekeurige route', desc: 'We kiezen elke keer een nieuwe bestemming en route — bos, stad, polder of kust. Geen vast plan.' },
              { icon: '🚶', title: 'Aangenaam tempo', desc: 'We lopen op een tempo waarop iedereen kan meepraten. Geen wedstrijd, wél meters.' },
              { icon: '🍽️', title: 'Samen afsluiten', desc: 'Optioneel sluiten we af met een lunch. Kosten via tikkie met de groep.' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-display font-bold text-lg mb-2" style={{ color: '#2C1A0E' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#5C3D1E' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent hikes preview */}
      {hikes.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-black" style={{ color: '#2C1A0E' }}>Wandelingen</h2>
            <Link href="/wandelingen" className="text-sm font-semibold" style={{ color: '#C4622D' }}>Alle wandelingen →</Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {hikes.slice(0, 3).map((hike) => (
              <Link key={hike.slug} href={`/wandelingen/${hike.slug}`} className="card hover:shadow-md transition-shadow group">
                <div className="h-32 flex items-center justify-center text-5xl" style={{ background: '#F5E4C0' }}>🌲</div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={hike.status === 'upcoming' ? 'badge-upcoming' : 'badge-past'}>
                      {hike.status === 'upcoming' ? 'Aankomend' : 'Gedaan'}
                    </span>
                    <span className="text-xs" style={{ color: '#8B5A2B' }}>{hike.distanceKm} km</span>
                  </div>
                  <h3 className="font-display font-bold text-base mb-1 group-hover:text-[#C4622D] transition-colors" style={{ color: '#2C1A0E' }}>
                    {hike.title}
                  </h3>
                  <p className="text-xs" style={{ color: '#8B5A2B' }}>{formatDate(hike.date)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ background: '#2C1A0E' }}>
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-black mb-4" style={{ color: '#F5E4C0' }}>Ga je mee wandelen?</h2>
          <p className="text-base mb-8" style={{ color: '#8B5A2B' }}>Meld je aan voor de volgende wandeling. Geen kosten, wel goede gezelschap.</p>
          <Link href="/aanmelden" className="btn-primary">Aanmelden</Link>
        </div>
      </section>
    </>
  );
}
