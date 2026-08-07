import Link from 'next/link';
import { getAllHikes, formatDate } from '@/lib/hikes';

export const dynamic = 'force-dynamic';

export default async function WandelingenPage() {
  const hikes = await getAllHikes();
  const upcoming = hikes.filter((h) => h.status === 'upcoming');
  const past = hikes.filter((h) => h.status === 'completed');

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C4622D' }}>Alle wandelingen</p>
        <h1 className="font-display text-4xl font-black" style={{ color: '#2C1A0E' }}>Onze routes</h1>
      </div>

      {upcoming.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display font-bold text-xl mb-5" style={{ color: '#2C1A0E' }}>📅 Aankomende wandelingen</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {upcoming.map((hike) => (
              <HikeCard key={hike.slug} hike={hike} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-xl mb-5" style={{ color: '#2C1A0E' }}>✅ Gedaan</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {past.map((hike) => (
              <HikeCard key={hike.slug} hike={hike} />
            ))}
          </div>
        </section>
      )}

      {hikes.length === 0 && (
        <div className="text-center py-20" style={{ color: '#8B5A2B' }}>
          <div className="text-5xl mb-4">🌲</div>
          <p>Nog geen wandelingen gepland. Kom snel terug!</p>
        </div>
      )}
    </div>
  );
}

function HikeCard({ hike }: { hike: Awaited<ReturnType<typeof getAllHikes>>[0] }) {
  return (
    <Link href={`/wandelingen/${hike.slug}`} className="card hover:shadow-md transition-all group block">
      <div className="h-36 flex items-center justify-center text-6xl relative" style={{ background: '#F5E4C0' }}>
        🌲
        <div className="absolute top-3 left-3">
          <span className={hike.status === 'upcoming' ? 'badge-upcoming' : 'badge-past'}>
            {hike.status === 'upcoming' ? 'Aankomend' : 'Gedaan'}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display font-bold text-lg mb-1 group-hover:text-[#C4622D] transition-colors" style={{ color: '#2C1A0E' }}>
          {hike.title}
        </h3>
        <p className="text-sm mb-3" style={{ color: '#8B5A2B' }}>{formatDate(hike.date)}</p>
        <div className="flex gap-4 text-xs" style={{ color: '#5C3D1E' }}>
          <span>📍 {hike.region}</span>
          <span>📏 {hike.distanceKm} km</span>
          {hike.hasLunch && <span>🍽️ Lunch</span>}
        </div>
      </div>
    </Link>
  );
}
