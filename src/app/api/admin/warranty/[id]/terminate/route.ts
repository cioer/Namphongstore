import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Check Admin Auth
    const cookieStore = cookies();
    const sessionId = cookieStore.get('admin_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: sessionId },
    });

    if (!admin || !['ADMIN', 'TECH'].includes(admin.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 2. Parse Body
    const body = await request.json();
    const { reason } = body;

    // 3. Find Warranty Unit
    const warrantyUnit = await prisma.warrantyUnit.findUnique({
      where: { id: params.id },
      include: {
        order_item: {
          include: {
            order: true, // to get user_id
            product: true // for product name in notification
          }
        }
      }
    });

    if (!warrantyUnit) {
      return NextResponse.json({ error: 'Warranty unit not found' }, { status: 404 });
    }

    if (warrantyUnit.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Only ACTIVE warranties can be terminated' }, { status: 400 });
    }

    const userId = warrantyUnit.order_item.order.user_id;

    // 4. Transaction: Terminate Warranty + Create Notification + Log
    const result = await prisma.$transaction(async (tx) => {
      // Update Warranty
      const updatedWarranty = await tx.warrantyUnit.update({
        where: { id: params.id },
        data: {
          status: 'VOIDED',
          end_date: new Date(), // End immediately
        }
      });

      // Create Notification if user exists
      if (userId) {
        await tx.notification.create({
          data: {
            user_id: userId,
            title: 'Bảo hành bị chấm dứt',
            message: `Bảo hành cho sản phẩm "${warrantyUnit.order_item.product.name}" (Mã: ${warrantyUnit.warranty_code_auto}) đã bị chấm dứt. Lý do: ${reason || 'Vi phạm chính sách bảo hành'}`,
            type: 'WARRANTY',
            link: `/orders/${warrantyUnit.order_item.order_id}`,
          }
        });
      }

      // Create Event Log
      await tx.eventLog.create({
        data: {
          order_id: warrantyUnit.order_item.order_id,
          user_id: admin.id,
          event_type: 'WARRANTY_VOIDED',
          metadata: {
            warranty_id: warrantyUnit.id,
            reason: reason,
            voided_by: admin.full_name
          }
        }
      });

      return updatedWarranty;
    });

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('Error terminating warranty:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
