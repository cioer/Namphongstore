import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if code exists for other coupon
    if (code) {
      const existingCoupon = await prisma.coupon.findFirst({
        where: {
          code,
          id: { not: params.id },
        },
      });

      if (existingCoupon) {
        return NextResponse.json(
          { error: 'Mã giảm giá đã tồn tại' },
          { status: 400 }
        );
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: {
        code,
        name,
        description,
        discount_type,
        discount_value,
        min_order_value,
        max_discount,
        usage_limit,
        valid_from: valid_from ? new Date(valid_from) : undefined,
        valid_until: valid_until ? new Date(valid_until) : undefined,
        is_active,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Update coupon error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật mã giảm giá' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.coupon.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa mã giảm giá' },
      { status: 500 }
    );
  }
}
