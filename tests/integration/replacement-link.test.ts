import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Replacement Link Test', () => {
  let categoryId: string;
  let productId: string;
  let orderId: string;
  let orderItemId: string;
  let oldWarrantyId: string;
  let returnRequestId: string;

  beforeAll(async () => {
    // Clean existing data
    await prisma.eventLog.deleteMany({});
    await prisma.warrantyUnit.deleteMany({});
    await prisma.returnRequest.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: 'Test Category Replacement',
        slug: `test-category-replacement-${Date.now()}`,
      },
    });
    categoryId = category.id;

    // Create test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product Replacement',
        slug: `test-product-replacement-${Date.now()}`,
        brand: 'TestBrand',
        category_id: categoryId,
        price_original: 3000000,
        price_sale: 3000000,
        warranty_months: 12,
        stock_quantity: 30,
        images: ['https://via.placeholder.com/400'],
        description: 'Test product for replacement',
      },
    });
    productId = product.id;

    // Create delivered order
    const deliveredDate = new Date();
    const order = await prisma.order.create({
      data: {
        order_code: `REPLACE-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '0900000012',
        customer_address: 'Test Address',
        customer_city: 'Test City',
        customer_email: 'replacement@example.com',
        status: 'DELIVERED',
        total_amount: 3000000,
        delivered_date: deliveredDate,
      },
    });
    orderId = order.id;

    // Create order item
    const orderItem = await prisma.orderItem.create({
      data: {
        order_id: orderId,
        product_id: productId,
        snapshot_name: 'Test Product Replacement',
        quantity: 1,
        unit_price_at_purchase: 3000000,
        warranty_months_snapshot: 12,
      },
    });
    orderItemId = orderItem.id;

    // Create original warranty
    const endDate = new Date(deliveredDate);
    endDate.setMonth(endDate.getMonth() + 12);

    const oldWarranty = await prisma.warrantyUnit.create({
      data: {
        order_item_id: orderItemId,
        unit_no: 1,
        warranty_code_auto: `NP-WTY-OLD-${Date.now()}`,
        warranty_months_at_purchase: 12,
        start_date: deliveredDate,
        end_date: endDate,
        status: 'ACTIVE',
      },
    });
    oldWarrantyId = oldWarranty.id;

    // Create approved return request
    const returnRequest = await prisma.returnRequest.create({
      data: {
        order_id: orderId,
        warranty_unit_id: oldWarrantyId,
        reason: 'Product defect - needs replacement',
        status: 'APPROVED',
        images: ['https://example.com/defect.jpg'],
        admin_note: 'Approved for replacement',
      },
    });
    returnRequestId = returnRequest.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create new WarrantyUnit when completing replacement', async () => {
    // Complete replacement
    const replacementDate = new Date();
    const newEndDate = new Date(replacementDate);
    newEndDate.setMonth(newEndDate.getMonth() + 12);

    const newWarranty = await prisma.warrantyUnit.create({
      data: {
        order_item_id: orderItemId,
        unit_no: 2,
        warranty_code_auto: `NP-WTY-REPLACE-${Date.now()}`,
        warranty_months_at_purchase: 12,
        start_date: replacementDate,
        end_date: newEndDate,
        status: 'ACTIVE',
      },
    });

    expect(newWarranty).toBeDefined();
    expect(newWarranty.warranty_code_auto).toContain('NP-WTY-REPLACE');
    expect(newWarranty.status).toBe('ACTIVE');
  });

  it('should set old.replaced_by = new.id', async () => {
    // Get the new warranty (last created)
    const warranties = await prisma.warrantyUnit.findMany({
      where: { order_item_id: orderItemId },
      orderBy: { created_at: 'desc' },
    });

    const newWarranty = warranties[0];

    // Update old warranty with replacement link
    await prisma.warrantyUnit.update({
      where: { id: oldWarrantyId },
      data: {
        status: 'REPLACED',
        replaced_by: newWarranty.id,
      },
    });

    // Verify old warranty is linked to new one
    const oldWarranty = await prisma.warrantyUnit.findUnique({
      where: { id: oldWarrantyId },
    });

    expect(oldWarranty?.replaced_by).toBe(newWarranty.id);
    expect(oldWarranty?.status).toBe('REPLACED');
  });

  it('should mark old warranty as REPLACED', async () => {
    const oldWarranty = await prisma.warrantyUnit.findUnique({
      where: { id: oldWarrantyId },
    });

    expect(oldWarranty?.status).toBe('REPLACED');
  });

  it('should update return request to COMPLETED', async () => {
    await prisma.returnRequest.update({
      where: { id: returnRequestId },
      data: { status: 'COMPLETED' },
    });

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
    });

    expect(returnRequest?.status).toBe('COMPLETED');
  });

  it('should verify replacement chain integrity', async () => {
    const oldWarranty = await prisma.warrantyUnit.findUnique({
      where: { id: oldWarrantyId },
    });

    expect(oldWarranty?.replaced_by).not.toBeNull();

    // Get new warranty through the link
    if (oldWarranty?.replaced_by) {
      const newWarranty = await prisma.warrantyUnit.findUnique({
        where: { id: oldWarranty.replaced_by },
      });

      expect(newWarranty).toBeDefined();
      expect(newWarranty?.status).toBe('ACTIVE');
      expect(newWarranty?.order_item_id).toBe(orderItemId);
    }
  });

  it('should have different warranty codes for old and new', async () => {
    const oldWarranty = await prisma.warrantyUnit.findUnique({
      where: { id: oldWarrantyId },
    });

    if (oldWarranty?.replaced_by) {
      const newWarranty = await prisma.warrantyUnit.findUnique({
        where: { id: oldWarranty.replaced_by },
      });

      expect(oldWarranty.warranty_code_auto).not.toBe(newWarranty?.warranty_code_auto);
    }
  });

  it('should maintain warranty months for replacement', async () => {
    const oldWarranty = await prisma.warrantyUnit.findUnique({
      where: { id: oldWarrantyId },
    });

    if (oldWarranty?.replaced_by) {
      const newWarranty = await prisma.warrantyUnit.findUnique({
        where: { id: oldWarranty.replaced_by },
      });

      // Both should have same warranty_months_at_purchase
      expect(oldWarranty.warranty_months_at_purchase).toBe(
        newWarranty?.warranty_months_at_purchase
      );
    }
  });
});
