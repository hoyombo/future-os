import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const items = await prisma.budgetItem.findMany({ orderBy: { category: 'asc' } });
    return NextResponse.json(items);
  } catch (e) {
    console.error('[API] GET /api/budget failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
