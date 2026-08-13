import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, wandeling } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Naam en e-mailadres zijn verplicht.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Vul een geldig e-mailadres in.' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = getAdminClient() as any;

  // Duplicate check
  const { data: existing } = await service
    .from('registrations')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .eq('wandeling', wandeling ?? '')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Dit e-mailadres is al aangemeld voor deze wandeling.' }, { status: 409 });
  }

  // Koppel direct aan Roamer-account als dit e-mail al geregistreerd is
  const { data: linkedId } = await service.rpc('get_user_id_by_email', {
    p_email: email.trim().toLowerCase(),
  });

  const { data, error } = await service.from('registrations').insert({
    wandeling: wandeling ?? 'unknown',
    name: name.trim(),
    adres: body.adres?.trim() ?? '',
    postcode: body.postcode?.trim() ?? '',
    woonplaats: body.woonplaats?.trim() ?? '',
    land: body.land?.trim() ?? 'Nederland',
    geboortedatum: body.geboortedatum?.trim() ?? '',
    geslacht: body.geslacht?.trim() ?? '',
    email: email.trim().toLowerCase(),
    phone: body.phone?.trim() ?? '',
    dietary: body.dietary?.trim() ?? '',
    message: body.message?.trim() ?? '',
    wilt_boekje: body.wiltBoekje === true,
    wil_lunchen: body.wilLunchen === true,
    profile_id: linkedId ?? null,
  }).select('id').single();

  if (error) {
    console.error('Registration insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sla dieetwensen op in profiel zodat ze de volgende keer pre-ingevuld zijn
  if (linkedId && body.dietary?.trim()) {
    await service.from('profiles').update({ dietary: body.dietary.trim() }).eq('id', linkedId);
  }

  // Email notification (optional)
  if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Roulette Routes Roamers <noreply@rouletteroutes.nl>',
        to: process.env.NOTIFY_EMAIL,
        subject: `Nieuwe aanmelding: ${name} voor ${wandeling}`,
        text: `Naam: ${name}\nAdres: ${body.adres ?? '-'}\nPostcode: ${body.postcode ?? '-'}\nWoonplaats: ${body.woonplaats ?? '-'}\nGeboortedatum: ${body.geboortedatum ?? '-'}\nGeslacht: ${body.geslacht ?? '-'}\nEmail: ${email}\nTelefoon: ${body.phone ?? '-'}\nWandeling: ${wandeling}\nLunch: ${body.wilLunchen ? 'Ja' : 'Nee'}\nDieetwensen: ${body.dietary ?? '-'}\nWilt boekje: ${body.wiltBoekje ? 'Ja' : 'Nee'}\nOpmerking: ${body.message ?? '-'}`,
      });
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ ok: true, id: data.id });
}
