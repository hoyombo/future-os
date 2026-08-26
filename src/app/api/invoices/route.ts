import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { invoiceSchema } from '@/lib/validations';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true } });
    return NextResponse.json(invoices);
  } catch (e) {
    console.error('[API] GET /api/invoices failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = invoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const { items, ...data } = parsed.data;
    const invoice = await prisma.invoice.create({
      data: { ...data, items: { create: items ?? [] } },
      include: { items: true },
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch (e) {
    console.error('[API] POST /api/invoices failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
