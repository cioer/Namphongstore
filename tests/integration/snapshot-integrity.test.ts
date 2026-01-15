import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Snapshot Integrity Test', () => {
  let categoryId: string;
  let productId: string;
  let orderId: string;
  let orderItemId: string;
  let warrantyId: string;

  const originalPrice = 1000000;
  const originalWarrantyMonths = 12;

  beforeAll(async () => {
    // Clean existing data - respect FK constraints
    await prisma.returnRequest.deleteMany({});
    await prisma.warrantyUnit.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: 'Test Category Snapshot',
        slug: `test-category-snapshot-${Date.now()}`,
      },
    });
    categoryId = category.id;

    // Create test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product Snapshot',
        slug: `test-product-snapshot-${Date.now()}`,
        brand: 'TestBrand',
        category_id: categoryId,
        price_original: originalPrice,
        price_sale: originalPrice,
        warranty_months: originalWarrantyMonths,
        stock_quantity: 100,
        images: ['https://via.placeholder.com/400'],
        description: 'Test product for snapshot integrity',
      },
    });
    productId = product.id;

    // Create order
    const order = await prisma.order.create({
      data: {
        order_code: `SNAP-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '0900000002',
        customer_address: 'Test Address',
        customer_city: 'Test City',
        customer_email: 'snapshot@example.com',
        status: 'DELIVERED',
        total_amount: originalPrice,
        delivered_date: new Date(),
      },
    });
    orderId = order.id;

    // Create order item with snapshots
    const orderItem = await prisma.orderItem.create({
      data: {
        order_id: orderId,
        product_id: productId,
        snapshot_name: 'Test Product Snapshot',
        quantity: 1,
        unit_price_at_purchase: originalPrice,
        warranty_months_snapshot: originalWarrantyMonths,
      },
    });
    orderItemId = orderItem.id;

    // Create warranty unit with fixed end_date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + originalWarrantyMonths);
    const exchangeUntil = new Date(startDate);
    exchangeUntil.setMonth(exchangeUntil.getMonth() + 1);

    const warranty = await prisma.warrantyUnit.create({
      data: {
        order_item_id: orderItemId,
        unit_no: 1,
        warranty_code_auto: `NP-WTY-SNAP-${Date.now()}`,
        warranty_months_at_purchase: originalWarrantyMonths,
        start_date: startDate,
        end_date: endDate,
        exchange_until: exchangeUntil,
        status: 'ACTIVE',
      },
    });
    warrantyId = warranty.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should preserve OrderItem.unit_price_at_purchase after Product price change', async () => {
    // Get original snapshot
    const originalOrderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
    });

    expect(Number(originalOrderItem?.unit_price_at_purchase)).toBe(originalPrice);

    // Update product price (simulating price change)
    const newPrice = 800000;
    await prisma.product.update({
      where: { id: productId },
      data: {
        price_original: newPrice,
        price_sale: newPrice,
      },
    });

    // Verify OrderItem snapshot is unchanged
    const updatedOrderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
    });

    expect(Number(updatedOrderItem?.unit_price_at_purchase)).toBe(originalPrice);
    expect(updatedOrderItem?.unit_price_at_purchase).not.toBe(newPrice);
  });

  it('should preserve WarrantyUnit.end_date after Product warranty_months change', async () => {
    // Get original warranty end_date
    const originalWarranty = await prisma.warrantyUnit.findUnique({
      where: { id: warrantyId },
    });

    const originalEndDate = originalWarranty?.end_date;
    expect(originalWarranty?.warranty_months_at_purchase).toBe(originalWarrantyMonths);

    // Update product warranty_months (simulating warranty policy change)
    const newWarrantyMonths = 24;
    await prisma.product.update({
      where: { id: productId },
      data: { warranty_months: newWarrantyMonths },
    });

    // Verify WarrantyUnit end_date is unchanged
    const updatedWarranty = await prisma.warrantyUnit.findUnique({
      where: { id: warrantyId },
    });

    expect(updatedWarranty?.end_date).toEqual(originalEndDate);
    expect(updatedWarranty?.warranty_months_at_purchase).toBe(originalWarrantyMonths);
    expect(updatedWarranty?.warranty_months_at_purchase).not.toBe(newWarrantyMonths);
  });

  it('should maintain warranty_months_snapshot integrity', async () => {
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
    });

    const warranty = await prisma.warrantyUnit.findUnique({
      where: { id: warrantyId },
    });

    // Verify snapshot values match between OrderItem and WarrantyUnit
    expect(orderItem?.warranty_months_snapshot).toBe(originalWarrantyMonths);
    expect(warranty?.warranty_months_at_purchase).toBe(originalWarrantyMonths);
    expect(orderItem?.warranty_months_snapshot).toBe(warranty?.warranty_months_at_purchase);
  });
});
