import { NextRequest, NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';
import { STATIC_HIKES } from '@/lib/hikes';

export const dynamic = 'force-dynamic';

const BLOB_KEY = 'rrr-hikes.json';

function checkAuth(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const [, encoded] = auth.split(' ');
  if (!encoded) return false;
  const decoded = Buffer.from(encoded, 'base64').toString();
  const [, pass] = decoded.split(':');
  return pass === process.env.ADMIN_PASSWORD;
}

async function getDynamicHikes() {
  try {
    const { blobs } = await list({ prefix: 'rrr-hikes' });
    const blob = blobs.find((b) => b.pathname === BLOB_KEY);
    if (!blob) return [];
    const res = await fetch(blob.url, { cache: 'no-store' });
    return await res.json();
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Admin"' } });
  }
  const dynamic = await getDynamicHikes();
  return NextResponse.json({ static: STATIC_HIKES, dynamic });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Admin"' } });
  }

  const hike = await req.json();
  if (!hike.slug || !hike.title || !hike.date) {
    return NextResponse.json({ error: 'slug, title en date zijn verplicht.' }, { status: 400 });
  }

  const existing = await getDynamicHikes();
  const idx = existing.findIndex((h: { slug: string }) => h.slug === hike.slug);
  if (idx >= 0) {
    existing[idx] = hike;
  } else {
    existing.push(hike);
  }

  await put(BLOB_KEY, JSON.stringify(existing, null, 2), {
    access: 'public',
    allowOverwrite: true,
    contentType: 'application/json',
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Admin"' } });
  }

  const { slug } = await req.json();
  const existing = await getDynamicHikes();
  const filtered = existing.filter((h: { slug: string }) => h.slug !== slug);
  await put(BLOB_KEY, JSON.stringify(filtered, null, 2), {
    access: 'public',
    allowOverwrite: true,
    contentType: 'application/json',
  });

  return NextResponse.json({ ok: true });
}
