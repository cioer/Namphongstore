'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Typography, Button, Form, Input, Select, Card, Divider, Space, message, Spin, InputNumber } from 'antd';
import { ShoppingCartOutlined, EnvironmentOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatVND } from '@/lib/utils';

const { Option } = Select;
const { TextArea } = Input;

interface CartItem {
  productId: string;
  name: string;
  price: number | string;
  quantity: number;
}

const vnCities = [
  'Hà Nội',
  'TP Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Tĩnh',
  'Hải Dương',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái',
];

export default function CheckoutPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadCart();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user) {
          form.setFieldsValue({
            customer_name: data.user.full_name,
            customer_email: data.user.email,
            customer_phone: data.user.phone,
            customer_address: data.user.address,
            customer_city: data.user.city,
            customer_district: data.user.district,
            customer_ward: data.user.ward,
          });
        }
      }
    } catch (error) {
      console.error('Auth check failed', error);
    }
  };

  const loadCart = () => {
    // Try to get items specifically selected for checkout first
    const checkoutItems = localStorage.getItem('checkout_items');
    let cartData = [];

    if (checkoutItems) {
      cartData = JSON.parse(checkoutItems);
    } else {
      // Fallback to full cart if no specific checkout items found
      cartData = JSON.parse(localStorage.getItem('cart') || '[]');
    }

    if (cartData.length === 0) {
      message.warning('Không có sản phẩm nào để thanh toán.');
      router.push('/cart');
      return;
    }
    setCart(cartData);
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      return sum + (price * item.quantity);
    }, 0);
    
    if (appliedCoupon) {
      return Math.max(0, subtotal - appliedCoupon.discount);
    }
    return subtotal;
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    const updatedCart = cart.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem('checkout_items', JSON.stringify(updatedCart));
  };
  
  const removeItem = (productId: string) => {
    const updatedCart = cart.filter(item => item.productId !== productId);
    setCart(updatedCart);
    localStorage.setItem('checkout_items', JSON.stringify(updatedCart));

    // If no items left, redirect to cart
    if (updatedCart.length === 0) {
      message.info('Không còn sản phẩm nào để thanh toán');
      router.push('/cart');
    }
  };

  const handleCheckCoupon = async () => {
    if (!couponCode.trim()) {
      message.error('Vui lòng nhập mã giảm giá');
      return;
    }

    setCheckingCoupon(true);
    try {
      const subtotal = cart.reduce((sum, item) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        return sum + (price * item.quantity);
      }, 0);

      const res = await fetch('/api/coupons/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          totalAmount: subtotal,
          userId: user?.id
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setAppliedCoupon({
          code: data.couponCode,
          discount: data.discount,
        });
        message.success(data.message);
      } else {
        setAppliedCoupon(null);
        message.error(data.message);
      }
    } catch (error) {
      message.error('Lỗi khi kiểm tra mã giảm giá');
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (submitting) return; // Prevent double submit
    
    setSubmitting(true);

    try {
      // Prepare order data
      const orderData = {
        customer_name: values.customer_name,
        customer_phone: values.customer_phone,
        customer_email: values.customer_email || null,
        customer_address: values.customer_address,
        customer_ward: values.customer_ward || null,
        customer_district: values.customer_district || null,
        customer_city: values.customer_city,
        notes: values.notes || null,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        coupon_code: appliedCoupon?.code,
        discount_amount: appliedCoupon?.discount,
        userId: user?.id,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đặt hàng thất bại');
      }

      // Clear cart
      localStorage.setItem('cart', JSON.stringify([]));
      window.dispatchEvent(new Event('cartUpdated'));

      // Redirect to success page
      router.push(`/orders/success/${data.order.order_code}`);
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi đặt hàng');
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div style={{ padding: '40px 50px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 50px', minHeight: 'calc(100vh - 200px)' }}>
      <Typography.Title level={2}>
        <ShoppingCartOutlined /> Thanh toán
      </Typography.Title>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        {/* Checkout Form */}
        <Card style={{ flex: 1 }}>
          <Typography.Title level={4}>
            <EnvironmentOutlined /> Thông tin giao hàng
          </Typography.Title>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              label="Họ và tên"
              name="customer_name"
              rules={[
                { required: true, message: 'Vui lòng nhập họ tên' },
                { min: 3, message: 'Họ tên phải có ít nhất 3 ký tự' },
              ]}
            >
              <Input placeholder="Nguyễn Văn A" size="large" />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="customer_phone"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại' },
                { pattern: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/, message: 'Số điện thoại không hợp lệ' },
              ]}
            >
              <Input placeholder="0901234567" size="large" />
            </Form.Item>

            <Form.Item
              label="Email (tùy chọn)"
              name="customer_email"
              rules={[
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input placeholder="email@example.com" size="large" />
            </Form.Item>

            <Form.Item
              label="Địa chỉ"
              name="customer_address"
              rules={[
                { required: true, message: 'Vui lòng nhập địa chỉ' },
                { min: 10, message: 'Địa chỉ phải có ít nhất 10 ký tự' },
              ]}
            >
              <Input placeholder="Số nhà, tên đường" size="large" />
            </Form.Item>

            <Space style={{ width: '100%' }} size="large">
              <Form.Item
                label="Phường/Xã"
                name="customer_ward"
                style={{ flex: 1, minWidth: '150px' }}
              >
                <Input placeholder="Phường 1" size="large" />
              </Form.Item>

              <Form.Item
                label="Quận/Huyện"
                name="customer_district"
                style={{ flex: 1, minWidth: '150px' }}
              >
                <Input placeholder="Quận 1" size="large" />
              </Form.Item>
            </Space>

            <Form.Item
              label="Tỉnh/Thành phố"
              name="customer_city"
              rules={[
                { required: true, message: 'Vui lòng chọn tỉnh/thành phố' },
              ]}
            >
              <Select
                placeholder="Chọn tỉnh/thành phố"
                size="large"
                showSearch
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                options={vnCities.map(city => ({ label: city, value: city }))}
              />
            </Form.Item>

            <Form.Item
              label="Ghi chú (tùy chọn)"
              name="notes"
            >
              <TextArea
                placeholder="Ghi chú về đơn hàng, ví dụ: giao giờ hành chính"
                rows={3}
              />
            </Form.Item>

            <Divider />

            <div style={{ marginBottom: '20px', padding: '15px', background: '#e6f7ff', borderRadius: '8px' }}>
              <Typography.Text strong>Phương thức thanh toán: </Typography.Text>
              <Typography.Text>Thanh toán khi nhận hàng (COD)</Typography.Text>
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                ✓ Miễn phí vận chuyển toàn quốc<br />
                ✓ Kiểm tra hàng trước khi thanh toán
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={submitting}
              block
              style={{ height: '50px', fontSize: '18px' }}
            >
              Đặt hàng
            </Button>
          </Form>
        </Card>

        {/* Order Summary */}
        <Card style={{ width: '400px', position: 'sticky', top: '80px' }}>
          <Typography.Title level={4}>Đơn hàng ({cart.length} sản phẩm)</Typography.Title>

          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
            {cart.map(item => (
              <div
                key={item.productId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <div style={{ flex: 1 }}>
                  <Typography.Text strong style={{ fontSize: '14px' }}>
                    {item.name}
                  </Typography.Text>
                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <InputNumber
                      size="small"
                      min={1}
                      max={99}
                      value={item.quantity}
                      onChange={(value) => updateQuantity(item.productId, value || 1)}
                    />
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      size="small"
                      onClick={() => removeItem(item.productId)}
                    />
                  </div>
                </div>
                <Typography.Text strong style={{ color: '#ff4d4f' }}>
                  {formatVND(
                    (typeof item.price === 'string' ? parseFloat(item.price) : item.price) * item.quantity
                  )}
                </Typography.Text>
              </div>
            ))}
          </div>

          <Divider />

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Typography.Text>Tạm tính:</Typography.Text>
              <Typography.Text strong>{formatVND(calculateTotal())}</Typography.Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Typography.Text>Phí vận chuyển:</Typography.Text>
              <Typography.Text strong style={{ color: '#52c41a' }}>Miễn phí</Typography.Text>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input 
                  placeholder="Mã giảm giá" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={!!appliedCoupon}
                />
                <Button 
                  type="primary" 
                  onClick={handleCheckCoupon}
                  loading={checkingCoupon}
                  disabled={!!appliedCoupon}
                >
                  Áp dụng
                </Button>
              </Space.Compact>
              {appliedCoupon && (
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text type="success">
                    Đã áp dụng mã: <strong>{appliedCoupon.code}</strong>
                  </Typography.Text>
                  <Button 
                    type="link" 
                    danger 
                    size="small" 
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode('');
                    }}
                  >
                    Xóa
                  </Button>
                </div>
              )}
            </div>

            {appliedCoupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Typography.Text>Giảm giá:</Typography.Text>
                <Typography.Text strong style={{ color: '#52c41a' }}>
                  -{formatVND(appliedCoupon.discount)}
                </Typography.Text>
              </div>
            )}
          </div>

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Typography.Text strong style={{ fontSize: '18px' }}>Tổng cộng:</Typography.Text>
            <Typography.Text strong style={{ fontSize: '24px', color: '#ff4d4f' }}>
              {formatVND(calculateTotal())}
            </Typography.Text>
          </div>

          <Link href="/cart">
            <Button block>Quay lại giỏ hàng</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
