import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const events = await prisma.logisticsEvent.findMany({ orderBy: { timestamp: 'desc' } });
    return NextResponse.json(events);
  } catch (e) {
    console.error('[API] GET /api/logistics failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
