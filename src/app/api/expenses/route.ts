import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { expenseSchema } from '@/lib/validations';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const expenses = await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(expenses);
  } catch (e) {
    console.error('[API] GET /api/expenses failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const expense = await prisma.expense.create({ data: parsed.data });
    return NextResponse.json(expense, { status: 201 });
  } catch (e) {
    console.error('[API] POST /api/expenses failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
