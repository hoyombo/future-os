import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { afterSalesTicketSchema } from '@/lib/validations';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const tickets = await prisma.afterSalesTicket.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(tickets);
  } catch (e) {
    console.error('[API] GET /api/after-sales failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
