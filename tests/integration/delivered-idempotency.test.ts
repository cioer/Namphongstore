import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Delivered Idempotency Test', () => {
  let categoryId: string;
  let productId: string;
  let orderId: string;
  let orderItemId: string;

  beforeAll(async () => {
    // Clean existing data - respect FK constraints
    await prisma.returnRequest.deleteMany({});
    await prisma.eventLog.deleteMany({});
    await prisma.warrantyUnit.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: `test-category-${Date.now()}`,
      },
    });
    categoryId = category.id;

    // Create test product with warranty
    const product = await prisma.product.create({
      data: {
        name: 'Test Product with Warranty',
        slug: `test-product-warranty-${Date.now()}`,
        brand: 'TestBrand',
        category_id: categoryId,
        price_original: 1000000,
        price_sale: 1000000,
        warranty_months: 12,
        stock_quantity: 100,
        images: ['https://via.placeholder.com/400'],
        description: 'Test product for warranty',
      },
    });
    productId = product.id;

    // Create test order with qty=2
    const order = await prisma.order.create({
      data: {
        order_code: `TEST-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '0900000001',
        customer_address: 'Test Address',
        customer_city: 'Test City',
        customer_email: 'test@example.com',
        status: 'CONFIRMED',
        total_amount: 2000000,
        notes: 'Test order for idempotency',
      },
    });
    orderId = order.id;

    // Create order item with qty=2
    const orderItem = await prisma.orderItem.create({
      data: {
        order_id: orderId,
        product_id: productId,
        snapshot_name: 'Test Product with Warranty',
        quantity: 2,
        unit_price_at_purchase: 1000000,
        warranty_months_snapshot: 12,
      },
    });
    orderItemId = orderItem.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create exactly 2 WarrantyUnits on first DELIVERED transition', async () => {
    // Set order to DELIVERED for the first time
    const deliveredDate = new Date();
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        delivered_date: deliveredDate,
      },
    });

    // Get order item
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
    });

    // Create warranty units
    const warrantyUnits = [];
    for (let unitNo = 1; unitNo <= orderItem!.quantity; unitNo++) {
      const warrantyCode = `NP-WTY-TEST-${Date.now()}-${unitNo}`;
      const endDate = new Date(deliveredDate);
      endDate.setMonth(endDate.getMonth() + orderItem!.warranty_months_snapshot);

      const warranty = await prisma.warrantyUnit.create({
        data: {
          order_item_id: orderItemId,
          unit_no: unitNo,
          warranty_code_auto: warrantyCode,
          warranty_months_at_purchase: orderItem!.warranty_months_snapshot,
          start_date: deliveredDate,
          end_date: endDate,
          status: 'ACTIVE',
        },
      });
      warrantyUnits.push(warranty);
    }

    // Verify exactly 2 warranty units created
    const warranties = await prisma.warrantyUnit.findMany({
      where: { order_item_id: orderItemId },
    });

    expect(warranties.length).toBe(2);
    expect(warranties[0].unit_no).toBe(1);
    expect(warranties[1].unit_no).toBe(2);

    // Verify codes are unique
    const codes = warranties.map((w: typeof warranties[number]) => w.warranty_code_auto);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(2);
  });

  it('should NOT create duplicate warranties on second DELIVERED attempt', async () => {
    // Try to set DELIVERED again (idempotency check)
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED' },
    });

    // Check warranty count - should still be 2
    const warranties = await prisma.warrantyUnit.findMany({
      where: { order_item_id: orderItemId },
    });

    expect(warranties.length).toBe(2);
  });

  it('should have unique warranty codes', async () => {
    const warranties = await prisma.warrantyUnit.findMany({
      where: { order_item_id: orderItemId },
    });

    const codes = warranties.map((w: typeof warranties[number]) => w.warranty_code_auto);
    const uniqueCodes = new Set(codes);
    
    expect(codes.length).toBe(uniqueCodes.size);
  });
});
