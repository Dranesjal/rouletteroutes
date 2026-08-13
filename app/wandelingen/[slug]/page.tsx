import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllHikes, getHikeBySlug, formatDate, formatDuration, Hike } from '@/lib/hikes';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hike = await getHikeBySlug(slug);
  if (!hike) return {};
  return { title: `${hike.title} | Roulette Routes Roamers`, description: hike.description.slice(0, 160) };
}

export default async function HikePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [hike, allHikes] = await Promise.all([getHikeBySlug(slug), getAllHikes()]);
  if (!hike) notFound();

  const nextHike: Hike | null = allHikes.find(
    h => h.status === 'upcoming' && h.registrationOpen && h.slug !== slug
  ) ?? null;

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
          <p className="text-base mb-4" style={{ color: '#5C3D1E' }}>Wil je mee roamen op de {hike.title}? Meld je dan snel aan!</p>
          <Link href={`/aanmelden?wandeling=${hike.slug}`} className="btn-primary">Aanmelden</Link>
        </div>
      )}

      {/* Wandelkilometerboekje */}
      {hike.wandelboekje && (
        <div className="mb-8 rounded-xl overflow-hidden border" style={{ borderColor: '#4A7C59' }}>
          <div className="px-5 py-3 font-bold text-sm flex items-center gap-2" style={{ background: '#4A7C59', color: 'white' }}>
            📖 Officiële route met stempel
          </div>
          <div className="p-5 space-y-3 text-sm" style={{ background: '#F2F8F4', color: '#2C3E2E' }}>
            <p>
              Deze wandeling is een <strong>officiële eroute</strong>. Bij het startpunt ontvang je een officiële stempel in je <strong>Wandelkilometerboekje</strong>.
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-lg text-sm leading-relaxed" style={{ background: 'white', border: '1px solid #b6d9c0' }}>
                <p className="font-bold mb-2" style={{ color: '#2C3E2E' }}>Wat is het Wandelkilometerboekje?</p>
                <p style={{ color: '#3E5C45' }}>
                  Met het Wandelkilometerboekje houd je van elke wandeling de gelopen prestaties en ervaringen bij. Heb je bijvoorbeeld 250 km gewandeld, dan kun je het <strong>wandelprestatiekruis 250</strong> bestellen. Kijk hiervoor bij het onderwerp medailles.
                </p>
              </div>

              <div className="p-4 rounded-lg text-sm leading-relaxed" style={{ background: 'white', border: '1px solid #b6d9c0' }}>
                <p className="font-bold mb-2" style={{ color: '#2C3E2E' }}>Georganiseerde routes en stempels</p>
                <p style={{ color: '#3E5C45' }}>
                  Bij georganiseerde evenementen zoals de Nijmeegse 4 Daagse of deze Veluwewandeltocht is er een stempelpost aanwezig. Georganiseerde evenementen zijn vaak aangesloten bij de <strong>Koninklijke Wandelbond Nederland (KWbN)</strong>.
                </p>
              </div>

              <div className="p-4 rounded-lg text-sm leading-relaxed" style={{ background: 'white', border: '1px solid #b6d9c0' }}>
                <p className="font-bold mb-2" style={{ color: '#2C3E2E' }}>Start- en finishbureau</p>
                <p style={{ color: '#3E5C45' }}>
                  Bij de start of direct na de finish loop je naar de organisatietafel. Daar zit de organisatie klaar om een officiële stempel (en soms een sticker) van hun vereniging in jouw boekje te zetten.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg text-sm leading-relaxed" style={{ background: 'white', border: '1px solid #b6d9c0' }}>
                <p className="font-bold mb-1" style={{ color: '#2C3E2E' }}>Prijs Wandelkilometerboekje</p>
                <p style={{ color: '#3E5C45' }}>
                  Een Wandelkilometerboekje kost <strong>€ 3,50</strong>. Wil je een boekje? Vink dit aan bij de aanmelding, dan zorgen wij dat je een boekje ontvangt bij de start.
                </p>
              </div>
          </div>
        </div>
      )}

      {hike.status === 'completed' && (
        <div className="text-center py-8 border-t" style={{ borderColor: '#EDD49A' }}>
          <p className="text-base mb-4" style={{ color: '#5C3D1E' }}>Deze wandeling heeft plaatsgevonden. Wil je mee met de volgende?</p>
          {nextHike ? (
            <Link href={`/wandelingen/${nextHike.slug}`} className="btn-primary">
              Volgende wandeling: {nextHike.title} →
            </Link>
          ) : (
            <Link href="/wandelingen" className="btn-primary">Bekijk alle wandelingen</Link>
          )}
        </div>
      )}
    </div>
  );
}
