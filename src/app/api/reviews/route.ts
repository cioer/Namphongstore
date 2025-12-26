import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('product_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    if (!productId) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    // Get reviews for product
    const reviews = await prisma.review.findMany({
      where: { product_id: productId },
      orderBy: [
        { is_verified: 'desc' },
        { helpful_votes: 'desc' },
        { created_at: 'desc' }
      ],
      skip,
      take: limit,
    });

    // Get review stats
    const stats = await prisma.review.aggregate({
      where: { product_id: productId },
      _avg: { rating: true },
      _count: { id: true },
    });

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { product_id: productId },
      _count: { rating: true },
      orderBy: { rating: 'desc' }
    });

    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const found = ratingDistribution.find(item => item.rating === rating);
      return {
        rating,
        count: found?._count.rating || 0
      };
    });

    return NextResponse.json({
      reviews: reviews.map(review => ({
        ...review,
        created_at: review.created_at.toISOString(),
        updated_at: review.updated_at.toISOString(),
      })),
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.id || 0,
      },
      distribution,
      pagination: {
        page,
        limit,
        hasMore: reviews.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Có lỗi khi tải đánh giá' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      product_id, 
      customer_name, 
      customer_phone, 
      rating, 
      comment,
      order_id 
    } = body;

    // Validation
    if (!product_id || !customer_name || !customer_phone || !rating) {
      return NextResponse.json(
        { error: 'product_id, customer_name, customer_phone, and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if customer already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        product_id,
        customer_phone,
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Bạn đã đánh giá sản phẩm này rồi' },
        { status: 400 }
      );
    }

    // Check if review is verified (customer actually bought this product)
    let isVerified = false;
    if (order_id) {
      const order = await prisma.order.findFirst({
        where: {
          id: order_id,
          customer_phone,
          status: 'DELIVERED',
          items: {
            some: {
              product_id
            }
          }
        }
      });
      isVerified = !!order;
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        product_id,
        order_id: order_id || null,
        customer_name,
        customer_phone,
        rating,
        comment: comment || null,
        is_verified: isVerified,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Đánh giá của bạn đã được gửi thành công',
      review: {
        ...review,
        created_at: review.created_at.toISOString(),
        updated_at: review.updated_at.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Có lỗi khi gửi đánh giá' },
      { status: 500 }
    );
  }
}