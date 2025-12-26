import { describe, it, expect } from 'vitest';
import { formatVND, isPromoActive, generateWarrantyCode } from './utils';

describe('formatVND', () => {
  it('should format number as Vietnamese currency', () => {
    const result1 = formatVND(1000000);
    const result2 = formatVND(500000);
    const result3 = formatVND(0);
    
    expect(result1).toMatch(/1\.000\.000\s*₫/);
    expect(result2).toMatch(/500\.000\s*₫/);
    expect(result3).toMatch(/0\s*₫/);
  });

  it('should format string as Vietnamese currency', () => {
    const result1 = formatVND('1000000');
    const result2 = formatVND('500000');
    
    expect(result1).toMatch(/1\.000\.000\s*₫/);
    expect(result2).toMatch(/500\.000\s*₫/);
  });

  it('should handle decimal values', () => {
    const result = formatVND(1000000.5);
    expect(result).toMatch(/1\.000\.001\s*₫/);
  });
});

describe('isPromoActive', () => {
  it('should return false when promoStart is null', () => {
    const result = isPromoActive(null, new Date());
    expect(result).toBe(false);
  });

  it('should return false when promoEnd is null', () => {
    const result = isPromoActive(new Date(), null);
    expect(result).toBe(false);
  });

  it('should return true when current time is within promo window', () => {
    const now = new Date();
    const start = new Date(now.getTime() - 1000 * 60 * 60 * 24); // 1 day ago
    const end = new Date(now.getTime() + 1000 * 60 * 60 * 24); // 1 day from now
    
    const result = isPromoActive(start, end);
    expect(result).toBe(true);
  });

  it('should return false when current time is before promo start', () => {
    const now = new Date();
    const start = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now
    const end = new Date(now.getTime() + 1000 * 60 * 60 * 48); // 2 days from now
    
    const result = isPromoActive(start, end);
    expect(result).toBe(false);
  });

  it('should return false when current time is after promo end', () => {
    const now = new Date();
    const start = new Date(now.getTime() - 1000 * 60 * 60 * 48); // 2 days ago
    const end = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
    
    const result = isPromoActive(start, end);
    expect(result).toBe(false);
  });

  it('should return true when current time equals promo start', () => {
    const now = new Date();
    const end = new Date(now.getTime() + 1000 * 60 * 60 * 24);
    
    const result = isPromoActive(now, end);
    expect(result).toBe(true);
  });

  it('should return true when current time equals promo end', () => {
    const now = new Date();
    const start = new Date(now.getTime() - 1000 * 60 * 60 * 24);
    
    const result = isPromoActive(start, now);
    expect(result).toBe(true);
  });
});

describe('generateWarrantyCode', () => {
  it('should generate code with correct format NP-WTY-YYMM-XXXXX', () => {
    const code = generateWarrantyCode();
    expect(code).toMatch(/^NP-WTY-\d{4}-\d{5}$/);
  });

  it('should generate non-empty code', () => {
    const code = generateWarrantyCode();
    expect(code.length).toBeGreaterThan(0);
  });

  it('should include current year and month', () => {
    const code = generateWarrantyCode();
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    
    expect(code).toContain(`NP-WTY-${yy}${mm}`);
  });

  it('should generate unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateWarrantyCode());
    }
    // At least 95% should be unique (allowing for extremely rare collisions)
    expect(codes.size).toBeGreaterThanOrEqual(95);
  });

  it('should have 5-digit random suffix', () => {
    const code = generateWarrantyCode();
    const parts = code.split('-');
    expect(parts[3].length).toBe(5);
    expect(parts[3]).toMatch(/^\d{5}$/);
  });
});
