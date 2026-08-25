import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { purchaseOrderSchema } from '@/lib/validations';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const pos = await prisma.purchaseOrder.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(pos);
  } catch (e) {
    console.error('[API] GET /api/purchase-orders failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
