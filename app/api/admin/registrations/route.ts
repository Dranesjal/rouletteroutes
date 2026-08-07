import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';

function checkAuth(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const [, encoded] = auth.split(' ');
  if (!encoded) return false;
  const decoded = Buffer.from(encoded, 'base64').toString();
  const [, pass] = decoded.split(':');
  return pass === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Admin"' } });
  }

  try {
    const { blobs } = await list({ prefix: 'rrr-registrations' });
    const blob = blobs.find((b) => b.pathname === 'rrr-registrations.json');
    if (!blob) return NextResponse.json({ registrations: [] });
    const res = await fetch(blob.url, { cache: 'no-store' });
    const registrations = await res.json();
    return NextResponse.json({ registrations });
  } catch {
    return NextResponse.json({ registrations: [] });
  }
}
