import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateWarrantyCode } from '@/lib/utils';

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// Using centralized warranty code generator from utils

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check auth - TECH role required
    const sessionId = request.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
    });

    if (!user || !['ADMIN', 'TECH'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Chỉ kỹ thuật viên mới có thể hoàn tất thay thế' },
        { status: 403 }
      );
    }

    // Fetch return request
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: params.id },
      include: {
        order: true,
        warranty_unit: {
          include: {
            order_item: true,
          },
        },
      },
    });

    if (!returnRequest) {
      return NextResponse.json(
        { error: 'Yêu cầu đổi trả không tồn tại' },
        { status: 404 }
      );
    }

    if (returnRequest.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Yêu cầu phải được duyệt trước khi hoàn tất' },
        { status: 400 }
      );
    }

    if (!returnRequest.warranty_unit_id) {
      return NextResponse.json(
        { error: 'Yêu cầu không có mã bảo hành liên kết' },
        { status: 400 }
      );
    }

    const oldWarrantyUnit = returnRequest.warranty_unit;
    if (!oldWarrantyUnit) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin bảo hành' },
        { status: 404 }
      );
    }

    // Complete replacement with new warranty creation
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Create new warranty unit
      const newWarrantyCode = generateWarrantyCode();
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + oldWarrantyUnit.warranty_months_at_purchase);

      const newWarrantyUnit = await tx.warrantyUnit.create({
        data: {
          order_item_id: oldWarrantyUnit.order_item_id,
          unit_no: oldWarrantyUnit.unit_no, // Keep same unit number
          warranty_code_auto: newWarrantyCode,
          warranty_months_at_purchase: oldWarrantyUnit.warranty_months_at_purchase,
          start_date: now,
          end_date: endDate,
          status: 'ACTIVE',
        },
      });

      // Update old warranty unit to link to new one
      await tx.warrantyUnit.update({
        where: { id: oldWarrantyUnit.id },
        data: {
          status: 'REPLACED',
          replaced_by: newWarrantyUnit.id,
        },
      });

      // Mark return request as completed
      const completedReturn = await tx.returnRequest.update({
        where: { id: params.id },
        data: {
          status: 'COMPLETED',
        },
      });

      // Create event logs
      await tx.eventLog.create({
        data: {
          order_id: returnRequest.order_id,
          return_request_id: params.id,
          user_id: user.id,
          event_type: 'RETURN_COMPLETED',
          metadata: {
            old_warranty_id: oldWarrantyUnit.id,
            new_warranty_id: newWarrantyUnit.id,
          },
        },
      });

      await tx.eventLog.create({
        data: {
          order_id: returnRequest.order_id,
          return_request_id: params.id,
          user_id: user.id,
          event_type: 'WARRANTY_REPLACED',
          metadata: {
            old_warranty_code: oldWarrantyUnit.warranty_code_auto,
            new_warranty_code: newWarrantyUnit.warranty_code_auto,
            warranty_unit_no: oldWarrantyUnit.unit_no,
          },
        },
      });

      await tx.eventLog.create({
        data: {
          order_id: returnRequest.order_id,
          return_request_id: params.id,
          user_id: user.id,
          event_type: 'WARRANTY_NEW_CREATED_FROM_REPLACEMENT',
          metadata: {
            new_warranty_code: newWarrantyUnit.warranty_code_auto,
            warranty_months: newWarrantyUnit.warranty_months_at_purchase,
            start_date: newWarrantyUnit.start_date.toISOString(),
            end_date: newWarrantyUnit.end_date.toISOString(),
          },
        },
      });

      return {
        return_request: completedReturn,
        old_warranty: oldWarrantyUnit,
        new_warranty: newWarrantyUnit,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Đã hoàn tất thay thế sản phẩm',
      ...result,
    });
  } catch (error) {
    console.error('Error completing replacement:', error);
    return NextResponse.json(
      { error: 'Có lỗi khi hoàn tất thay thế' },
      { status: 500 }
    );
  }
}
