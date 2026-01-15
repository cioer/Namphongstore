import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createOrder } from '@/services/order.service';

describe('Stock Synchronization', () => {
  let product: any;
  let category: any;

  beforeAll(async () => {
    // Create a test category
    category = await prisma.category.create({
      data: {
        name: 'Stock Test Category',
        slug: 'stock-test-cat-' + Date.now(),
      }
    });

    // Create a test product
    product = await prisma.product.create({
      data: {
        name: 'Stock Test Product',
        slug: 'stock-test-' + Date.now(),
        price_original: 100000,
        price_sale: 90000,
        stock_quantity: 10,
        category_id: category.id,
      }
    });
  });

  afterAll(async () => {
    // Cleanup - proper order to respect FK constraints
    await prisma.returnRequest.deleteMany({});
    await prisma.warrantyUnit.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    if (product) {
      await prisma.product.delete({ where: { id: product.id }}).catch(() => {});
    }
    if (category) {
      await prisma.category.delete({ where: { id: category.id }}).catch(() => {});
    }
  });

  it('should decrement stock when order is created', async () => {
    const orderData = {
      customer_name: 'Test User',
      customer_phone: '0901234567',
      customer_address: '123 Test St',
      customer_city: 'Test City',
      items: [{ productId: product.id, quantity: 2 }]
    };

    const order = await createOrder(orderData);
    expect(order).toBeDefined();

    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct?.stock_quantity).toBe(8); // 10 - 2
  });

  it('should prevent order creation if stock is insufficient', async () => {
    const orderData = {
      customer_name: 'Test User',
      customer_phone: '0901234567',
      customer_address: '123 Test St',
      customer_city: 'Test City',
      items: [{ productId: product.id, quantity: 100 }] // Current stock 8
    };

    await expect(createOrder(orderData)).rejects.toThrow(/không đủ hàng trong kho/);
    
    // Check stock hasn't changed
    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct?.stock_quantity).toBe(8);
  });
});
