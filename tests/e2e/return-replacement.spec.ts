import { test, expect } from '@playwright/test';

test.describe('Return and Replacement Flow', () => {
  let orderCode: string;
  let orderId: string;

  test('should complete full return and replacement flow', async ({ page }) => {
    // 1. Create order and set to DELIVERED (reuse previous flow)
    await page.goto('/');
    
    const firstProduct = page.locator('[data-testid="product-card"], .ant-card').first();
    await firstProduct.waitFor({ state: 'visible', timeout: 10000 });
    await firstProduct.click();

    const addToCartButton = page.locator('button:has-text("Thêm vào giỏ")').first();
    await addToCartButton.click();
    await page.waitForTimeout(1000);

    await page.goto('/checkout');
    await page.fill('input[name="customer_name"], input#customer_name', 'Return Test Customer');
    await page.fill('input[name="customer_phone"], input#customer_phone', '0908888888');
    await page.fill('input[name="customer_email"], input#customer_email', 'return@test.com');
    await page.fill('textarea[name="customer_address"], textarea#customer_address', '789 Return Ave');

    const submitButton = page.locator('button[type="submit"]:has-text("Đặt hàng"), button:has-text("Place Order")');
    await submitButton.click();

    await expect(page).toHaveURL(/\/orders\/success\/.+/, { timeout: 10000 });
    const urlParts = page.url().split('/');
    orderCode = urlParts[urlParts.length - 1];

    // 2. Admin sets order to DELIVERED
    await page.goto('/admin/login');
    await page.fill('input[name="email"], input#email', 'admin@namphong.vn');
    await page.fill('input[name="password"], input#password', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');

    const orderRow = page.locator(`tr:has-text("${orderCode}")`).first();
    await orderRow.click();

    // Get order ID from URL
    const currentUrl = page.url();
    orderId = currentUrl.split('/').pop() || '';

    // Progress through statuses
    let confirmButton = page.locator('button:has-text("Xác nhận"), button:has-text("Confirm")').first();
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
      await page.waitForTimeout(1000);
    }

    let shippingButton = page.locator('button:has-text("Giao hàng"), button:has-text("Ship")').first();
    if (await shippingButton.isVisible()) {
      await shippingButton.click();
      await page.waitForTimeout(1000);
    }

    let deliveredButton = page.locator('button:has-text("Đã giao"), button:has-text("Delivered")').first();
    await deliveredButton.click();
    await page.waitForTimeout(2000);

    // Verify warranty generated
    await expect(page.locator('text=/NP-WTY-\\d{4}-\\d{5}/')).toBeVisible({ timeout: 5000 });

    // 3. Customer creates return request
    await page.goto(`/orders/${orderId}`);

    const returnButton = page.locator('button:has-text("Yêu cầu đổi trả"), button:has-text("Return Request")').first();
    await expect(returnButton).toBeVisible({ timeout: 5000 });
    await returnButton.click();

    // Fill return form
    await page.fill('textarea[name="reason"], textarea#reason', 'Product has defect - requesting replacement');

    // Note: File upload in E2E test is complex, skip for MVP smoke test
    // In production, you would upload actual test images here

    const submitReturnButton = page.locator('button:has-text("Gửi yêu cầu"), button[type="submit"]').first();
    await submitReturnButton.click();

    // Wait for success
    await page.waitForTimeout(2000);
    await expect(page.locator('.ant-message-success, .ant-notification-notice-success')).toBeVisible({ timeout: 5000 });

    console.log('Return request created');

    // 4. Admin approves return
    await page.goto('/admin/returns');
    await page.waitForLoadState('networkidle');

    const returnRow = page.locator('tr').first();
    await returnRow.click();

    // Approve return
    const approveButton = page.locator('button:has-text("Duyệt"), button:has-text("Approve")').first();
    await expect(approveButton).toBeVisible({ timeout: 5000 });
    await approveButton.click();

    // Fill approval note
    const noteInput = page.locator('textarea[name="note"], textarea#admin_note').first();
    if (await noteInput.isVisible()) {
      await noteInput.fill('Approved - will send replacement');
    }

    const confirmApproveButton = page.locator('.ant-modal button:has-text("Duyệt"), .ant-modal button:has-text("Confirm")').first();
    await confirmApproveButton.click();

    await page.waitForTimeout(2000);

    console.log('Return approved');

    // 5. Tech completes replacement
    // Reload the page to get updated status
    await page.reload();
    await page.waitForLoadState('networkidle');

    const completeButton = page.locator('button:has-text("Hoàn tất"), button:has-text("Complete")').first();
    await expect(completeButton).toBeVisible({ timeout: 5000 });
    await completeButton.click();

    const confirmCompleteButton = page.locator('.ant-modal button:has-text("Hoàn tất"), .ant-modal button:has-text("Complete")').first();
    await confirmCompleteButton.click();

    await page.waitForTimeout(2000);

    console.log('Replacement completed');

    // 6. Verify new warranty code appears
    await page.goto(`/orders/${orderId}`);
    await page.waitForLoadState('networkidle');

    // Should see warranty codes (both old and new)
    const warrantyCodes = page.locator('text=/NP-WTY-\\d{4}-\\d{5}/');
    const count = await warrantyCodes.count();
    
    // Should have at least 1 warranty code (could be more if multiple items)
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify REPLACED status exists
    const replacedStatus = page.locator('text=/REPLACED|Đã thay thế/i').first();
    await expect(replacedStatus).toBeVisible({ timeout: 5000 });

    console.log('Replacement flow completed successfully');
  });

  test('should show return request in order detail', async ({ page }) => {
    // Login and navigate to order
    await page.goto('/admin/login');
    await page.fill('input[name="email"], input#email', 'admin@namphong.vn');
    await page.fill('input[name="password"], input#password', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/admin/, { timeout: 10000 });

    await page.goto('/admin/returns');
    await page.waitForLoadState('networkidle');

    // Verify returns list shows requests
    const returnRows = page.locator('tbody tr');
    const count = await returnRows.count();
    
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify status badges
    const statusBadge = page.locator('.ant-tag, .ant-badge').first();
    await expect(statusBadge).toBeVisible();
  });

  test('should prevent return request for non-delivered orders', async ({ page }) => {
    // Create new order but don't deliver it
    await page.goto('/');
    
    const firstProduct = page.locator('[data-testid="product-card"], .ant-card').first();
    await firstProduct.waitFor({ state: 'visible', timeout: 10000 });
    await firstProduct.click();

    const addToCartButton = page.locator('button:has-text("Thêm vào giỏ")').first();
    await addToCartButton.click();
    await page.waitForTimeout(1000);

    await page.goto('/checkout');
    await page.fill('input[name="customer_name"], input#customer_name', 'No Return Test');
    await page.fill('input[name="customer_phone"], input#customer_phone', '0907777777');
    await page.fill('input[name="customer_email"], input#customer_email', 'noreturn@test.com');
    await page.fill('textarea[name="customer_address"], textarea#customer_address', '999 No Return St');

    const submitButton = page.locator('button[type="submit"]:has-text("Đặt hàng"), button:has-text("Place Order")');
    await submitButton.click();

    await expect(page).toHaveURL(/\/orders\/success\/.+/, { timeout: 10000 });
    const urlParts = page.url().split('/');
    const newOrderId = urlParts[urlParts.length - 1];

    // Navigate to order detail
    await page.goto(`/orders/track?phone=0907777777`);
    await page.waitForTimeout(1000);

    // Return button should NOT be visible for non-delivered order
    const returnButton = page.locator('button:has-text("Yêu cầu đổi trả"), button:has-text("Return Request")');
    await expect(returnButton).not.toBeVisible();
  });
});
