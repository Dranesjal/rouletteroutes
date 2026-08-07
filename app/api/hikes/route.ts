import { NextResponse } from 'next/server';
import { getAllHikes } from '@/lib/hikes';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hikes = await getAllHikes();
  return NextResponse.json({ hikes });
}
