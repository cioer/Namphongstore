import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Find all ACTIVE warranties that have expired (end_date < now)
    const now = new Date();
    
    const expiredWarranties = await prisma.warrantyUnit.findMany({
      where: {
        status: 'ACTIVE',
        end_date: {
          lt: now
        }
      },
      include: {
        order_item: {
          include: {
            order: true,
            product: true
          }
        }
      },
      take: 100 // Process in batches if high volume
    });

    if (expiredWarranties.length === 0) {
      return NextResponse.json({ message: 'No expired warranties found', count: 0 });
    }

    // 2. Process expiration
    let processedCount = 0;

    for (const warranty of expiredWarranties) {
      await prisma.$transaction(async (tx) => {
        // Update status to EXPIRED
        await tx.warrantyUnit.update({
          where: { id: warranty.id },
          data: { status: 'EXPIRED' }
        });

        // Notify User
        const userId = warranty.order_item.order.user_id;
        if (userId) {
          await tx.notification.create({
            data: {
              user_id: userId,
              title: 'Bảo hành hết hạn',
              message: `Thời hạn bảo hành cho sản phẩm "${warranty.order_item.product.name}" (Mã: ${warranty.warranty_code_auto}) đã kết thúc.`,
              type: 'WARRANTY',
              link: `/orders/${warranty.order_item.order_id}`,
            }
          });
        }

        // Log Event
        if (warranty.order_item.order.user_id) {
            await tx.eventLog.create({
            data: {
                order_id: warranty.order_item.order_id,
                user_id: null, // System action
                event_type: 'WARRANTY_EXPIRED_AUTO',
                metadata: {
                warranty_id: warranty.id,
                expired_date: warranty.end_date,
                processed_at: now
                }
            }
            });
        }
      });
      processedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${processedCount} expired warranties`,
      processed_count: processedCount 
    });

  } catch (error) {
    console.error('Error checking warranty expiry:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
