import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import OrderDetailClient from './OrderDetailClient';

interface OrderDetailPageProps {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

async function getOrderDetail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
          warranty_units: {
            orderBy: { unit_no: 'asc' },
          },
        },
      },
    },
  });

  if (!order) return null;

  // Convert Decimal and Date to string for client component
  return {
    ...order,
    total_amount: order.total_amount.toString(),
    created_at: order.created_at.toISOString(),
    updated_at: order.updated_at.toISOString(),
    delivered_date: order.delivered_date?.toISOString() ?? null,
    items: order.items.map(item => ({
      ...item,
      unit_price_at_purchase: item.unit_price_at_purchase.toString(),
      created_at: item.created_at.toISOString(),
      product: {
        ...item.product,
        price_original: item.product.price_original.toString(),
        price_sale: item.product.price_sale.toString(),
        created_at: item.product.created_at.toISOString(),
        updated_at: item.product.updated_at.toISOString(),
        promo_start: item.product.promo_start?.toISOString() ?? null,
        promo_end: item.product.promo_end?.toISOString() ?? null,
      },
      warranty_units: item.warranty_units.map(wu => ({
        ...wu,
        start_date: wu.start_date.toISOString(),
        end_date: wu.end_date.toISOString(),
        created_at: wu.created_at.toISOString(),
        updated_at: wu.updated_at.toISOString(),
      })),
    })),
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = params;
  const order = await getOrderDetail(id);

  if (!order) {
    notFound();
  }

  return <OrderDetailClient order={order as any} />;
}
