import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { STATIC_HIKES } from '@/lib/hikes';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  if (!isAdmin) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">🚫</p>
        <h1 className="font-display text-2xl font-black mb-2" style={{ color: '#2C1A0E' }}>Geen toegang</h1>
        <p className="text-sm" style={{ color: '#5C3D1E' }}>Alleen admins kunnen deze pagina bekijken.</p>
      </div>
    );
  }

  const service = await createServiceClient();
  const [{ data: registrations }, { data: profiles }, { data: kosten }, { data: walkRecords }] = await Promise.all([
    service.from('registrations').select('*').order('registered_at', { ascending: false }),
    service.from('profiles').select('*').order('created_at', { ascending: false }),
    service.from('wandeling_kosten').select('*').order('created_at'),
    service.from('walk_records').select('*').order('date', { ascending: false }),
  ]);

  const hikes = STATIC_HIKES.map(h => ({
    slug: h.slug,
    title: h.title,
    date: h.date,
    distanceKm: h.distanceKm,
    status: h.status,
  }));

  return (
    <AdminClient
      adminName={profile.name || user.email || 'Admin'}
      adminRole={profile.role as 'admin' | 'super_admin'}
      registrations={registrations ?? []}
      roamers={profiles ?? []}
      hikes={hikes}
      kosten={kosten ?? []}
      walkRecords={walkRecords ?? []}
    />
  );
}
