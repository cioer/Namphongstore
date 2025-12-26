import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminOrderDetailClient from './AdminOrderDetailClient';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          product: true,
          warranty_units: {
            orderBy: {
              unit_no: 'asc',
            },
          },
        },
      },
      event_logs: {
        include: {
          user: {
            select: {
              full_name: true,
              role: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Convert Decimal and Date to string for client component
  const orderData = {
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
    event_logs: order.event_logs.map(log => ({
      ...log,
      created_at: log.created_at.toISOString(),
    })),
  };

  return <AdminOrderDetailClient order={orderData as any} />;
}
