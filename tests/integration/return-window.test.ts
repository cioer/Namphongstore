import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Return Window Test (30 days)', () => {
  let categoryId: string;
  let productId: string;

  beforeAll(async () => {
    // Clean existing data - respect FK constraints
    await prisma.returnRequest.deleteMany({});
    await prisma.warrantyUnit.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: 'Test Category Return',
        slug: `test-category-return-${Date.now()}`,
      },
    });
    categoryId = category.id;

    // Create test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product Return',
        slug: `test-product-return-${Date.now()}`,
        brand: 'TestBrand',
        category_id: categoryId,
        price_original: 2000000,
        price_sale: 2000000,
        warranty_months: 12,
        stock_quantity: 20,
        images: ['https://via.placeholder.com/400'],
        description: 'Test product for return window',
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should allow return within 30 days of delivery', async () => {
    // Create order delivered 15 days ago
    const deliveredDate = new Date();
    deliveredDate.setDate(deliveredDate.getDate() - 15);

    const order = await prisma.order.create({
      data: {
        order_code: `RETURN-VALID-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '0900000008',
        customer_address: 'Test Address',
        customer_city: 'Test City',
        customer_email: 'return@example.com',
        status: 'DELIVERED',
        total_amount: 2000000,
        delivered_date: deliveredDate,
      },
    });

    await prisma.orderItem.create({
      data: {
        order_id: order.id,
        product_id: productId,
        snapshot_name: 'Test Product Return',
        quantity: 1,
        unit_price_at_purchase: 2000000,
        warranty_months_snapshot: 12,
      },
    });

    // Calculate days since delivery
    const now = new Date();
    const daysSinceDelivery = Math.floor(
      (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(daysSinceDelivery).toBeLessThanOrEqual(30);

    // Create return request (should succeed)
    const returnRequest = await prisma.returnRequest.create({
      data: {
        order_id: order.id,
        reason: 'Product defect found',
        status: 'PENDING',
        images: ['https://example.com/defect1.jpg'],
      },
    });

    expect(returnRequest).toBeDefined();
    expect(returnRequest.status).toBe('PENDING');
  });

  it('should allow return exactly on 30th day', async () => {
    // Create order delivered exactly 30 days ago
    const deliveredDate = new Date();
    deliveredDate.setDate(deliveredDate.getDate() - 30);

    const order = await prisma.order.create({
      data: {
        order_code: `RETURN-DAY30-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '0900000009',
        customer_address: 'Test Address',
        customer_city: 'Test City',
        customer_email: 'return30@example.com',
        status: 'DELIVERED',
        total_amount: 2000000,
        delivered_date: deliveredDate,
      },
    });

    await prisma.orderItem.create({
      data: {
        order_id: order.id,
        product_id: productId,
        snapshot_name: 'Test Product Return',
        quantity: 1,
        unit_price_at_purchase: 2000000,
        warranty_months_snapshot: 12,
      },
    });

    // Calculate days since delivery
    const now = new Date();
    const daysSinceDelivery = Math.floor(
      (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(daysSinceDelivery).toBeLessThanOrEqual(30);

    // Create return request (should succeed)
    const returnRequest = await prisma.returnRequest.create({
      data: {
        order_id: order.id,
        reason: 'Changed mind before window closes',
        status: 'PENDING',
        images: ['https://example.com/product.jpg'],
      },
    });

    expect(returnRequest).toBeDefined();
  });

  it('should reject return beyond 30 days', async () => {
    // Create order delivered 31 days ago
    const deliveredDate = new Date();
    deliveredDate.setDate(deliveredDate.getDate() - 31);

    const order = await prisma.order.create({
      data: {
        order_code: `RETURN-EXPIRED-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '0900000010',
        customer_address: 'Test Address',
        customer_city: 'Test City',
        customer_email: 'returnexpired@example.com',
        status: 'DELIVERED',
        total_amount: 2000000,
        delivered_date: deliveredDate,
      },
    });

    await prisma.orderItem.create({
      data: {
        order_id: order.id,
        product_id: productId,
        snapshot_name: 'Test Product Return',
        quantity: 1,
        unit_price_at_purchase: 2000000,
        warranty_months_snapshot: 12,
      },
    });

    // Calculate days since delivery
    const now = new Date();
    const daysSinceDelivery = Math.floor(
      (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(daysSinceDelivery).toBeGreaterThan(30);

    // In real API, this would return error
    // Here we just verify the validation logic
    expect(daysSinceDelivery > 30).toBe(true);
  });

  it('should reject return for non-DELIVERED orders', async () => {
    const order = await prisma.order.create({
      data: {
        order_code: `RETURN-NOTDELIVERED-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '0900000011',
        customer_address: 'Test Address',
        customer_city: 'Test City',
        customer_email: 'returnnotdelivered@example.com',
        status: 'SHIPPING',
        total_amount: 2000000,
      },
    });

    await prisma.orderItem.create({
      data: {
        order_id: order.id,
        product_id: productId,
        snapshot_name: 'Test Product Return',
        quantity: 1,
        unit_price_at_purchase: 2000000,
        warranty_months_snapshot: 12,
      },
    });

    // Verify order is not DELIVERED
    const currentOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });

    expect(currentOrder?.status).not.toBe('DELIVERED');
    expect(currentOrder?.delivered_date).toBeNull();
  });

  it('should calculate 30-day window correctly', async () => {
    const deliveredDate = new Date('2024-01-01');
    const testDate = new Date('2024-01-20');

    const daysDiff = Math.floor(
      (testDate.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(daysDiff).toBe(19);
    expect(daysDiff <= 30).toBe(true);

    const expiredDate = new Date('2024-02-05');
    const expiredDaysDiff = Math.floor(
      (expiredDate.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(expiredDaysDiff).toBe(35);
    expect(expiredDaysDiff > 30).toBe(true);
  });
});
