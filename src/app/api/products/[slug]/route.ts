import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
      },
    });

    if (!product || !product.is_active) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Convert Decimal to string and Date to ISO string
    const productData = {
      ...product,
      id: product.id.toString(),
      category_id: product.category_id.toString(),
      price_original: product.price_original.toString(),
      price_sale: product.price_sale.toString(),
      promo_start: product.promo_start?.toISOString() ?? null,
      promo_end: product.promo_end?.toISOString() ?? null,
      created_at: product.created_at.toISOString(),
      updated_at: product.updated_at.toISOString(),
      category: {
        ...product.category,
        id: product.category.id.toString(),
        parent_id: product.category.parent_id?.toString() ?? null,
        created_at: product.category.created_at.toISOString(),
        updated_at: product.category.updated_at.toISOString(),
      },
    };

    return NextResponse.json(productData);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}