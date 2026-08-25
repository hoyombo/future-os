import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(products);
  } catch (e) {
    console.error('[API] GET /api/products failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
