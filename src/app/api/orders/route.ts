import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/services/order.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createOrder(body);

    return NextResponse.json({
      success: true,
      order: {
        id: result.id,
        order_code: result.order_code,
        total_amount: result.total_amount,
        status: result.status,
      },
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra khi tạo đơn hàng' },
      { status: 400 } // Using 400 as most errors from service are validation errors
    );
  }
}
