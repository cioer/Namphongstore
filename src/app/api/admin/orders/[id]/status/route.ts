import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// Status transition rules
const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ['CONFIRMED', 'CANCELLED_BY_SHOP'],
  CONFIRMED: ['SHIPPING', 'CANCELLED_BY_SHOP'],
  SHIPPING: ['DELIVERED', 'CANCELLED_BY_SHOP'],
  DELIVERED: [], // No transitions from DELIVERED
  CANCELLED_BY_CUSTOMER: [],
  CANCELLED_BY_SHOP: [],
};

import { generateWarrantyCode } from '@/lib/utils';

// Using centralized warranty code generator from utils

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check auth
    const sessionId = request.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
    });

    if (!user || !['ADMIN', 'SALES', 'TECH'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { new_status, note } = body;

    if (!new_status) {
      return NextResponse.json(
        { error: 'new_status là bắt buộc' },
        { status: 400 }
      );
    }

    // Fetch current order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            warranty_units: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Đơn hàng không tồn tại' }, { status: 404 });
    }

    // Validate transition
    const allowedTransitions = VALID_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(new_status)) {
      return NextResponse.json(
        { 
          error: `Không thể chuyển từ ${order.status} sang ${new_status}` 
        },
        { status: 400 }
      );
    }

    // Handle DELIVERED status with warranty generation
    if (new_status === 'DELIVERED') {
      // Check idempotency - if already delivered, do nothing
      if (order.status === 'DELIVERED') {
        return NextResponse.json({
          message: 'Đơn hàng đã được giao trước đó',
          order,
        });
      }

      // Use transaction for atomicity
      const result = await prisma.$transaction(async (tx: TransactionClient) => {
        const deliveredDate = new Date();

        // Update order status
        const updatedOrder = await tx.order.update({
          where: { id: params.id },
          data: {
            status: 'DELIVERED',
            delivered_date: deliveredDate,
          },
        });

        // Generate warranty units for each order item
        const warrantyUnitsToCreate: any[] = [];
        let totalCodes = 0;

        for (const item of order.items) {
          // Check if warranty units already exist (idempotency check)
          const existingUnits = item.warranty_units.length;
          if (existingUnits > 0) {
            console.log(`Warranty units already exist for item ${item.id}, skipping...`);
            continue;
          }

          // Create warranty units for each unit (1..quantity)
          for (let unitNo = 1; unitNo <= item.quantity; unitNo++) {
            const warrantyCode = generateWarrantyCode();
            const endDate = new Date(deliveredDate);
            endDate.setMonth(endDate.getMonth() + item.warranty_months_snapshot);

            warrantyUnitsToCreate.push({
              order_item_id: item.id,
              unit_no: unitNo,
              warranty_code_auto: warrantyCode,
              warranty_months_at_purchase: item.warranty_months_snapshot,
              start_date: deliveredDate,
              end_date: endDate,
              status: 'ACTIVE',
            });

            totalCodes++;
          }
        }

        // Batch create warranty units
        if (warrantyUnitsToCreate.length > 0) {
          await tx.warrantyUnit.createMany({
            data: warrantyUnitsToCreate,
          });
        }

        // Create event logs
        await tx.eventLog.create({
          data: {
            order_id: params.id,
            user_id: user.id,
            event_type: 'ORDER_STATUS_CHANGED',
            metadata: {
              from: order.status,
              to: 'DELIVERED',
              note: note || null,
            },
          },
        });

        await tx.eventLog.create({
          data: {
            order_id: params.id,
            user_id: user.id,
            event_type: 'ORDER_DELIVERED_CONFIRMED',
            metadata: {
              delivered_date: deliveredDate.toISOString(),
            },
          },
        });

        if (totalCodes > 0) {
          await tx.eventLog.create({
            data: {
              order_id: params.id,
              user_id: user.id,
              event_type: 'WARRANTY_CODES_GENERATED',
              metadata: {
                total_codes: totalCodes,
              },
            },
          });
        }

        return updatedOrder;
      });

      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật trạng thái và tạo mã bảo hành',
        order: result,
      });
    }

    // Handle other status transitions (non-DELIVERED)
    const updatedOrder = await prisma.$transaction(async (tx: TransactionClient) => {
      const updated = await tx.order.update({
        where: { id: params.id },
        data: { status: new_status },
      });

      await tx.eventLog.create({
        data: {
          order_id: params.id,
          user_id: user.id,
          event_type: 'ORDER_STATUS_CHANGED',
          metadata: {
            from: order.status,
            to: new_status,
            note: note || null,
          },
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật trạng thái đơn hàng',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Có lỗi khi cập nhật trạng thái' },
      { status: 500 }
    );
  }
}
