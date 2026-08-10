import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllHikes, getHikeBySlug, formatDate, formatDuration } from '@/lib/hikes';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hike = await getHikeBySlug(slug);
  if (!hike) return {};
  return { title: `${hike.title} — Roulette Routes Roamers`, description: hike.description.slice(0, 160) };
}

export default async function HikePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hike = await getHikeBySlug(slug);
  if (!hike) notFound();

  const difficultyLabel = { easy: 'Makkelijk', moderate: 'Gemiddeld', hard: 'Zwaar' }[hike.difficulty];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Back */}
      <Link href="/wandelingen" className="text-sm font-semibold mb-8 inline-flex items-center gap-1" style={{ color: '#C4622D' }}>
        ← Alle wandelingen
      </Link>

      {/* Header */}
      <div className="mb-8 mt-4">
        <div className="flex items-center gap-3 mb-3">
          <span className={hike.status === 'upcoming' ? 'badge-upcoming' : 'badge-past'}>
            {hike.status === 'upcoming' ? 'Aankomend' : 'Gedaan'}
          </span>
          <span className="text-sm" style={{ color: '#8B5A2B' }}>{hike.region}</span>
        </div>
        <h1 className="font-display text-4xl font-black mb-2" style={{ color: '#2C1A0E' }}>{hike.title}</h1>
        {hike.subtitle && <p className="text-lg" style={{ color: '#5C3D1E' }}>{hike.subtitle}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '📅', label: 'Datum', value: formatDate(hike.date) },
          { icon: '📏', label: 'Afstand', value: `${hike.distanceKm} km` },
          { icon: '⏱️', label: 'Duur', value: formatDuration(hike.durationMin) },
          { icon: '🥾', label: 'Moeilijkheid', value: difficultyLabel },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-xs uppercase tracking-wider font-bold mb-0.5" style={{ color: '#8B5A2B' }}>{s.label}</p>
            <p className="font-bold text-sm" style={{ color: '#2C1A0E' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-xl mb-3" style={{ color: '#2C1A0E' }}>Over deze wandeling</h2>
        <div className="text-base leading-relaxed space-y-3" style={{ color: '#3E2610' }}>
          {hike.description.split('\n').map((p, i) => p.trim() && <p key={i}>{p}</p>)}
        </div>
      </div>

      {/* Practical info */}
      <div className="card p-6 mb-8">
        <h2 className="font-display font-bold text-lg mb-4" style={{ color: '#2C1A0E' }}>Praktische info</h2>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><dt className="label-sm">Vertrekpunt</dt><dd style={{ color: '#2C1A0E' }}>{hike.meetingPoint}</dd></div>
          <div><dt className="label-sm">Verzamelen</dt><dd style={{ color: '#2C1A0E' }}>{hike.meetingTime} · Start om {hike.startTime}</dd></div>
          {hike.terrain && <div><dt className="label-sm">Ondergrond</dt><dd style={{ color: '#2C1A0E' }}>{hike.terrain}</dd></div>}
          {hike.hasLunch && (
            <div>
              <dt className="label-sm">Lunch</dt>
              <dd style={{ color: '#2C1A0E' }}>
                {hike.lunchVenue}
                {hike.lunchUrl && <> · <a href={hike.lunchUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#C4622D' }}>Menu bekijken</a></>}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* CTA */}
      {hike.status === 'upcoming' && hike.registrationOpen && (
        <div className="text-center py-8 border-t" style={{ borderColor: '#EDD49A' }}>
          {hike.registrationRequired === false ? (
            <>
              <p className="text-sm font-semibold mb-1" style={{ color: '#4A7C59' }}>Aanmelden is niet verplicht maar wel fijn</p>
              <p className="text-sm mb-5" style={{ color: '#5C3D1E' }}>Zo weten we wie er meekomt. Je bent ook welkom zonder aanmelding.</p>
            </>
          ) : (
            <p className="text-base mb-4" style={{ color: '#5C3D1E' }}>Ga je mee op deze wandeling?</p>
          )}
          <Link href={`/aanmelden?wandeling=${hike.slug}`} className="btn-primary">
            {hike.registrationRequired === false ? 'Optioneel aanmelden' : 'Aanmelden voor deze wandeling'}
          </Link>
        </div>
      )}

      {hike.status === 'completed' && (
        <div className="text-center py-8 border-t" style={{ borderColor: '#EDD49A' }}>
          <p className="text-base mb-4" style={{ color: '#5C3D1E' }}>Deze wandeling heeft plaatsgevonden. Wil je mee met de volgende?</p>
          <Link href="/aanmelden" className="btn-primary">Aanmelden voor volgende wandeling</Link>
        </div>
      )}
    </div>
  );
}
