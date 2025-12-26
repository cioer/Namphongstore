import { test, expect } from '@playwright/test';

test.describe('Role Access Control', () => {
  
  test('SALES user should be redirected to orders and see limited menu', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[id="admin-login_email"]', 'sales@namphong.vn');
    await page.fill('input[id="admin-login_password"]', 'sales123');
    await page.click('button[type="submit"]');
    
    // Should be redirected to /admin/orders
    await page.waitForURL('**/admin/orders');
    
    // Check menu items
    const menu = page.locator('.ant-layout-sider');
    await expect(menu).toBeVisible();
    await expect(menu.getByText('Đơn hàng')).toBeVisible();
    await expect(menu.getByText('Sản phẩm')).toBeVisible();
    await expect(menu.getByText('Đổi trả & Bảo hành')).not.toBeVisible();
    await expect(menu.getByText('Tổng quan')).not.toBeVisible();
  });

  test('TECH user should be redirected to returns and see limited menu', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[id="admin-login_email"]', 'tech@namphong.vn');
    await page.fill('input[id="admin-login_password"]', 'tech123');
    await page.click('button[type="submit"]');
    
    // Should be redirected to /admin/returns
    await page.waitForURL('**/admin/returns');
    
    // Check menu items
    const menu = page.locator('.ant-layout-sider');
    await expect(menu).toBeVisible();
    await expect(menu.getByText('Đổi trả & Bảo hành')).toBeVisible();
    await expect(menu.getByText('Đơn hàng')).not.toBeVisible();
    await expect(menu.getByText('Sản phẩm')).not.toBeVisible();
    await expect(menu.getByText('Tổng quan')).not.toBeVisible();
  });

  test('ADMIN user should see full dashboard', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[id="admin-login_email"]', 'admin@namphong.vn');
    await page.fill('input[id="admin-login_password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should be at /admin (dashboard)
    await page.waitForURL('**/admin');
    
    // Check menu items
    const menu = page.locator('.ant-layout-sider');
    await expect(menu).toBeVisible();
    await expect(menu.getByText('Đơn hàng')).toBeVisible();
    await expect(menu.getByText('Đổi trả & Bảo hành')).toBeVisible();
    await expect(menu.getByText('Sản phẩm')).toBeVisible();
    // "Tổng quan" is the label for dashboard, not "Thống kê" (which might be what I thought)
    // Let's check layout.tsx again. It says "Tổng quan".
    await expect(menu.getByText('Tổng quan')).toBeVisible();
  });

  test('ADMIN user should be able to open change password modal', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[id="admin-login_email"]', 'admin@namphong.vn');
    await page.fill('input[id="admin-login_password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin');
    
    // Click user avatar to open dropdown
    await page.locator('.ant-avatar').click();
    
    // Click "Đổi mật khẩu"
    await page.getByText('Đổi mật khẩu').click();
    
    // Check modal is visible
    // The title of the modal is "Đổi mật khẩu"
    await expect(page.getByRole('dialog').getByText('Đổi mật khẩu').first()).toBeVisible();
    await expect(page.locator('input[id="currentPassword"]')).toBeVisible();
    await expect(page.locator('input[id="newPassword"]')).toBeVisible();
    await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
  });

});
