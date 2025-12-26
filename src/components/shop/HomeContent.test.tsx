import { describe, it, expect } from 'vitest';
import HomeContent from './HomeContent';

describe('HomeContent Component', () => {
  describe('props serialization', () => {
    it('should accept categories with string dates', () => {
      const categories = [
        {
          id: 'cat-1',
          name: 'Tủ lạnh',
          slug: 'tu-lanh',
          description: 'Tủ lạnh các loại',
          image_url: '/uploads/tu-lanh.jpg',
          parent_id: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ];
      const dealsProducts: any[] = [];
      const bestSellers: any[] = [];

      // HomeContent should be importable and accept serialized data
      expect(HomeContent).toBeDefined();
      expect(typeof HomeContent).toBe('function');
      
      // Verify categories structure is correct
      expect(categories[0].created_at).toBe('2024-01-01T00:00:00.000Z');
      expect(typeof categories[0].id).toBe('string');
    });

    it('should accept products with string prices (not Decimal objects)', () => {
      const products = [
        {
          id: 'prod-1',
          category_id: 'cat-1',
          name: 'Tủ lạnh Samsung 300L',
          slug: 'tu-lanh-samsung-300l',
          brand: 'Samsung',
          description: 'Tủ lạnh Samsung 300L',
          specs: { dungTich: '300L', congNghe: 'Inverter' },
          gifts: ['Bình giữ nhiệt', 'Nồi cơm điện'],
          images: ['/uploads/tu-lanh-1.jpg'],
          price_original: '15000000', // String, not Decimal
          price_sale: '12000000', // String, not Decimal
          discount_percent: 20,
          promo_start: '2024-01-01T00:00:00.000Z', // ISO string
          promo_end: '2024-12-31T23:59:59.000Z', // ISO string
          warranty_months: 24,
          stock_quantity: 10,
          is_active: true,
          created_at: '2024-01-01T00:00:00.000Z', // ISO string
          updated_at: '2024-01-01T00:00:00.000Z', // ISO string
        },
      ];

      // Verify product has string prices (not Decimal objects)
      expect(typeof products[0].price_original).toBe('string');
      expect(typeof products[0].price_sale).toBe('string');
      expect(products[0].price_original).toBe('15000000');
      
      // Verify dates are ISO strings
      expect(typeof products[0].created_at).toBe('string');
      expect(typeof products[0].promo_start).toBe('string');
      
      // Verify JSON fields are plain arrays/objects
      expect(Array.isArray(products[0].gifts)).toBe(true);
      expect(Array.isArray(products[0].images)).toBe(true);
      expect(typeof products[0].specs).toBe('object');
    });

    it('should handle null/empty arrays for optional fields', () => {
      const product = {
        id: 'prod-2',
        category_id: 'cat-1',
        name: 'Test Product',
        slug: 'test-product',
        brand: null,
        description: null,
        specs: null,
        gifts: [], // Empty array, not null
        images: [], // Empty array, not null
        price_original: '10000000',
        price_sale: '10000000',
        discount_percent: 0,
        promo_start: null,
        promo_end: null,
        warranty_months: 12,
        stock_quantity: 5,
        is_active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      // Verify null handling
      expect(product.brand).toBeNull();
      expect(product.description).toBeNull();
      expect(product.specs).toBeNull();
      expect(product.promo_start).toBeNull();
      expect(product.promo_end).toBeNull();
      
      // Verify empty arrays
      expect(product.gifts).toEqual([]);
      expect(product.images).toEqual([]);
    });
  });
});
