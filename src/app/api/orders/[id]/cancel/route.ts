import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Vui lòng nhập lý do hủy đơn (tối thiểu 10 ký tự)' },
        { status: 400 }
      );
    }

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    // Check if order can be cancelled (only NEW or CONFIRMED)
    if (order.status !== 'NEW' && order.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Chỉ có thể hủy đơn hàng ở trạng thái Mới hoặc Đã xác nhận' },
        { status: 400 }
      );
    }

    // Update order status to CANCELLED_BY_CUSTOMER
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED_BY_CUSTOMER',
        cancel_reason: reason.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi hủy đơn hàng' },
      { status: 500 }
    );
  }
}
