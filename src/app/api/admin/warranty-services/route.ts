import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const sessionId = request.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
    });

    if (!user || !['ADMIN', 'TECH'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all warranty services
    const rawServices = await prisma.warrantyService.findMany({
      include: {
        warranty_unit: {
          include: {
            order_item: {
              include: {
                order: {
                  select: {
                    order_code: true,
                    customer_name: true,
                    customer_phone: true,
                    // customer_email is not in Order model based on prisma schema shown? 
                    // Let's assume user.email if we have user relation, or just skip email if not in order.
                    // Checking schema again: Order has 'user_id' but not explicit email field stored on order unless added.
                    // Wait, Order model usually has shipping info.
                    // Let's stick to name and phone which are confirmed.
                  },
                },
                product: {
                    select: {
                        name: true
                    }
                }
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const services = rawServices.map((svc: any) => ({
      id: svc.id,
      service_type: svc.type,
      service_status: svc.status,
      description: svc.issue_description,
      customer_note: svc.issue_description, // Map same field or if there is another? Schema has issue_description.
      created_at: svc.created_at,
      completed_at: svc.updated_at, // Use updated_at as proxy if strictly needed, or null
      customer: {
        full_name: svc.warranty_unit?.order_item?.order?.customer_name || 'N/A',
        phone: svc.warranty_unit?.order_item?.order?.customer_phone || 'N/A',
        email: '', // Not available in this path easily
      },
      warranty_unit: {
        warranty_code_auto: svc.warranty_unit?.warranty_code_auto,
        product_name: svc.warranty_unit?.order_item?.snapshot_name || svc.warranty_unit?.order_item?.product?.name || 'Unknown Product',
      },
    }));

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching admin warranty services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
