import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('should complete full checkout flow: browse → cart → checkout → success', async ({ page }) => {
    // 1. Browse to homepage
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Điện máy Nam Phong/i }).first()).toBeVisible();

    // 2. Find and click on first product
    const productCards = page.locator('[data-testid="product-card"], .ant-card').first();
    await productCards.waitFor({ state: 'visible', timeout: 10000 });
    
    // Get product name for verification
    const productName = await productCards.locator('h3, .ant-card-meta-title').textContent();
    
    await productCards.click();

    // 3. On product detail page, add to cart
    await expect(page).toHaveURL(/\/p\/.+/);
    
    const addToCartButton = page.locator('button:has-text("Thêm vào giỏ")').first();
    await addToCartButton.click();

    // Wait for success notification
    await expect(page.locator('.ant-message-success, .ant-notification-notice-success')).toBeVisible({ timeout: 5000 });

    // 4. Navigate to cart
    await page.goto('/cart');
    await expect(page).toHaveURL('/cart');

    // Verify product in cart
    const cartItems = page.locator('[data-testid="cart-item"], .ant-list-item');
    await expect(cartItems).toHaveCount(1);

    // 5. Click checkout
    const checkoutButton = page.locator('button:has-text("Thanh toán"), button:has-text("Checkout")');
    await checkoutButton.click();

    // 6. Fill checkout form
    await expect(page).toHaveURL('/checkout');

    await page.fill('input[name="customer_name"], input#customer_name', 'E2E Test Customer');
    await page.fill('input[name="customer_phone"], input#customer_phone', '0901234567');
    await page.fill('input[name="customer_email"], input#customer_email', 'e2e@test.com');
    await page.fill('textarea[name="customer_address"], textarea#customer_address', '123 Test Street, Test City');

    // 7. Submit order
    const submitButton = page.locator('button[type="submit"]:has-text("Đặt hàng"), button:has-text("Place Order")');
    await submitButton.click();

    // 8. Verify success page
    await expect(page).toHaveURL(/\/orders\/success\/.+/, { timeout: 10000 });

    // Verify order code is displayed
    const orderCodeElement = page.locator('text=/[A-Z0-9-]+/').first();
    const orderCode = await orderCodeElement.textContent();
    
    expect(orderCode).toBeTruthy();
    expect(orderCode?.length).toBeGreaterThan(5);

    // Verify success message
    await expect(page.locator('body')).toContainText(/thành công|success|cảm ơn|thank you/i);
  });

  test('should validate required fields on checkout', async ({ page }) => {
    // Add product to cart first
    await page.goto('/');
    
    const firstProduct = page.locator('[data-testid="product-card"], .ant-card').first();
    await firstProduct.waitFor({ state: 'visible', timeout: 10000 });
    await firstProduct.click();

    const addToCartButton = page.locator('button:has-text("Thêm vào giỏ")').first();
    await addToCartButton.click();

    // Go to checkout
    await page.goto('/checkout');

    // Try to submit without filling form
    const submitButton = page.locator('button[type="submit"]:has-text("Đặt hàng"), button:has-text("Place Order")');
    await submitButton.click();

    // Should show validation errors
    await expect(page.locator('.ant-form-item-explain-error, .error-message')).toHaveCount(3, { timeout: 5000 });
  });

  test('should update cart quantity', async ({ page }) => {
    // Add product to cart
    await page.goto('/');
    
    const firstProduct = page.locator('[data-testid="product-card"], .ant-card').first();
    await firstProduct.waitFor({ state: 'visible', timeout: 10000 });
    await firstProduct.click();

    const addToCartButton = page.locator('button:has-text("Thêm vào giỏ")').first();
    await addToCartButton.click();

    // Go to cart
    await page.goto('/cart');

    // Increase quantity
    const increaseButton = page.locator('button[aria-label="Increase"], button:has-text("+")').first();
    await increaseButton.click();

    // Wait for update
    await page.waitForTimeout(500);

    // Verify quantity is 2
    const quantityInput = page.locator('input[type="number"], .ant-input-number-input').first();
    await expect(quantityInput).toHaveValue('2');
  });
});
