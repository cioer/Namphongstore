import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

export const createOrder = async (data: any) => {
  const {
    customer_name,
    customer_phone,
    customer_email,
    customer_address,
    customer_ward,
    customer_district,
    customer_city,
    notes,
    items,
    coupon_code,
    userId
  } = data;

  // Validate required fields
  if (!customer_name || !customer_phone || !customer_address || !customer_city) {
    throw new Error('Thiếu thông tin bắt buộc');
  }

  if (!items || items.length === 0) {
    throw new Error('Giỏ hàng trống');
  }

  // Validate phone format
  const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
  if (!phoneRegex.test(customer_phone)) {
    throw new Error('Số điện thoại không hợp lệ');
  }

  // Generate unique order code
  const timestamp = Date.now().toString().slice(-8);
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const order_code = `NP${timestamp}${randomSuffix}`;

  // Fetch products to create snapshots
  const productIds = items.map((item: any) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      is_active: true,
    },
  });

  if (products.length !== items.length) {
    throw new Error('Một số sản phẩm không tồn tại hoặc đã ngưng bán');
  }

  // Calculate total and prepare order items
  let subTotal = 0;
  const orderItemsData = items.map((item: any) => {
    const product = products.find((p: typeof products[number]) => p.id === item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }

    const unitPrice = Number(product.price_sale);
    subTotal += unitPrice * item.quantity;

    // Create promo snapshot if there's an active discount
    const now = new Date();
    const hasPromo = product.discount_percent > 0 &&
      product.promo_start &&
      product.promo_end &&
      now >= new Date(product.promo_start) &&
      now <= new Date(product.promo_end);

    const promoSnapshot = hasPromo ? {
      discount_percent: product.discount_percent,
      promo_start: product.promo_start,
      promo_end: product.promo_end,
      price_original: Number(product.price_original),
    } : null;

    return {
      product_id: product.id,
      snapshot_name: product.name,
      quantity: item.quantity,
      unit_price_at_purchase: unitPrice,
      promo_snapshot: promoSnapshot,
      warranty_months_snapshot: product.warranty_months,
    };
  });

  // Handle Coupon
  let discountAmount = 0;
  let couponId = null;

  if (coupon_code) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: coupon_code },
    });

    if (!coupon) {
      throw new Error('Mã giảm giá không tồn tại');
    }

    if (!coupon.is_active) {
      throw new Error('Mã giảm giá đã bị vô hiệu hóa');
    }

    const now = dayjs();
    if (now.isBefore(dayjs(coupon.valid_from)) || now.isAfter(dayjs(coupon.valid_until))) {
      throw new Error('Mã giảm giá không trong thời gian hiệu lực');
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      throw new Error('Mã giảm giá đã hết lượt sử dụng');
    }

    if (coupon.min_order_value && subTotal < Number(coupon.min_order_value)) {
      throw new Error('Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã');
    }

    // Check if user has already used this coupon
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
        throw new Error('Bạn đã sử dụng mã giảm giá này rồi');
      }
    }

    // Calculate discount
    if (coupon.discount_type === 'percentage') {
      discountAmount = (subTotal * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount) {
        discountAmount = Math.min(discountAmount, Number(coupon.max_discount));
      }
    } else {
      discountAmount = Number(coupon.discount_value);
    }

    discountAmount = Math.min(discountAmount, subTotal);
    couponId = coupon.id;
  }

  const finalTotal = subTotal - discountAmount;

  // Create order in transaction
  return await prisma.$transaction(async (tx) => {
    // Create Order
    const order = await tx.order.create({
      data: {
        order_code,
        user_id: userId || null,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        customer_ward,
        customer_district,
        customer_city,
        notes,
        status: 'NEW',
        total_amount: finalTotal,
        coupon_code: coupon_code || null,
        discount_amount: discountAmount,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // If coupon used, update usage
    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { used_count: { increment: 1 } },
      });

      // If we had userId, we would create CouponUsage here
      if (userId) {
        await tx.couponUsage.create({
          data: {
            coupon_id: couponId,
            user_id: userId,
            order_id: order.id,
          }
        });
      }
    }

    return order;
  });
};

export const getAllOrders = async () => {
  const orders = await prisma.order.findMany({
    include: {
      items: {
        select: {
          quantity: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  // Sort orders by status priority: NEW -> CONFIRMED -> SHIPPING -> DELIVERED -> CANCELLED
  const statusPriority: Record<string, number> = {
    'NEW': 1,
    'CONFIRMED': 2,
    'SHIPPING': 3,
    'DELIVERED': 4,
    'CANCELLED_BY_CUSTOMER': 5,
    'CANCELLED_BY_SHOP': 6,
  };

  return orders.sort((a, b) => {
    const priorityA = statusPriority[a.status] || 999;
    const priorityB = statusPriority[b.status] || 999;
    
    // First sort by status priority
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same status, sort by created_at (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};
