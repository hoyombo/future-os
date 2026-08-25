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

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const { items, ...projectData } = parsed.data;
    const project = await prisma.project.create({
      data: {
        ...projectData,
        spent: projectData.spent ?? 0,
        status: projectData.status ?? 'active',
        items: items ? {
          create: items.map((item) => ({
            productId: item.productId,
          })),
        } : undefined,
      },
      include: { items: { include: { product: true } } },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (e) {
    console.error('[API] POST /api/projects failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
