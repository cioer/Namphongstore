import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminReturnDetailClient from './AdminReturnDetailClient';

export default async function AdminReturnDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: params.id },
    include: {
      order: {
        include: {
          items: {
            include: {
              warranty_units: true,
            },
          },
        },
      },
      warranty_unit: {
        include: {
          order_item: true,
          replaced_old_unit: true,
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

  if (!returnRequest) {
    notFound();
  }

  // Convert Decimal and Date to string for client component
  const serializedReturnRequest = {
    ...returnRequest,
    created_at: returnRequest.created_at.toISOString(),
    updated_at: returnRequest.updated_at.toISOString(),
    order: {
      ...returnRequest.order,
      total_amount: returnRequest.order.total_amount.toString(),
      created_at: returnRequest.order.created_at.toISOString(),
      updated_at: returnRequest.order.updated_at.toISOString(),
      delivered_date: returnRequest.order.delivered_date?.toISOString() ?? null,
      items: returnRequest.order.items.map(item => ({
        ...item,
        unit_price_at_purchase: item.unit_price_at_purchase.toString(),
        created_at: item.created_at.toISOString(),
        warranty_units: item.warranty_units.map(wu => ({
          ...wu,
          start_date: wu.start_date.toISOString(),
          end_date: wu.end_date.toISOString(),
          created_at: wu.created_at.toISOString(),
          updated_at: wu.updated_at.toISOString(),
        })),
      })),
    },
    warranty_unit: returnRequest.warranty_unit ? {
      ...returnRequest.warranty_unit,
      start_date: returnRequest.warranty_unit.start_date.toISOString(),
      end_date: returnRequest.warranty_unit.end_date.toISOString(),
      created_at: returnRequest.warranty_unit.created_at.toISOString(),
      updated_at: returnRequest.warranty_unit.updated_at.toISOString(),
      order_item: {
        ...returnRequest.warranty_unit.order_item,
        unit_price_at_purchase: returnRequest.warranty_unit.order_item.unit_price_at_purchase.toString(),
        created_at: returnRequest.warranty_unit.order_item.created_at.toISOString(),
      },
      replaced_old_unit: returnRequest.warranty_unit.replaced_old_unit ? {
        ...returnRequest.warranty_unit.replaced_old_unit,
        start_date: returnRequest.warranty_unit.replaced_old_unit.start_date.toISOString(),
        end_date: returnRequest.warranty_unit.replaced_old_unit.end_date.toISOString(),
        created_at: returnRequest.warranty_unit.replaced_old_unit.created_at.toISOString(),
        updated_at: returnRequest.warranty_unit.replaced_old_unit.updated_at.toISOString(),
      } : null,
    } : null,
    event_logs: returnRequest.event_logs.map(log => ({
      ...log,
      created_at: log.created_at.toISOString(),
    })),
  };

  return <AdminReturnDetailClient returnRequest={serializedReturnRequest as any} />;
}
