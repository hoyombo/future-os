import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { afterSalesTicketSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = afterSalesTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const ticket = await prisma.afterSalesTicket.create({ data: parsed.data });
    return NextResponse.json(ticket, { status: 201 });
  } catch (e) {
    console.error('[API] POST /api/after-sales/create failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
