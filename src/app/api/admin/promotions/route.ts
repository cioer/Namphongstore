import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const sessionId = request.cookies.get('admin_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
    });

    if (!user || !['ADMIN', 'SALES'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all coupons
    const coupons = await prisma.coupon.findMany({
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      coupons: coupons.map(coupon => ({
        ...coupon,
        discount_value: coupon.discount_value.toString(),
        min_order_value: coupon.min_order_value?.toString() || null,
        max_discount: coupon.max_discount?.toString() || null,
        valid_from: coupon.valid_from.toISOString(),
        valid_until: coupon.valid_until.toISOString(),
        created_at: coupon.created_at.toISOString(),
        updated_at: coupon.updated_at.toISOString(),
      })),
    });

  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Có lỗi khi tải danh sách mã giảm giá' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const sessionId = request.cookies.get('admin_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
    });

    if (!user || !['ADMIN', 'SALES'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
      valid_until
    } = body;

    // Validation
    if (!code || !name || !discount_type || !discount_value || !valid_from || !valid_until) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    if (!['percentage', 'fixed'].includes(discount_type)) {
      return NextResponse.json(
        { error: 'Loại giảm giá không hợp lệ' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Mã giảm giá đã tồn tại' },
        { status: 400 }
      );
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        name,
        description: description || null,
        discount_type,
        discount_value: parseFloat(discount_value),
        min_order_value: min_order_value ? parseFloat(min_order_value) : null,
        max_discount: max_discount ? parseFloat(max_discount) : null,
        usage_limit: usage_limit || null,
        valid_from: new Date(valid_from),
        valid_until: new Date(valid_until),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tạo mã giảm giá thành công',
      coupon: {
        ...coupon,
        discount_value: coupon.discount_value.toString(),
        min_order_value: coupon.min_order_value?.toString() || null,
        max_discount: coupon.max_discount?.toString() || null,
        valid_from: coupon.valid_from.toISOString(),
        valid_until: coupon.valid_until.toISOString(),
        created_at: coupon.created_at.toISOString(),
        updated_at: coupon.updated_at.toISOString(),
      },
    });

  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'Có lỗi khi tạo mã giảm giá' },
      { status: 500 }
    );
  }
}