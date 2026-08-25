import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const entries = await prisma.activityEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(entries);
  } catch (e) {
    console.error('[API] GET /api/activity failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    await prisma.activityEntry.deleteMany();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[API] DELETE /api/activity failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
