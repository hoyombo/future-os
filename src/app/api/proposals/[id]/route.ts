import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { proposalSchema } from '@/lib/validations';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(proposal);
  } catch (e) {
    console.error('[API] GET /api/proposals/[id] failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = proposalSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const { items, ...data } = parsed.data;

    if (items) {
      await prisma.proposalItem.deleteMany({ where: { proposalId: id } });
    }

    const proposal = await prisma.proposal.update({
      where: { id },
      data: {
        ...data,
        ...(items ? { items: { create: items } } : {}),
      },
      include: { items: true },
    });

    return NextResponse.json(proposal);
  } catch (e) {
    console.error('[API] PUT /api/proposals/[id] failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.proposal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[API] DELETE /api/proposals/[id] failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
