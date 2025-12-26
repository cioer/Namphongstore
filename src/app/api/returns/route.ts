import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

const RETURN_WINDOW_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, warranty_unit_id, reason, images } = body;

    // Validate required fields
    if (!order_id || !reason) {
      return NextResponse.json(
        { error: 'order_id và reason là bắt buộc' },
        { status: 400 }
      );
    }

    if (reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Lý do phải có ít nhất 10 ký tự' },
        { status: 400 }
      );
    }

    // Validate images
    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng upload ít nhất 1 ảnh' },
        { status: 400 }
      );
    }

    if (images.length > 5) {
      return NextResponse.json(
        { error: 'Tối đa 5 ảnh' },
        { status: 400 }
      );
    }

    // Fetch order to validate
    const order = await prisma.order.findUnique({
      where: { id: order_id },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Đơn hàng không tồn tại' },
        { status: 404 }
      );
    }

    // Check if order is delivered
    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        { error: 'Chỉ có thể đổi trả đơn hàng đã giao' },
        { status: 400 }
      );
    }

    // Check 30-day window
    if (!order.delivered_date) {
      return NextResponse.json(
        { error: 'Đơn hàng chưa có ngày giao hàng' },
        { status: 400 }
      );
    }

    const deliveredDate = new Date(order.delivered_date);
    const now = new Date();
    const daysSinceDelivery = Math.floor(
      (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
      return NextResponse.json(
        { 
          error: `Đã quá thời hạn đổi trả (${RETURN_WINDOW_DAYS} ngày). Đơn hàng đã giao ${daysSinceDelivery} ngày trước.` 
        },
        { status: 400 }
      );
    }

    // Validate warranty unit if provided
    if (warranty_unit_id) {
      const warrantyUnit = await prisma.warrantyUnit.findUnique({
        where: { id: warranty_unit_id },
        include: {
          order_item: true,
        },
      });

      if (!warrantyUnit || warrantyUnit.order_item.order_id !== order_id) {
        return NextResponse.json(
          { error: 'Mã bảo hành không hợp lệ' },
          { status: 400 }
        );
      }

      // Check if this warranty unit already has a pending return request
      const existingPendingReturn = await prisma.returnRequest.findFirst({
        where: {
          warranty_unit_id: warranty_unit_id,
          status: 'PENDING',
        },
      });

      if (existingPendingReturn) {
        return NextResponse.json(
          { error: 'Sản phẩm này đã có yêu cầu đổi trả đang chờ duyệt' },
          { status: 400 }
        );
      }
    }

    // Create return request with event log
    const returnRequest = await prisma.$transaction(async (tx: TransactionClient) => {
      const newReturn = await tx.returnRequest.create({
        data: {
          order_id,
          warranty_unit_id: warranty_unit_id || null,
          reason: reason.trim(),
          images: images,
          status: 'PENDING',
        },
        include: {
          order: true,
          warranty_unit: true,
        },
      });

      // Create event log
      await tx.eventLog.create({
        data: {
          order_id,
          return_request_id: newReturn.id,
          event_type: 'RETURN_CREATED',
          metadata: {
            reason: reason.trim(),
            images_count: images.length,
            warranty_unit_id: warranty_unit_id || null,
          },
        },
      });

      return newReturn;
    });

    return NextResponse.json({
      success: true,
      message: 'Yêu cầu đổi trả đã được gửi',
      return_request: returnRequest,
    });
  } catch (error) {
    console.error('Error creating return request:', error);
    return NextResponse.json(
      { error: 'Có lỗi khi tạo yêu cầu đổi trả' },
      { status: 500 }
    );
  }
}

// GET returns by order_id (for customer)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get('order_id');

    if (!order_id) {
      return NextResponse.json(
        { error: 'order_id là bắt buộc' },
        { status: 400 }
      );
    }

    const returns = await prisma.returnRequest.findMany({
      where: { order_id },
      include: {
        warranty_unit: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json({ returns });
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { error: 'Có lỗi khi tải yêu cầu đổi trả' },
      { status: 500 }
    );
  }
}
