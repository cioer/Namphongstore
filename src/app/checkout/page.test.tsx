import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CheckoutPage from './page';
import { message } from 'antd';
import { formatVND } from '@/lib/utils';

// Mock next/link to avoid actual routing complexity in tests
vi.mock('next/link', () => {
  return {
    default: ({ children }: any) => children,
  };
});

// Router mock to assert navigations
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Message spies
const warnSpy = vi.spyOn(message, 'warning');
const errorSpy = vi.spyOn(message, 'error');
const successSpy = vi.spyOn(message, 'success');

// Utility to set a default fetch mock which can be overridden per test
function mockFetch(handler: (url: string, init?: RequestInit) => any) {
  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    return handler(url, init);
  });
}

function okJson(data: any) {
  return Promise.resolve({ ok: true, json: async () => data });
}

function notOkJson(statusData: any) {
  return Promise.resolve({ ok: false, json: async () => statusData });
}

function setCart(items: any[]) {
  window.localStorage.setItem('cart', JSON.stringify(items));
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    pushMock.mockReset();
    warnSpy.mockClear();
    errorSpy.mockClear();
    successSpy.mockClear();
  });

  afterEach(() => {});

  it('redirects to home and warns when cart is empty', async () => {
    setCart([]);

    mockFetch((url) => {
      if (url.endsWith('/api/auth/me')) return notOkJson({});
      return okJson({});
    });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith('Giỏ hàng trống! Vui lòng thêm sản phẩm.');
      expect(pushMock).toHaveBeenCalledWith('/');
    });
  });

  it('prefills customer form fields when authenticated user is returned', async () => {
    setCart([
      { productId: 'p1', name: 'Sản phẩm A', price: '1000000', quantity: 1 },
    ]);

    mockFetch((url) => {
      if (url.endsWith('/api/auth/me')) {
        return okJson({
          user: {
            id: 'u1',
            full_name: 'Nguyễn Văn Test',
            email: 'test@example.com',
            phone: '0901234567',
            address: '123 Đường ABC',
            city: 'Hà Nội',
            district: 'Ba Đình',
            ward: 'Phúc Xá',
          },
        });
      }
      return okJson({});
    });

    render(<CheckoutPage />);

    const nameInput = await screen.findByPlaceholderText('Nguyễn Văn A') as HTMLInputElement;
    const phoneInput = screen.getByPlaceholderText('0901234567') as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText('email@example.com') as HTMLInputElement;
    const addressInput = screen.getByPlaceholderText('Số nhà, tên đường') as HTMLInputElement;

    await waitFor(() => {
      expect(nameInput.value).toBe('Nguyễn Văn Test');
      expect(phoneInput.value).toBe('0901234567');
      expect(emailInput.value).toBe('test@example.com');
      expect(addressInput.value).toBe('123 Đường ABC');
    });
  });

  it('applies a valid coupon by posting to API with correct payload', async () => {
    // subtotal = 1,000,000
    setCart([
      { productId: 'p1', name: 'Sản phẩm A', price: 500000, quantity: 2 },
    ]);

    mockFetch((url, init) => {
      if (url.endsWith('/api/auth/me')) return notOkJson({});
      if (url.endsWith('/api/coupons/check')) {
        return okJson({ valid: true, couponCode: 'SALE50', discount: 50000, message: 'Áp dụng thành công' });
      }
      return okJson({});
    });

    render(<CheckoutPage />);

    const couponInput = await screen.findByPlaceholderText('Mã giảm giá');
    fireEvent.change(couponInput, { target: { value: 'SALE50' } });

    const applyBtn = screen.getByRole('button', { name: 'Áp dụng' });
    fireEvent.click(applyBtn);

    // Assert API was called with expected body
    await waitFor(() => {
      const calls = (global.fetch as any).mock.calls as any[];
      const couponCall = calls.find(([u]: any[]) => (typeof u === 'string' ? u : u.toString()).endsWith('/api/coupons/check'));
      expect(couponCall).toBeTruthy();
      const [, init] = couponCall as [any, RequestInit];
      const body = JSON.parse((init!.body as string) || '{}');
      expect(body.code).toBe('SALE50');
      expect(body.totalAmount).toBe(1000000);
    });
  });

  it('shows error when coupon is invalid and does not apply it', async () => {
    setCart([
      { productId: 'p1', name: 'Sản phẩm A', price: 200000, quantity: 1 },
    ]);

    mockFetch((url) => {
      if (url.endsWith('/api/auth/me')) return notOkJson({});
      if (url.endsWith('/api/coupons/check')) {
        return okJson({ valid: false, message: 'Mã giảm giá không hợp lệ' });
      }
      return okJson({});
    });

    render(<CheckoutPage />);

    const couponInput = await screen.findByPlaceholderText('Mã giảm giá');
    fireEvent.change(couponInput, { target: { value: 'BADCODE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });

    // Ensure applied coupon UI is not shown
    expect(screen.queryByText(/Đã áp dụng mã:/)).toBeNull();
  });

  it('submits order successfully, clears cart, dispatches event, and navigates to success page', async () => {
    setCart([
      { productId: 'p1', name: 'Sản phẩm A', price: 300000, quantity: 2 },
    ]);

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    mockFetch((url, init) => {
      if (url.endsWith('/api/auth/me')) {
        // Prefill all required fields including city to pass validation
        return okJson({
          user: {
            id: 'u1',
            full_name: 'Nguyễn Văn Test',
            email: 'test@example.com',
            phone: '0901234567',
            address: '123 Đường ABC',
            city: 'Hà Nội',
            district: 'Ba Đình',
            ward: 'Phúc Xá',
          },
        });
      }
      if (url.endsWith('/api/orders') && init?.method === 'POST') {
        return okJson({ order: { order_code: 'NP123' } });
      }
      return okJson({});
    });

    render(<CheckoutPage />);

    // Form already pre-filled via /api/auth/me. Just click submit
    const submitBtn = await screen.findByRole('button', { name: 'Đặt hàng' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/orders/success/NP123');
    });

    // Cart should be cleared
    expect(JSON.parse(window.localStorage.getItem('cart') || '[]')).toEqual([]);
    // cartUpdated event dispatched
    expect(dispatchSpy).toHaveBeenCalled();
  });
});
