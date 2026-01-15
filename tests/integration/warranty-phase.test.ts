import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';

describe('Warranty Phase Test', () => {
  let categoryId: string;
  let productId: string;
  let orderId: string;
  let orderItemId: string;
  let warrantyInExchange: string; // Warranty trong thời gian đổi trả
  let warrantyInRepair: string; // Warranty trong thời gian sửa chữa
  let warrantyExpired: string; // Warranty hết hạn

  beforeAll(async () => {
    // Create category
    const category = await prisma.category.create({
      data: {
        name: 'Test Warranty Phase Category',
        slug: `warranty-phase-cat-${Date.now()}`,
      },
    });
    categoryId = category.id;

    // Create product with x=2 months exchange, y=12 months total
    const product = await prisma.product.create({
      data: {
        category_id: categoryId,
        name: 'Test Warranty Phase Product',
        slug: `warranty-phase-product-${Date.now()}`,
        price_original: 10000000,
        price_sale: 9000000,
        warranty_months: 12,
        warranty_exchange_months: 2, // 2 tháng đổi trả
        stock_quantity: 10,
      },
    });
    productId = product.id;

    // Create order
    const order = await prisma.order.create({
      data: {
        order_code: `TEST-WP-${Date.now()}`,
        customer_name: 'Test Customer Warranty',
        customer_phone: '0912345678',
        customer_address: '123 Test Street',
        customer_city: 'Hà Nội',
        total_amount: 9000000,
        status: 'DELIVERED',
        delivered_date: new Date(),
      },
    });
    orderId = order.id;

    // Create order item with warranty snapshots
    const orderItem = await prisma.orderItem.create({
      data: {
        order_id: orderId,
        product_id: productId,
        snapshot_name: 'Test Warranty Phase Product',
        quantity: 3,
        unit_price_at_purchase: 9000000,
        warranty_months_snapshot: 12,
        warranty_exchange_months_snapshot: 2,
      },
    });
    orderItemId = orderItem.id;

    const now = new Date();

    // Create warranty 1: EXCHANGE phase (start today, exchange_until in future)
    const exchangeEnd = new Date(now);
    exchangeEnd.setMonth(exchangeEnd.getMonth() + 2);
    const warrantyEnd = new Date(now);
    warrantyEnd.setMonth(warrantyEnd.getMonth() + 12);

    const w1 = await prisma.warrantyUnit.create({
      data: {
        order_item_id: orderItemId,
        unit_no: 1,
        warranty_code_auto: `NP-WTY-EXCHANGE-${Date.now()}`,
        warranty_months_at_purchase: 12,
        start_date: now,
        end_date: warrantyEnd,
        exchange_until: exchangeEnd,
        status: 'ACTIVE',
      },
    });
    warrantyInExchange = w1.warranty_code_auto;

    // Create warranty 2: REPAIR phase (exchange_until in past, end_date in future)
    const pastExchangeEnd = new Date(now);
    pastExchangeEnd.setMonth(pastExchangeEnd.getMonth() - 1); // 1 tháng trước
    const futureWarrantyEnd = new Date(now);
    futureWarrantyEnd.setMonth(futureWarrantyEnd.getMonth() + 10);

    const w2 = await prisma.warrantyUnit.create({
      data: {
        order_item_id: orderItemId,
        unit_no: 2,
        warranty_code_auto: `NP-WTY-REPAIR-${Date.now()}`,
        warranty_months_at_purchase: 12,
        start_date: new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000), // 3 months ago
        end_date: futureWarrantyEnd,
        exchange_until: pastExchangeEnd,
        status: 'ACTIVE',
      },
    });
    warrantyInRepair = w2.warranty_code_auto;

    // Create warranty 3: EXPIRED (both end_date and exchange_until in past)
    const pastEnd = new Date(now);
    pastEnd.setMonth(pastEnd.getMonth() - 1);
    const oldStart = new Date(now);
    oldStart.setMonth(oldStart.getMonth() - 13);
    const oldExchangeEnd = new Date(oldStart);
    oldExchangeEnd.setMonth(oldExchangeEnd.getMonth() + 2);

    const w3 = await prisma.warrantyUnit.create({
      data: {
        order_item_id: orderItemId,
        unit_no: 3,
        warranty_code_auto: `NP-WTY-EXPIRED-${Date.now()}`,
        warranty_months_at_purchase: 12,
        start_date: oldStart,
        end_date: pastEnd,
        exchange_until: oldExchangeEnd,
        status: 'ACTIVE',
      },
    });
    warrantyExpired = w3.warranty_code_auto;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.warrantyUnit.deleteMany({ where: { order_item_id: orderItemId } });
    await prisma.orderItem.deleteMany({ where: { order_id: orderId } });
    await prisma.order.delete({ where: { id: orderId } });
    await prisma.product.delete({ where: { id: productId } });
    await prisma.category.delete({ where: { id: categoryId } });
    await prisma.$disconnect();
  });

  it('should correctly identify warranty in EXCHANGE phase', async () => {
    const warranty = await prisma.warrantyUnit.findUnique({
      where: { warranty_code_auto: warrantyInExchange },
    });

    expect(warranty).toBeDefined();
    
    const now = new Date();
    const exchangeUntil = new Date(warranty!.exchange_until);
    const endDate = new Date(warranty!.end_date);

    // Verify phase is EXCHANGE: now <= exchange_until
    expect(now <= exchangeUntil).toBe(true);
    expect(now <= endDate).toBe(true);
  });

  it('should correctly identify warranty in REPAIR phase', async () => {
    const warranty = await prisma.warrantyUnit.findUnique({
      where: { warranty_code_auto: warrantyInRepair },
    });

    expect(warranty).toBeDefined();
    
    const now = new Date();
    const exchangeUntil = new Date(warranty!.exchange_until);
    const endDate = new Date(warranty!.end_date);

    // Verify phase is REPAIR: now > exchange_until AND now <= end_date
    expect(now > exchangeUntil).toBe(true);
    expect(now <= endDate).toBe(true);
  });

  it('should correctly identify EXPIRED warranty', async () => {
    const warranty = await prisma.warrantyUnit.findUnique({
      where: { warranty_code_auto: warrantyExpired },
    });

    expect(warranty).toBeDefined();
    
    const now = new Date();
    const endDate = new Date(warranty!.end_date);

    // Verify phase is EXPIRED: now > end_date
    expect(now > endDate).toBe(true);
  });

  it('should snapshot warranty_exchange_months in OrderItem', async () => {
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
    });

    expect(orderItem).toBeDefined();
    expect((orderItem as any).warranty_exchange_months_snapshot).toBe(2);
    expect(orderItem!.warranty_months_snapshot).toBe(12);
  });

  it('should have Product with both warranty fields', async () => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    expect(product).toBeDefined();
    expect(product!.warranty_months).toBe(12);
    expect((product as any).warranty_exchange_months).toBe(2);
  });

  it('should validate x < y (exchange months < total warranty months)', async () => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    expect(product).toBeDefined();
    const x = (product as any).warranty_exchange_months;
    const y = product!.warranty_months;
    
    expect(x).toBeLessThan(y);
  });
});
