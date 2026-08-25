import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { productSchema } from '@/lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = productSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const product = await prisma.product.update({ where: { id }, data: parsed.data });
    return NextResponse.json(product);
  } catch (e) {
    console.error('[API] PUT /api/products/[id] failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const delta = Number(body?.delta);
    if (!Number.isInteger(delta)) {
      return NextResponse.json({ error: 'delta must be an integer' }, { status: 400 });
    }
    const existing = await prisma.product.findUnique({ where: { id }, select: { inStock: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const product = await prisma.product.update({
      where: { id },
      data: { inStock: Math.max(0, existing.inStock + delta) },
    });
    return NextResponse.json(product);
  } catch (e) {
    console.error('[API] PATCH /api/products/[id] failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    // Detach junction-table references first so the product can be deleted
    await prisma.projectItem.deleteMany({ where: { productId: id } });
    await prisma.proposalItem.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[API] DELETE /api/products/[id] failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
