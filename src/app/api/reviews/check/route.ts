import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    // Check authentication
    const sessionId = request.cookies.get('customer_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({
        canReview: false,
        reason: 'NOT_LOGGED_IN',
        message: 'Vui lòng đăng nhập để đánh giá sản phẩm'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
    });

    if (!user) {
      return NextResponse.json({
        canReview: false,
        reason: 'INVALID_SESSION',
        message: 'Phiên đăng nhập không hợp lệ'
      });
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        product_id: productId,
        customer_phone: user.phone || '',
      }
    });

    if (existingReview) {
      return NextResponse.json({
        canReview: false,
        reason: 'ALREADY_REVIEWED',
        message: 'Bạn đã đánh giá sản phẩm này rồi'
      });
    }

    // Check if purchased this product
    const order = await prisma.order.findFirst({
      where: {
        user_id: user.id,
        status: 'DELIVERED',
        items: {
          some: {
            product_id: productId
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({
        canReview: false,
        reason: 'NOT_PURCHASED',
        message: 'Bạn chưa mua sản phẩm này. Hãy mua và trải nghiệm để đánh giá nhé!'
      });
    }

    // Can review
    return NextResponse.json({
      canReview: true,
      reason: 'OK',
      message: 'Bạn có thể đánh giá sản phẩm này'
    });

  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return NextResponse.json(
      { error: 'Có lỗi khi kiểm tra quyền đánh giá' },
      { status: 500 }
    );
  }
}
