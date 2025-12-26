import { prisma } from '@/lib/prisma';
import HomeContent from '@/components/shop/HomeContent';

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

function serializeProduct(p: any) {
  return {
    id: String(p.id),
    category_id: String(p.category_id),
    name: String(p.name),
    slug: String(p.slug),
    brand: p.brand ? String(p.brand) : null,
    description: p.description ? String(p.description) : null,
    specs: p.specs ?? null,
    gifts: Array.isArray(p.gifts) ? p.gifts : [],
    images: Array.isArray(p.images) ? p.images : [],
    price_original: String(p.price_original),
    price_sale: String(p.price_sale),
    discount_percent: Number(p.discount_percent),
    promo_start: p.promo_start ? new Date(p.promo_start).toISOString() : null,
    promo_end: p.promo_end ? new Date(p.promo_end).toISOString() : null,
    warranty_months: Number(p.warranty_months),
    stock_quantity: Number(p.stock_quantity),
    is_active: Boolean(p.is_active),
    created_at: new Date(p.created_at).toISOString(),
    updated_at: new Date(p.updated_at).toISOString(),
  };
}

function serializeCategory(c: any) {
  return {
    id: String(c.id),
    name: String(c.name),
    slug: String(c.slug),
    description: c.description ? String(c.description) : null,
    image_url: c.image_url ? String(c.image_url) : null,
    parent_id: c.parent_id ? String(c.parent_id) : null,
    created_at: new Date(c.created_at).toISOString(),
    updated_at: new Date(c.updated_at).toISOString(),
  };
}

async function getHomeData() {
  const now = new Date();

  const [categories, deals, best] = await Promise.all([
    // Get categories
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      take: 6,
    }),
    // Get products on active promotion (deals)
    prisma.product.findMany({
      where: {
        is_active: true,
        discount_percent: { gt: 0 },
        promo_start: { lte: now },
        promo_end: { gte: now },
      },
      orderBy: { discount_percent: 'desc' },
      take: 8,
    }),
    // Get best-sellers (most recent products as proxy)
    prisma.product.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
      take: 8,
    }),
  ]);

  // Serialize to plain JSON to avoid RSC serialization issues
  const serializedData = {
    categories: categories.map(serializeCategory),
    dealsProducts: deals.map(serializeProduct),
    bestSellers: best.map(serializeProduct),
  };
  
  // Deep clone to ensure no Prisma proxy objects remain
  return JSON.parse(JSON.stringify(serializedData));
}

export default async function Home() {
  const { categories, dealsProducts, bestSellers } = await getHomeData();

  return (
    <HomeContent
      categories={categories}
      dealsProducts={dealsProducts}
      bestSellers={bestSellers}
    />
  );
}
