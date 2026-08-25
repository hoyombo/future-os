import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { projectSchema } from '@/lib/validations';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const projects = await prisma.project.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(projects);
  } catch (e) {
    console.error('[API] GET /api/projects failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
