import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, totalAmount, userId } = body;

    if (!code) {
      return NextResponse.json(
        { valid: false, message: 'Vui lòng nhập mã giảm giá' },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return NextResponse.json(
        { valid: false, message: 'Mã giảm giá không tồn tại' },
        { status: 404 }
      );
    }

    if (!coupon.is_active) {
      return NextResponse.json(
        { valid: false, message: 'Mã giảm giá đã bị vô hiệu hóa' },
        { status: 400 }
      );
    }

    const now = dayjs();
    if (now.isBefore(dayjs(coupon.valid_from))) {
      return NextResponse.json(
        { valid: false, message: 'Mã giảm giá chưa có hiệu lực' },
        { status: 400 }
      );
    }

    if (now.isAfter(dayjs(coupon.valid_until))) {
      return NextResponse.json(
        { valid: false, message: 'Mã giảm giá đã hết hạn' },
        { status: 400 }
      );
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json(
        { valid: false, message: 'Mã giảm giá đã hết lượt sử dụng' },
        { status: 400 }
      );
    }

    if (coupon.min_order_value && totalAmount < Number(coupon.min_order_value)) {
      return NextResponse.json(
        { 
          valid: false, 
          message: `Đơn hàng tối thiểu để áp dụng mã là ${Number(coupon.min_order_value).toLocaleString('vi-VN')}đ` 
        },
        { status: 400 }
      );
    }

    // Check user usage limit
    if (userId) {
      const usage = await prisma.couponUsage.findUnique({
        where: {
          coupon_id_user_id: {
            coupon_id: coupon.id,
            user_id: userId,
          },
        },
      });

      if (usage) {
        return NextResponse.json(
          { valid: false, message: 'Bạn đã sử dụng mã giảm giá này rồi' },
          { status: 400 }
        );
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (totalAmount * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount) {
        discount = Math.min(discount, Number(coupon.max_discount));
      }
    } else {
      discount = Number(coupon.discount_value);
    }

    // Ensure discount doesn't exceed total amount
    discount = Math.min(discount, totalAmount);

    return NextResponse.json({
      valid: true,
      discount: discount,
      couponCode: coupon.code,
      message: 'Áp dụng mã giảm giá thành công',
    });

  } catch (error) {
    console.error('Check coupon error:', error);
    return NextResponse.json(
      { valid: false, message: 'Có lỗi xảy ra khi kiểm tra mã' },
      { status: 500 }
    );
  }
}
