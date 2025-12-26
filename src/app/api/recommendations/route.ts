import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('product_id');
    const limit = parseInt(searchParams.get('limit') || '6');

    if (!productId) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    // Get the current product to find its category
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { category_id: true, brand: true }
    });

    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Strategy 1: Find products frequently bought together
    const frequentlyBoughtTogether = await prisma.$queryRaw`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.brand,
        p.price_original,
        p.price_sale,
        p.discount_percent,
        p.promo_start,
        p.promo_end,
        p.images,
        p.gifts,
        COUNT(*) as co_occurrence_count
      FROM products p
      INNER JOIN order_items oi ON p.id = oi.product_id
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'DELIVERED'
        AND o.id IN (
          SELECT DISTINCT order_id 
          FROM order_items 
          WHERE product_id = ${productId}
        )
        AND p.id != ${productId}
        AND p.is_active = true
      GROUP BY p.id, p.name, p.slug, p.brand, p.price_original, p.price_sale, 
               p.discount_percent, p.promo_start, p.promo_end, p.images, p.gifts
      ORDER BY co_occurrence_count DESC
      LIMIT ${Math.ceil(limit / 2)}
    `;

    // Strategy 2: Find products in same category with good ratings (mock)
    const sameCategoryProducts = await prisma.product.findMany({
      where: {
        category_id: currentProduct.category_id,
        id: { not: productId },
        is_active: true,
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit - (frequentlyBoughtTogether as any[]).length,
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        price_original: true,
        price_sale: true,
        discount_percent: true,
        promo_start: true,
        promo_end: true,
        images: true,
        gifts: true,
      }
    });

    // Strategy 3: If same brand, find other products from same brand
    const sameBrandProducts = currentProduct.brand ? await prisma.product.findMany({
      where: {
        brand: currentProduct.brand,
        id: { not: productId },
        is_active: true,
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 3,
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        price_original: true,
        price_sale: true,
        discount_percent: true,
        promo_start: true,
        promo_end: true,
        images: true,
        gifts: true,
      }
    }) : [];

    // Combine and deduplicate recommendations
    const allRecommendations = [
      ...(frequentlyBoughtTogether as any[]),
      ...sameCategoryProducts,
      ...sameBrandProducts
    ];

    const uniqueRecommendations = allRecommendations
      .filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      )
      .slice(0, limit);

    // Serialize for JSON response
    const recommendations = uniqueRecommendations.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      price_original: product.price_original?.toString() || '0',
      price_sale: product.price_sale?.toString() || '0',
      discount_percent: product.discount_percent || 0,
      promo_start: product.promo_start?.toISOString() || null,
      promo_end: product.promo_end?.toISOString() || null,
      images: product.images,
      gifts: product.gifts,
    }));

    return NextResponse.json({
      success: true,
      recommendations,
      strategies_used: {
        frequently_bought_together: (frequentlyBoughtTogether as any[]).length,
        same_category: sameCategoryProducts.length,
        same_brand: sameBrandProducts.length,
      }
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Có lỗi khi tải sản phẩm gợi ý' },
      { status: 500 }
    );
  }
}