import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

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
