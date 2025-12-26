import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // In a real app, we should check authentication here
    // For now, we assume middleware handles it or we skip for simplicity in this context
    
    const coupons = await prisma.coupon.findMany({
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Get coupons error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách mã giảm giá' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      name,
      description,
      discount_type,
      discount_value,
      min_order_value,
      max_discount,
      usage_limit,
      valid_from,
      valid_until,
      is_active
    } = body;

    if (!code || !name || !discount_type || !discount_value || !valid_from || !valid_until) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const existingCoupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Mã giảm giá đã tồn tại' },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        name,
        description,
        discount_type,
        discount_value,
        min_order_value,
        max_discount,
        usage_limit,
        valid_from: new Date(valid_from),
        valid_until: new Date(valid_until),
        is_active: is_active ?? true,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo mã giảm giá' },
      { status: 500 }
    );
  }
}
