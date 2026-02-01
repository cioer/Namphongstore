'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Typography, Button, Empty, Table, InputNumber, Space, Divider, Card, message } from 'antd';
import { ShoppingCartOutlined, DeleteOutlined, ShoppingOutlined } from '@ant-design/icons';
import { formatVND, handleImageError } from '@/lib/utils';

interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number | string;
  quantity: number;
  image?: string;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(cartData);
    // Default select all items
    setSelectedRowKeys(cartData.map((item: CartItem) => item.productId));
    setLoading(false);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }

    const updatedCart = cart.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (productId: string) => {
    const updatedCart = cart.filter(item => item.productId !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    message.success('Đã xóa sản phẩm khỏi giỏ hàng');
  };

  const clearCart = () => {
    setCart([]);
    localStorage.setItem('cart', JSON.stringify([]));
    window.dispatchEvent(new Event('cartUpdated'));
    message.success('Đã xóa toàn bộ giỏ hàng');
  };

  const calculateTotal = () => {
    return cart
      .filter(item => selectedRowKeys.includes(item.productId))
      .reduce((sum, item) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        return sum + (price * item.quantity);
      }, 0);
  };

  const handleCheckout = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
      return;
    }
    const selectedItems = cart.filter(item => selectedRowKeys.includes(item.productId));
    localStorage.setItem('checkout_items', JSON.stringify(selectedItems));
    router.push('/checkout');
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (item: CartItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa'
          }}>
            <img
              src={item.image || 'https://via.placeholder.com/80x80.png?text=Product'}
              alt={item.name}
              onError={handleImageError}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <Link href={`/p/${item.slug}`}>
              <Typography.Text strong style={{ color: '#1890ff', cursor: 'pointer' }}>
                {item.name}
              </Typography.Text>
            </Link>
          </div>
        </div>
      ),
    },
    {
      title: 'Đơn giá',
      key: 'price',
      render: (item: CartItem) => (
        <Typography.Text strong style={{ color: '#ff4d4f' }}>
          {formatVND(item.price)}
        </Typography.Text>
      ),
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      render: (item: CartItem) => (
        <InputNumber
          min={1}
          max={99}
          value={item.quantity}
          onChange={(value) => updateQuantity(item.productId, value || 1)}
        />
      ),
    },
    {
      title: 'Tổng',
      key: 'total',
      render: (item: CartItem) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        return (
          <Typography.Text strong style={{ fontSize: '16px', color: '#ff4d4f' }}>
            {formatVND(price * item.quantity)}
          </Typography.Text>
        );
      },
    },
    {
      title: '',
      key: 'action',
      render: (item: CartItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(item.productId)}
        >
          Xóa
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: '40px 50px' }}>
        <Typography.Title level={2}>
          <ShoppingCartOutlined /> Giỏ hàng
        </Typography.Title>
        <div>Đang tải...</div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={{ padding: '40px 50px', minHeight: 'calc(100vh - 200px)' }}>
        <Typography.Title level={2}>
          <ShoppingCartOutlined /> Giỏ hàng
        </Typography.Title>
        <Empty
          description="Giỏ hàng của bạn đang trống"
          style={{ padding: '60px 0' }}
        >
          <Link href="/">
            <Button type="primary" icon={<ShoppingOutlined />}>
              Tiếp tục mua sắm
            </Button>
          </Link>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 50px', minHeight: 'calc(100vh - 200px)' }}>
      <Typography.Title level={2}>
        <ShoppingCartOutlined /> Giỏ hàng ({cart.length} sản phẩm)
      </Typography.Title>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={cart}
        rowKey="productId"
        pagination={false}
        style={{ background: '#fff', marginBottom: '20px' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
        <Space>
          <Link href="/">
            <Button icon={<ShoppingOutlined />}>
              Tiếp tục mua sắm
            </Button>
          </Link>
          <Button danger onClick={clearCart}>
            Xóa toàn bộ giỏ hàng
          </Button>
        </Space>

        <Card style={{ width: '400px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Typography.Text>Tạm tính:</Typography.Text>
              <Typography.Text strong>{formatVND(calculateTotal())}</Typography.Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Typography.Text>Phí vận chuyển:</Typography.Text>
              <Typography.Text strong style={{ color: '#52c41a' }}>Miễn phí</Typography.Text>
            </div>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <Typography.Text strong style={{ fontSize: '18px' }}>Tổng cộng:</Typography.Text>
            <Typography.Text strong style={{ fontSize: '24px', color: '#ff4d4f' }}>
              {formatVND(calculateTotal())}
            </Typography.Text>
          </div>

          <Button
            type="primary"
            size="large"
            block
            onClick={handleCheckout}
            disabled={selectedRowKeys.length === 0}
          >
            Tiến hành đặt hàng ({selectedRowKeys.length})
          </Button>

          <div style={{ marginTop: '12px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
            ✓ Thanh toán khi nhận hàng (COD)
          </div>
        </Card>
      </div>
    </div>
  );
}
