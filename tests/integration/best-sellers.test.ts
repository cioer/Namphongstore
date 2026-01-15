// tests/integration/best-sellers.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { getBestSellingProducts } from '../../src/services/product.service';

describe('Best Selling Products Integration', () => {
  let categoryId: string;
  let products: any[] = [];
  let userIds: string[] = [];
  let orderIds: string[] = [];

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15); // Middle of last month
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15); // Middle of this month

  beforeAll(async () => {
    // 1. Create Category
    const category = await prisma.category.create({
      data: {
        name: 'Test Category Best Seller',
        slug: 'test-category-best-seller-' + Date.now(),
      }
    });
    categoryId = category.id;

    // 2. Create Products
    // P1: High sales last month (quantity: 10)
    // P2: Low sales last month (quantity: 5)
    // P3: High sales THIS month (should be ignored)
    // P4: No sales
    const p1 = await prisma.product.create({
      data: {
        category_id: categoryId,
        name: 'Product High Sales Last Month',
        slug: 'p-high-last-' + Date.now(),
        sku: 'SKU-HIGH-LAST-' + Date.now(),
        brand: 'TestBrand',
        price_original: 1000000,
        price_sale: 900000,
        stock_quantity: 100,
        is_active: true,
      }
    });
    const p2 = await prisma.product.create({
      data: {
        category_id: categoryId,
        name: 'Product Low Sales Last Month',
        slug: 'p-low-last-' + Date.now(),
        sku: 'SKU-LOW-LAST-' + Date.now(),
        brand: 'TestBrand',
        price_original: 1000000,
        price_sale: 900000,
        stock_quantity: 100,
        is_active: true,
      }
    });
    const p3 = await prisma.product.create({
      data: {
        category_id: categoryId,
        name: 'Product High Sales This Month',
        slug: 'p-high-this-' + Date.now(),
        sku: 'SKU-HIGH-THIS-' + Date.now(),
        brand: 'TestBrand',
        price_original: 1000000,
        price_sale: 900000,
        stock_quantity: 100,
        is_active: true,
      }
    });
    products = [p1, p2, p3];

    // 3. Create Orders (Confirmed)
    // Order 1: Last Month, P1 x 10
    const order1 = await prisma.order.create({
      data: {
        order_code: 'ORD-LAST-1-' + Date.now(),
        customer_name: 'Test Cust 1',
        customer_phone: '0900000001',
        customer_address: 'Addr 1',
        customer_city: 'City 1',
        total_amount: 9000000,
        status: 'CONFIRMED',
        created_at: lastMonth,
        items: {
          create: {
            product_id: p1.id,
            quantity: 10,
            unit_price_at_purchase: 900000,
            snapshot_name: p1.name,
          }
        }
      }
    });

    // Order 2: Last Month, P2 x 5
    const order2 = await prisma.order.create({
      data: {
        order_code: 'ORD-LAST-2-' + Date.now(),
        customer_name: 'Test Cust 2',
        customer_phone: '0900000002',
        customer_address: 'Addr 2',
        customer_city: 'City 1',
        total_amount: 4500000,
        status: 'DELIVERED', // Delivered also counts
        created_at: lastMonth,
        items: {
          create: {
            product_id: p2.id,
            quantity: 5,
            unit_price_at_purchase: 900000,
            snapshot_name: p2.name,
          }
        }
      }
    });

    // Order 3: This Month, P3 x 20 (Should accept if logic was global, but reject for "Last Month")
    const order3 = await prisma.order.create({
      data: {
        order_code: 'ORD-THIS-3-' + Date.now(),
        customer_name: 'Test Cust 3',
        customer_phone: '0900000003',
        customer_address: 'Addr 3',
        customer_city: 'City 1',
        total_amount: 18000000,
        status: 'CONFIRMED',
        created_at: thisMonth,
        items: {
          create: {
            product_id: p3.id,
            quantity: 20,
            unit_price_at_purchase: 900000,
            snapshot_name: p3.name,
          }
        }
      }
    });

    orderIds = [order1.id, order2.id, order3.id];
  });

  afterAll(async () => {
    // Cleanup
    // Delete order items first (cascade usually handles this but safety first)
    await prisma.orderItem.deleteMany({
      where: { order_id: { in: orderIds } }
    });
    await prisma.order.deleteMany({
      where: { id: { in: orderIds } }
    });
    await prisma.product.deleteMany({
      where: { id: { in: products.map(p => p.id) } }
    });
    await prisma.category.delete({
      where: { id: categoryId }
    });
  });

  it('should return products sold in the last month, ordered by quantity', async () => {
    const result = await getBestSellingProducts(10);
    
    // Result might contain other existing products in DB, so we filter for our test products
    const testResults = result.filter(p => products.some(tp => tp.id === p.id));

    // P3 should be filtered out (sales this month) or low priority if other months don't matter (logic: explicitly last month)
    // The logic is strictly: created_at between StartOfLastMonth and EndOfLastMonth.
    // So P3 (This Month) should NOT be in the list at all.

    const p1InResult = testResults.find(p => p.id === products[0].id);
    const p2InResult = testResults.find(p => p.id === products[1].id);
    const p3InResult = testResults.find(p => p.id === products[2].id);

    // Verify P1 is present
    expect(p1InResult).toBeDefined();
    // Verify P2 is present
    expect(p2InResult).toBeDefined();
    
    // Verify P3 is NOT present (sold this month, not last)
    expect(p3InResult).toBeUndefined();

    // Verify Order: P1 (10 units) > P2 (5 units)
    const p1Index = testResults.findIndex(p => p.id === products[0].id);
    const p2Index = testResults.findIndex(p => p.id === products[1].id);
    expect(p1Index).toBeLessThan(p2Index);
  });
});
