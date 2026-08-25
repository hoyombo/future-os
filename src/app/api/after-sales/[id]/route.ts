import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { afterSalesTicketSchema } from '@/lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = afterSalesTicketSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const ticket = await prisma.afterSalesTicket.update({ where: { id }, data: parsed.data });
    return NextResponse.json(ticket);
  } catch (e) {
    console.error('[API] PUT /api/after-sales/[id] failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.afterSalesTicket.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[API] DELETE /api/after-sales/[id] failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
