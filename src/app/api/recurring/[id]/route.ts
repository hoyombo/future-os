import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { recurringExpenseSchema } from '@/lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = recurringExpenseSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const recurring = await prisma.recurringExpense.update({ where: { id }, data: parsed.data });
    return NextResponse.json(recurring);
  } catch (e) {
    console.error('[API] PUT /api/recurring/[id] failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.recurringExpense.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[API] DELETE /api/recurring/[id] failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
