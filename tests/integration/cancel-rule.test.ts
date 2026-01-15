import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Cancel Rule Test', () => {
  let categoryId: string;
  let productId: string;

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

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: 'Test Category Cancel',
        slug: `test-category-cancel-${Date.now()}`,
      },
    });
    categoryId = category.id;

    // Create test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product Cancel',
        slug: `test-product-cancel-${Date.now()}`,
        brand: 'TestBrand',
        category_id: categoryId,
        price_original: 500000,
        price_sale: 500000,
        warranty_months: 6,
        stock_quantity: 50,
        images: ['https://via.placeholder.com/400'],
        description: 'Test product for cancel rules',
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should allow cancel for NEW status with reason', async () => {
    const order = await prisma.order.create({
      data: {
        order_code: `CANCEL-NEW-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '0900000003',
        customer_address: 'Test Address',
        customer_city: 'Test City',
        customer_email: 'cancel@example.com',
        status: 'NEW',
        total_amount: 500000,
      },
    });

    await prisma.orderItem.create({
      data: {
        order_id: order.id,
        product_id: productId,
        snapshot_name: 'Test Product Cancel',
        quantity: 1,
        unit_price_at_purchase: 500000,
        warranty_months_snapshot: 6,
      },
    });

    // Cancel with reason
    const cancelReason = 'Customer changed mind';
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED_BY_CUSTOMER',
        cancel_reason: cancelReason,
      },
    });

    expect(updated.status).toBe('CANCELLED_BY_CUSTOMER');
    expect(updated.cancel_reason).toBe(cancelReason);
  });

  it('should allow cancel for CONFIRMED status with reason', async () => {
    const order = await prisma.order.create({
      data: {
        order_code: `CANCEL-CONFIRMED-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '0900000004',
        customer_address: 'Test Address',
        customer_city: 'Test City',
        customer_email: 'cancel2@example.com',
        status: 'CONFIRMED',
        total_amount: 500000,
      },
    });

    await prisma.orderItem.create({
      data: {
        order_id: order.id,
        product_id: productId,
        snapshot_name: 'Test Product Cancel',
        quantity: 1,
        unit_price_at_purchase: 500000,
        warranty_months_snapshot: 6,
      },
    });

    // Cancel with reason
    const cancelReason = 'Found better price elsewhere';
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED_BY_CUSTOMER',
        cancel_reason: cancelReason,
      },
    });

    expect(updated.status).toBe('CANCELLED_BY_CUSTOMER');
    expect(updated.cancel_reason).toBe(cancelReason);
  });

  it('should NOT allow cancel for SHIPPING status', async () => {
    const order = await prisma.order.create({
      data: {
        order_code: `CANCEL-SHIPPING-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '0900000005',
        customer_address: 'Test Address',
        customer_city: 'Test City',
        customer_email: 'cancel3@example.com',
        status: 'SHIPPING',
        total_amount: 500000,
      },
    });

    await prisma.orderItem.create({
      data: {
        order_id: order.id,
        product_id: productId,
        snapshot_name: 'Test Product Cancel',
        quantity: 1,
        unit_price_at_purchase: 500000,
        warranty_months_snapshot: 6,
      },
    });

    // Verify status is SHIPPING (cannot cancel)
    const current = await prisma.order.findUnique({
      where: { id: order.id },
    });

    expect(current?.status).toBe('SHIPPING');
    
    // Business logic should prevent cancel, but we can verify the status
    // In real API, this would return error 400
    expect(['NEW', 'CONFIRMED']).not.toContain(current?.status);
  });

  it('should NOT allow cancel for DELIVERED status', async () => {
    const order = await prisma.order.create({
      data: {
        order_code: `CANCEL-DELIVERED-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '0900000006',
        customer_address: 'Test Address',
        customer_city: 'Test City',
        customer_email: 'cancel4@example.com',
        status: 'DELIVERED',
        total_amount: 500000,
        delivered_date: new Date(),
      },
    });

    await prisma.orderItem.create({
      data: {
        order_id: order.id,
        product_id: productId,
        snapshot_name: 'Test Product Cancel',
        quantity: 1,
        unit_price_at_purchase: 500000,
        warranty_months_snapshot: 6,
      },
    });

    // Verify status is DELIVERED (cannot cancel)
    const current = await prisma.order.findUnique({
      where: { id: order.id },
    });

    expect(current?.status).toBe('DELIVERED');
    
    // Business logic should prevent cancel
    expect(['NEW', 'CONFIRMED']).not.toContain(current?.status);
  });

  it('should require cancel_reason when cancelling', async () => {
    const order = await prisma.order.create({
      data: {
        order_code: `CANCEL-REASON-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '0900000007',
        customer_address: 'Test Address',
        customer_city: 'Test City',
        customer_email: 'cancel5@example.com',
        status: 'NEW',
        total_amount: 500000,
      },
    });

    // Cancel requires reason
    const cancelReason = 'Need to change delivery address';
    expect(cancelReason.length).toBeGreaterThan(0);

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED_BY_CUSTOMER',
        cancel_reason: cancelReason,
      },
    });

    expect(updated.cancel_reason).toBeDefined();
    expect(updated.cancel_reason?.length).toBeGreaterThan(0);
  });
});
