import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { purchaseOrderSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = purchaseOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const { items, ...data } = parsed.data;
    const po = await prisma.purchaseOrder.create({
      data: { ...data, items: { create: items } },
      include: { items: true },
    });
    return NextResponse.json(po, { status: 201 });
  } catch (e) {
    console.error('[API] POST /api/purchase-orders/create failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
