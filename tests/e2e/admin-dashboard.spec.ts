import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('input[id="admin-login_email"]', 'admin@namphong.vn');
    await page.fill('input[id="admin-login_password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin');
  });

  test('should display quick action buttons', async ({ page }) => {
    await expect(page.getByText('Truy cập nhanh')).toBeVisible();
    
    // Check for buttons - use specific text or parent container
    const quickActions = page.locator('.ant-card-body').filter({ hasText: 'Đơn hàng' }).first();
    await expect(quickActions).toBeVisible();
  });

  test('should navigate to orders page from quick action', async ({ page }) => {
    // Click the first link with text "Đơn hàng" inside the quick actions card
    await page.locator('.ant-card-body a[href="/admin/orders"]').first().click();
    await page.waitForURL('**/admin/orders');
    await expect(page.getByText('Điện Máy Nam Phong - Quản trị')).toBeVisible();
  });
});
