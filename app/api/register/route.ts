import { NextRequest, NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';

export const dynamic = 'force-dynamic';

interface Registration {
  id: string;
  wandeling: string;
  name: string;
  adres: string;
  postcode: string;
  woonplaats: string;
  land: string;
  geboortedatum: string;
  geslacht: string;
  email: string;
  phone: string;
  dietary: string;
  message: string;
  wiltBoekje: boolean;
  registeredAt: string;
}

const BLOB_KEY = 'rrr-registrations.json';

async function getRegistrations(): Promise<Registration[]> {
  try {
    const { blobs } = await list({ prefix: 'rrr-registrations' });
    const blob = blobs.find((b) => b.pathname === BLOB_KEY);
    if (!blob) return [];
    const res = await fetch(blob.url, { cache: 'no-store' });
    return await res.json();
  } catch {
    return [];
  }
}

async function saveRegistrations(registrations: Registration[]) {
  await put(BLOB_KEY, JSON.stringify(registrations, null, 2), {
    access: 'public',
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, wandeling } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Naam en e-mailadres zijn verplicht.' }, { status: 400 });
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return NextResponse.json({ error: 'Vul een geldig e-mailadres in.' }, { status: 400 });
  }

  const registrations = await getRegistrations();

  const duplicate = registrations.find(
    (r) => r.email.toLowerCase() === email.toLowerCase() && r.wandeling === wandeling
  );
  if (duplicate) {
    return NextResponse.json({ error: 'Dit e-mailadres is al aangemeld voor deze wandeling.' }, { status: 409 });
  }

  const newReg: Registration = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
    wiltBoekje: body.wiltBoekje === true,
    registeredAt: new Date().toISOString(),
  };

  registrations.push(newReg);
  await saveRegistrations(registrations);

  // Send email notification if Resend is configured
  if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Roulette Routes Roamers <noreply@rouletteroutes.nl>',
        to: process.env.NOTIFY_EMAIL,
        subject: `Nieuwe aanmelding: ${name} voor ${wandeling}`,
        text: `Nieuwe aanmelding ontvangen:\n\nNaam: ${name}\nAdres: ${body.adres ?? '-'}\nPostcode: ${body.postcode ?? '-'}\nWoonplaats: ${body.woonplaats ?? '-'}\nLand: ${body.land ?? '-'}\nGeboortedatum: ${body.geboortedatum ?? '-'}\nGeslacht: ${body.geslacht ?? '-'}\nEmail: ${email}\nTelefoon: ${body.phone ?? '-'}\nWandeling: ${wandeling}\nWilt boekje: ${body.wiltBoekje ? 'Ja' : 'Nee'}\nDieetwensen: ${body.dietary ?? '-'}\nOpmerking: ${body.message ?? '-'}\n`,
      });
    } catch {
      // Email failure is non-fatal
    }
  }

  return NextResponse.json({ ok: true, id: newReg.id });
}
