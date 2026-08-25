import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { billSchema } from '@/lib/validations';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const bills = await prisma.bill.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(bills);
  } catch (e) {
    console.error('[API] GET /api/bills failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = billSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const bill = await prisma.bill.create({ data: parsed.data });
    return NextResponse.json(bill, { status: 201 });
  } catch (e) {
    console.error('[API] POST /api/bills failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
