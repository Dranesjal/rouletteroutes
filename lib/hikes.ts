import { getAdminClient } from '@/lib/supabase/admin';

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
  difficulty: 'easy' | 'moderate' | 'hard';
  terrain?: string;
  wandelboekje?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToHike(row: any): Hike {
  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle || undefined,
    date: row.date,
    location: row.location || '',
    region: row.region || '',
    distanceKm: row.distance_km ?? 0,
    durationMin: row.duration_min ?? 0,
    description: row.description || '',
    status: row.status ?? 'upcoming',
    meetingPoint: row.meeting_point || '',
    meetingTime: row.meeting_time || '',
    startTime: row.start_time || '',
    registrationOpen: row.registration_open ?? false,
    registrationRequired: row.registration_required || undefined,
    maxParticipants: row.max_participants || undefined,
    hasLunch: row.has_lunch ?? false,
    lunchVenue: row.lunch_venue || undefined,
    lunchUrl: row.lunch_url || undefined,
    difficulty: row.difficulty ?? 'easy',
    terrain: row.terrain || undefined,
    wandelboekje: row.wandelboekje || undefined,
  };
}

export async function getAllHikes(): Promise<Hike[]> {
  const db = getAdminClient();
  const { data } = await db.from('hikes').select('*').order('date', { ascending: false });
  return (data ?? []).map(dbToHike);
}

export async function getHikeBySlug(slug: string): Promise<Hike | null> {
  const db = getAdminClient();
  const { data } = await db.from('hikes').select('*').eq('slug', slug).single();
  return data ? dbToHike(data) : null;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}u${m.toString().padStart(2, '0')}` : `${h}u`;
}
