import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check auth
    const sessionId = request.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
    });

    if (!user || !['ADMIN', 'SALES', 'TECH'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { admin_note } = body;

    // Fetch return request
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: params.id },
      include: {
        order: true,
        warranty_unit: {
          include: {
            order_item: true,
          },
        },
      },
    });

    if (!returnRequest) {
      return NextResponse.json(
        { error: 'Yêu cầu đổi trả không tồn tại' },
        { status: 404 }
      );
    }

    if (returnRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Yêu cầu đã được xử lý trước đó' },
        { status: 400 }
      );
    }

    // Approve return request and create replacement order
    const updated = await prisma.$transaction(async (tx: TransactionClient) => {
      const updatedReturn = await tx.returnRequest.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          admin_note: admin_note?.trim() || null,
        },
      });

      // Create replacement order with same product for customer
      const originalOrder = returnRequest.order;
      const warrantyUnit = returnRequest.warranty_unit;
      
      if (warrantyUnit && warrantyUnit.order_item) {
        // Generate unique replacement order code
        // Keep original code structure adding suffix for tracking
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const order_code = `${originalOrder.order_code}-DT${randomSuffix}`;

        // Get product information for replacement
        const product = await tx.product.findUnique({
          where: { id: warrantyUnit.order_item.product_id },
        });

        if (product && product.is_active) {
          // Create replacement order
          const replacementOrder = await tx.order.create({
            data: {
              order_code,
              customer_name: originalOrder.customer_name,
              customer_phone: originalOrder.customer_phone,
              customer_email: originalOrder.customer_email,
              customer_address: originalOrder.customer_address,
              customer_ward: originalOrder.customer_ward,
              customer_district: originalOrder.customer_district,
              customer_city: originalOrder.customer_city,
              notes: `Đơn hàng thay thế cho yêu cầu đổi trả #${returnRequest.id}`,
              status: 'NEW',
              total_amount: Number(product.price_sale),
              items: {
                create: [{
                  product_id: product.id,
                  snapshot_name: product.name,
                  quantity: 1, // Replace with 1 unit
                  unit_price_at_purchase: Number(product.price_sale),
                  promo_snapshot: undefined, // No promo for replacement
                  warranty_months_snapshot: product.warranty_months,
                }],
              },
            },
          });

          // Update return request with replacement order info
          await tx.returnRequest.update({
            where: { id: params.id },
            data: {
              admin_note: (admin_note?.trim() || '') + 
                `${admin_note?.trim() ? '\n' : ''}Đã tạo đơn hàng thay thế: ${order_code}`,
            },
          });

          // Log replacement order creation
          await tx.eventLog.create({
            data: {
              order_id: replacementOrder.id,
              return_request_id: params.id,
              user_id: user.id,
              event_type: 'REPLACEMENT_ORDER_CREATED',
              metadata: {
                original_order_id: originalOrder.id,
                replacement_order_code: order_code,
                product_id: product.id,
                product_name: product.name,
              },
            },
          });
        }
      }

      await tx.eventLog.create({
        data: {
          order_id: returnRequest.order_id,
          return_request_id: params.id,
          user_id: user.id,
          event_type: 'RETURN_APPROVED',
          metadata: {
            admin_note: admin_note?.trim() || null,
          },
        },
      });

      return updatedReturn;
    });

    return NextResponse.json({
      success: true,
      message: 'Đã duyệt yêu cầu đổi trả và tạo đơn hàng thay thế',
      return_request: updated,
    });
  } catch (error) {
    console.error('Error approving return:', error);
    return NextResponse.json(
      { error: 'Có lỗi khi duyệt yêu cầu' },
      { status: 500 }
    );
  }
}
