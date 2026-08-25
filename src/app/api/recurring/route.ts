import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { recurringExpenseSchema } from '@/lib/validations';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const recurring = await prisma.recurringExpense.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(recurring);
  } catch (e) {
    console.error('[API] GET /api/recurring failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = recurringExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const recurring = await prisma.recurringExpense.create({ data: parsed.data });
    return NextResponse.json(recurring, { status: 201 });
  } catch (e) {
    console.error('[API] POST /api/recurring failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
