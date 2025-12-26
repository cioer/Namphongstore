'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Typography, Card, Empty, Spin, Tag, Space, Button, Divider } from 'antd';
import { ShoppingOutlined, PhoneOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { formatVND } from '@/lib/utils';

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total_amount: number | string;
  created_at: string;
  delivered_date?: string | null;
  items: any[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Mới', color: 'blue' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'cyan' },
  SHIPPING: { label: 'Đang giao', color: 'orange' },
  DELIVERED: { label: 'Đã giao', color: 'green' },
  CANCELLED_BY_CUSTOMER: { label: 'Đã hủy bởi khách', color: 'red' },
  CANCELLED_BY_SHOP: { label: 'Đã hủy bởi cửa hàng', color: 'red' },
};

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!phone) {
      router.push('/track-order');
      return;
    }
    fetchOrders();
  }, [phone]);

  const fetchOrders = async () => {
    if (!phone) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '40px 50px', 
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px 50px', minHeight: 'calc(100vh - 200px)' }}>
        <Card>
          <Empty
            description={error}
          >
            <Link href="/track-order">
              <Button type="primary">Thử lại</Button>
            </Link>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 50px', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={2}>
          <ShoppingOutlined /> Đơn hàng của bạn
        </Typography.Title>
        <Link href="/track-order">
          <Button icon={<PhoneOutlined />}>
            Tra cứu SĐT khác
          </Button>
        </Link>
      </div>

      <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#e6f7ff', borderRadius: '8px' }}>
        <Typography.Text>
          <PhoneOutlined /> Số điện thoại: <Typography.Text strong>{phone}</Typography.Text>
        </Typography.Text>
        <Typography.Text style={{ marginLeft: '20px' }}>
          Tổng số đơn hàng: <Typography.Text strong>{orders.length}</Typography.Text>
        </Typography.Text>
      </div>

      {orders.length === 0 ? (
        <Card>
          <Empty
            description="Không tìm thấy đơn hàng nào với số điện thoại này"
          >
            <Space>
              <Link href="/">
                <Button type="primary">Mua sắm ngay</Button>
              </Link>
              <Link href="/track-order">
                <Button>Thử SĐT khác</Button>
              </Link>
            </Space>
          </Empty>
        </Card>
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {orders.map((order) => (
            <Card
              key={order.id}
              hoverable
              onClick={() => router.push(`/orders/${order.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div>
                      <Typography.Text strong style={{ fontSize: '16px' }}>
                        Đơn hàng #{order.order_code}
                      </Typography.Text>
                      <Tag 
                        color={statusConfig[order.status]?.color || 'default'}
                        style={{ marginLeft: '12px' }}
                      >
                        {statusConfig[order.status]?.label || order.status}
                      </Tag>
                    </div>

                    <div>
                      <ClockCircleOutlined style={{ marginRight: '8px', color: '#999' }} />
                      <Typography.Text type="secondary">
                        Đặt ngày: {new Date(order.created_at).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography.Text>
                    </div>

                    <div>
                      <Typography.Text type="secondary">
                        {order.items.length} sản phẩm
                      </Typography.Text>
                      <Divider type="vertical" />
                      <Typography.Text strong style={{ color: '#ff4d4f', fontSize: '18px' }}>
                        {formatVND(order.total_amount)}
                      </Typography.Text>
                    </div>
                  </Space>
                </div>

                <Button type="primary">
                  Xem chi tiết
                </Button>
              </div>
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}><Spin size="large" /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
