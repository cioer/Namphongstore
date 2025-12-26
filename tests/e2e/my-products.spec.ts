import { test, expect } from '@playwright/test';

test.describe('My Products', () => {
  const timestamp = Date.now();
  const email = `productuser${timestamp}@example.com`;
  const password = 'password123';
  const fullName = 'Product User';
  const phone = '0909998887';

  test('should display purchased products in profile', async ({ page }) => {
    // 1. Register and Login
    await page.goto('/register');
    await page.fill('input[placeholder="Nguyễn Văn A"]', fullName);
    await page.fill('input[placeholder="example@email.com"]', email);
    await page.fill('input[placeholder="0901234567"]', phone);
    await page.fill('input[placeholder="Mật khẩu"]', password);
    await page.fill('input[placeholder="Xác nhận mật khẩu"]', password);
    await page.click('button:has-text("Đăng ký")');
    await expect(page.getByText('Đăng ký thành công')).toBeVisible();
    await page.waitForURL('**/login');

    await page.fill('input[placeholder="Email"]', email);
    await page.fill('input[placeholder="Mật khẩu"]', password);
    await page.click('button:has-text("Đăng nhập")');
    
    // Wait for login to complete
    try {
      await page.waitForURL('/', { timeout: 15000 });
    } catch (e) {
      await page.goto('/');
    }

    // 2. Buy a product
    // Find a product
    const productCard = page.locator('[data-testid="product-card"], .ant-card').first();
    await productCard.waitFor({ state: 'visible', timeout: 10000 });
    const productName = await productCard.locator('h3, .ant-card-meta-title').textContent();
    await productCard.click();

    // Add to cart
    await page.click('button:has-text("Thêm vào giỏ")');
    
    // Checkout
    await page.goto('/checkout');
    await page.fill('input[name="customer_address"]', '123 Test St');
    await page.click('button:has-text("Đặt hàng")');
    await expect(page.getByText('Đặt hàng thành công')).toBeVisible({ timeout: 20000 });

    // 3. Go to Profile
    await page.goto('/profile');
    
    // 4. Check "Sản phẩm đã mua" tab
    const productsTab = page.getByText('Sản phẩm đã mua');
    await expect(productsTab).toBeVisible();
    await productsTab.click();

    // 5. Check if product is listed
    // Note: productName might have extra whitespace
    if (productName) {
      await expect(page.getByText(productName.trim())).toBeVisible();
    }
    
    // 6. Check status (Should be "Đang xử lý" or "Mới đặt")
    await expect(page.getByText('Đang xử lý')).toBeVisible();
  });
});
