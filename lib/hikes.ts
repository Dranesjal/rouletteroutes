export interface Hike {
  slug: string;
  title: string;
  subtitle?: string;
  date: string;
  location: string;
  region: string;
  distanceKm: number;
  durationMin: number;
  description: string;
  status: 'upcoming' | 'completed';
  meetingPoint: string;
  meetingTime: string;
  startTime: string;
  registrationOpen: boolean;
  registrationRequired?: boolean;
  maxParticipants?: number;
  hasLunch: boolean;
  lunchVenue?: string;
  lunchUrl?: string;
  imageUrl?: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  terrain?: string;
}

export const STATIC_HIKES: Hike[] = [
  {
    slug: 'schaijk-boshut-jul-2026',
    title: 'Schaijk · De Boshut loop',
    subtitle: 'Door het bos rondom Schaijk',
    date: '2026-07-26',
    location: 'Boshut, Udensedreef 14, Schaijk',
    region: 'Noord-Brabant',
    distanceKm: 5.93,
    durationMin: 90,
    description: `Een rustige bosroute rondom Schaijk — de perfecte eerste wandeling voor Roulette Routes Roamers. We starten en eindigen bij De Boshut, een sfeervolle locatie midden in het groen. De route voert langs bospaden en open velden, met volop ruimte voor gesprekken onderweg.\n\nHet weer was aangenaam: bewolkt met zo nu en dan een zonnetje, zo'n 20 graden. De perfecte wandeldag. We sloten af met een lunch op het terras van De Boshut.`,
    status: 'completed',
    meetingPoint: 'Boshut, Udensedreef 14, 5374 RK Schaijk',
    meetingTime: '10:45',
    startTime: '11:00',
    registrationOpen: false,
    hasLunch: true,
    lunchVenue: 'De Boshut',
    lunchUrl: 'https://www.hartjegroen.com/de-boshut-ontbijt-lunch-borrel/menukaart/',
    difficulty: 'easy',
    terrain: 'Bospaden, goed begaanbaar',
  },
  {
    slug: 'hoge-veluwe-okt-2026',
    title: 'Hoge Veluwe · Wandeldag',
    subtitle: 'Nationaal Park De Hoge Veluwe',
    date: '2026-10-03',
    location: 'Park Paviljoen, Houtkampweg 9, Otterlo',
    region: 'Gelderland',
    distanceKm: 11,
    durationMin: 150,
    description: `Een wandeldag door het veelzijdige landschap van Nationaal Park De Hoge Veluwe — met bijzondere zandverstuivingen, uitgestrekte bossen en glooiende heidevelden.\n\nWe starten en eindigen bij het Park Paviljoen in het hart van het park. De starttijd is flexibel: je kunt tussen 10:00 en 12:00 beginnen. Entree van het park is voor eigen rekening.\n\nAanmelden is niet verplicht maar wordt gewaardeerd zodat we weten wie er meekomt.`,
    status: 'upcoming',
    meetingPoint: 'Park Paviljoen, Houtkampweg 9, 6731 AV Otterlo',
    meetingTime: '09:00',
    startTime: '10:00',
    registrationOpen: true,
    hasLunch: false,
    difficulty: 'moderate',
    terrain: 'Zandverstuivingen, bospaden en heidevelden',
  },
];

export async function getAllHikes(): Promise<Hike[]> {
  try {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: 'rrr-hikes' });
    if (blobs.length > 0) {
      const latest = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
      const res = await fetch(latest.url, { next: { revalidate: 60 } });
      if (res.ok) {
        const dynamic: Hike[] = await res.json();
        const staticSlugs = new Set(STATIC_HIKES.map((h) => h.slug));
        const newDynamic = dynamic.filter((h) => !staticSlugs.has(h.slug));
        return [...STATIC_HIKES, ...newDynamic].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    }
  } catch { /* no blob or no env var — use static */ }
  return [...STATIC_HIKES].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getHikeBySlug(slug: string): Promise<Hike | null> {
  const all = await getAllHikes();
  return all.find((h) => h.slug === slug) ?? null;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}u${m.toString().padStart(2, '0')}` : `${h}u`;
}
