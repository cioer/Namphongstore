import { test, expect } from '@playwright/test';

test.describe('Warranty Generation Flow', () => {
  let orderCode: string;

  test('should generate warranty codes when admin sets order to DELIVERED', async ({ page }) => {
    // 1. Create an order as customer
    await page.goto('/');
    
    const firstProduct = page.locator('[data-testid="product-card"], .ant-card').first();
    await firstProduct.waitFor({ state: 'visible', timeout: 10000 });
    await firstProduct.click();

    // Add to cart
    const addToCartButton = page.locator('button:has-text("Thêm vào giỏ")').first();
    await addToCartButton.click();
    await page.waitForTimeout(1000);

    // Checkout
    await page.goto('/checkout');
    await page.fill('input[name="customer_name"], input#customer_name', 'Warranty Test Customer');
    await page.fill('input[name="customer_phone"], input#customer_phone', '0909999999');
    await page.fill('input[name="customer_email"], input#customer_email', 'warranty@test.com');
    await page.fill('textarea[name="customer_address"], textarea#customer_address', '456 Warranty St');

    const submitButton = page.locator('button[type="submit"]:has-text("Đặt hàng"), button:has-text("Place Order")');
    await submitButton.click();

    // Get order code from success page
    await expect(page).toHaveURL(/\/orders\/success\/.+/, { timeout: 10000 });
    const urlParts = page.url().split('/');
    orderCode = urlParts[urlParts.length - 1];
    
    console.log('Created order:', orderCode);

    // 2. Login as admin
    await page.goto('/admin/login');
    await page.fill('input[name="email"], input#email', 'admin@namphong.vn');
    await page.fill('input[name="password"], input#password', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect to admin dashboard
    await page.waitForURL(/\/admin/, { timeout: 10000 });

    // 3. Navigate to orders
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');

    // Find our order
    const orderRow = page.locator(`tr:has-text("${orderCode}")`).first();
    await expect(orderRow).toBeVisible({ timeout: 10000 });

    // Click to view order detail
    await orderRow.click();

    // 4. Set order to CONFIRMED
    await expect(page).toHaveURL(/\/admin\/orders\/.+/, { timeout: 5000 });
    
    const confirmButton = page.locator('button:has-text("Xác nhận"), button:has-text("Confirm")').first();
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
      await page.waitForTimeout(1000);
    }

    // 5. Set order to SHIPPING
    const shippingButton = page.locator('button:has-text("Giao hàng"), button:has-text("Ship")').first();
    if (await shippingButton.isVisible()) {
      await shippingButton.click();
      await page.waitForTimeout(1000);
    }

    // 6. Set order to DELIVERED
    const deliveredButton = page.locator('button:has-text("Đã giao"), button:has-text("Delivered")').first();
    await deliveredButton.click();

    // Wait for warranty generation
    await page.waitForTimeout(2000);

    // 7. Verify warranty codes are displayed
    const warrantySection = page.locator('text=/Bảo hành|Warranty/i').first();
    await expect(warrantySection).toBeVisible({ timeout: 5000 });

    // Verify warranty code format NP-WTY-YYMM-XXXXX
    const warrantyCode = page.locator('text=/NP-WTY-\\d{4}-\\d{5}/').first();
    await expect(warrantyCode).toBeVisible({ timeout: 5000 });

    console.log('Warranty codes generated successfully');
  });

  test('should display warranty codes on customer order detail', async ({ page }) => {
    // Track order as customer
    await page.goto('/track-order');

    // Search by phone
    await page.fill('input[name="phone"], input#phone', '0909999999');
    await page.click('button[type="submit"], button:has-text("Tra cứu"), button:has-text("Track")');

    // Wait for results
    await page.waitForTimeout(2000);

    // Click on first order
    const orderLink = page.locator('a[href*="/orders/"]').first();
    await orderLink.click();

    // Verify on order detail page
    await expect(page).toHaveURL(/\/orders\/.+/, { timeout: 5000 });

    // Verify warranty codes are visible
    const warrantyCode = page.locator('text=/NP-WTY-\\d{4}-\\d{5}/').first();
    await expect(warrantyCode).toBeVisible({ timeout: 10000 });

    // Verify ACTIVE status
    const activeStatus = page.locator('text=/ACTIVE|Đang hoạt động/i').first();
    await expect(activeStatus).toBeVisible({ timeout: 5000 });
  });

  test('should show warranty in timeline events', async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('input[name="email"], input#email', 'admin@namphong.vn');
    await page.fill('input[name="password"], input#password', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/admin/, { timeout: 10000 });

    // Go to orders
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');

    // Click first delivered order
    const deliveredOrder = page.locator('tr:has-text("DELIVERED")').first();
    await deliveredOrder.click();

    // Verify timeline shows warranty generation event
    const timeline = page.locator('.ant-timeline, [data-testid="timeline"]');
    await expect(timeline).toBeVisible({ timeout: 5000 });

    // Check for WARRANTY event
    const warrantyEvent = page.locator('text=/WARRANTY_CODES_GENERATED|Tạo mã bảo hành/i').first();
    await expect(warrantyEvent).toBeVisible({ timeout: 5000 });
  });
});
