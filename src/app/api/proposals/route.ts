import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { proposalSchema } from '@/lib/validations';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const proposals = await prisma.proposal.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(proposals);
  } catch (e) {
    console.error('[API] GET /api/proposals failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = proposalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const { items, ...data } = parsed.data;
    const proposal = await prisma.proposal.create({
      data: {
        ...data,
        items: { create: items || [] },
      },
      include: { items: true },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (e) {
    console.error('[API] POST /api/proposals failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
