import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, order_value } = body;

    if (!code || !order_value) {
      return NextResponse.json(
        { error: 'Thiếu thông tin mã giảm giá hoặc giá trị đơn hàng' },
        { status: 400 }
      );
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Mã giảm giá không tồn tại' },
        { status: 404 }
      );
    }

    // Check if coupon is active
    if (!coupon.is_active) {
      return NextResponse.json(
        { error: 'Mã giảm giá đã bị vô hiệu hóa' },
        { status: 400 }
      );
    }

    // Check validity period
    const now = new Date();
    if (now < coupon.valid_from || now > coupon.valid_until) {
      return NextResponse.json(
        { error: 'Mã giảm giá đã hết hạn hoặc chưa có hiệu lực' },
        { status: 400 }
      );
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json(
        { error: 'Mã giảm giá đã hết lượt sử dụng' },
        { status: 400 }
      );
    }

    // Check minimum order value
    const orderValue = parseFloat(order_value);
    if (coupon.min_order_value && orderValue < parseFloat(coupon.min_order_value.toString())) {
      return NextResponse.json(
        { error: `Đơn hàng tối thiểu ${coupon.min_order_value} để áp dụng mã này` },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'fixed') {
      discountAmount = parseFloat(coupon.discount_value.toString());
    } else if (coupon.discount_type === 'percentage') {
      discountAmount = (orderValue * parseFloat(coupon.discount_value.toString())) / 100;
      
      // Apply max discount limit for percentage type
      if (coupon.max_discount) {
        const maxDiscount = parseFloat(coupon.max_discount.toString());
        discountAmount = Math.min(discountAmount, maxDiscount);
      }
    }

    // Ensure discount doesn't exceed order value
    discountAmount = Math.min(discountAmount, orderValue);

    return NextResponse.json({
      success: true,
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value.toString(),
      },
      discount_amount: Math.round(discountAmount),
      final_amount: Math.round(orderValue - discountAmount),
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Có lỗi khi kiểm tra mã giảm giá' },
      { status: 500 }
    );
  }
}