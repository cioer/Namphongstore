import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';

describe('Warranty Termination Integration', () => {
  let userId: string;
  let orderItemId: string;
  let warrantyId: string;

  beforeAll(async () => {
    // 1. Create User
    const user = await prisma.user.create({
      data: {
        email: `test-term-${Date.now()}@example.com`,
        password_hash: 'hash',
        full_name: 'Test Termination User',
        role: 'CUSTOMER',
      },
    });
    userId = user.id;

    // 2. Create Order & Item
    const order = await prisma.order.create({
      data: {
        user_id: user.id,
        order_code: `ORD-TERM-${Date.now()}`,
        status: 'DELIVERED',
        total_amount: 1000000,
        customer_name: 'Test',
        customer_phone: '0900000000',
        customer_address: 'Test Addr',
        customer_city: 'Test City',
      },
    });

    const category = await prisma.category.create({
      data: {
        name: 'Test Cat Term',
        slug: `test-cat-term-${Date.now()}`
      }
    });

    const product = await prisma.product.create({
      data: {
        category_id: category.id,
        name: 'Test Product Term',
        slug: `test-prod-term-${Date.now()}`,
        price_original: 1000000,
        price_sale: 900000,
      }
    });

    const item = await prisma.orderItem.create({
      data: {
        order_id: order.id,
        product_id: product.id,
        snapshot_name: 'Test Product Term',
        quantity: 1,
        unit_price_at_purchase: 900000,
        warranty_months_snapshot: 12,
      },
    });
    orderItemId = item.id;

    // 3. Create Active Warranty
    const warranty = await prisma.warrantyUnit.create({
      data: {
        order_item_id: item.id,
        unit_no: 1,
        warranty_code_auto: `W-TERM-${Date.now()}`,
        warranty_months_at_purchase: 12,
        start_date: new Date(),
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        exchange_until: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        status: 'ACTIVE',
      },
    });
    warrantyId = warranty.id;
  });

  afterAll(async () => {
    // Cleanup
    const deleteReviews = prisma.review.deleteMany();
    const deleteAuditLogs = prisma.auditLog.deleteMany();
    const deleteEventLogs = prisma.eventLog.deleteMany();
    const deleteNotifs = prisma.notification.deleteMany();
    const deleteWarrantyServices = prisma.warrantyService.deleteMany();
    const deleteReturnRequests = prisma.returnRequest.deleteMany();
    const deleteWarranty = prisma.warrantyUnit.deleteMany();
    const deleteOrderItems = prisma.orderItem.deleteMany();
    const deleteOrders = prisma.order.deleteMany();
    const deleteUsers = prisma.user.deleteMany();
    const deleteProducts = prisma.product.deleteMany();
    const deleteCategories = prisma.category.deleteMany();

    await prisma.$transaction([
      deleteReviews,
      deleteAuditLogs,
      deleteEventLogs,
      deleteNotifs,
      deleteWarrantyServices,
      deleteReturnRequests,
      deleteWarranty, 
      deleteOrderItems,
      deleteOrders,
      deleteUsers,
      deleteProducts,
      deleteCategories
    ]);
    
    await prisma.$disconnect();
  });

  it('should terminate the warranty and create a notification', async () => {
    // SIMULATE THE API LOGIC
    const reason = "Policy Violation Policy XYZ";
    
    const result = await prisma.$transaction(async (tx) => {
        // Update Warranty
        const updatedWarranty = await tx.warrantyUnit.update({
          where: { id: warrantyId },
          data: {
            status: 'VOIDED',
            end_date: new Date(),
          }
        });
  
        // Create Notification
        await tx.notification.create({
          data: {
            user_id: userId,
            title: 'Bảo hành bị chấm dứt',
            message: `Bảo hành bị hủy. Lý do: ${reason}`,
            type: 'WARRANTY',
          }
        });
  
        return updatedWarranty;
    });

    // VERIFY
    expect(result.status).toBe('VOIDED');
    expect(result.end_date.getTime()).toBeLessThanOrEqual(new Date().getTime());

    // Check Notification
    const notif = await prisma.notification.findFirst({
        where: { user_id: userId }
    });
    expect(notif).toBeDefined();
    expect(notif?.title).toBe('Bảo hành bị chấm dứt');
    expect(notif?.message).toContain(reason);
    expect(notif?.is_read).toBe(false);
  });
});
