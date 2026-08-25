import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { productSchema } from '@/lib/validations';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(products);
  } catch (e) {
    console.error('[API] GET /api/products failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const product = await prisma.product.create({
      data: {
        name: data.name,
        supplier: data.supplier,
        category: data.category,
        cost: data.cost,
        price: data.price,
        stock: data.stock,
        inStock: data.inStock ?? data.stock,
        specs: data.specs ?? '',
        description: data.description ?? '',
        origin: data.origin ?? '',
        leadTime: data.leadTime ?? 0,
        emoji: '📦',
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    console.error('[API] POST /api/products failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
