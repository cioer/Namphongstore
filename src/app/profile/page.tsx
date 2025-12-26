'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Tabs, List, Tag, Button, Space, Spin, Descriptions, Avatar, Empty } from 'antd';
import { UserOutlined, ShoppingOutlined, LogoutOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatVND, getFirstImage } from '@/lib/utils';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

const { Title, Text } = Typography;

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch user
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();

      if (!userData.user) {
        router.push('/login');
        return;
      }
      setUser(userData.user);

      // Fetch orders
      const ordersRes = await fetch('/api/profile/orders');
      const ordersData = await ordersRes.json();
      setOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  const statusColors: any = {
    NEW: 'blue',
    CONFIRMED: 'cyan',
    SHIPPING: 'orange',
    DELIVERED: 'green',
    CANCELLED_BY_CUSTOMER: 'red',
    CANCELLED_BY_SHOP: 'red',
  };

  const statusLabels: any = {
    NEW: 'Mới đặt',
    CONFIRMED: 'Đã xác nhận',
    SHIPPING: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED_BY_CUSTOMER: 'Đã hủy (Khách)',
    CANCELLED_BY_SHOP: 'Đã hủy (Shop)',
  };

  const getProductStatus = (item: any, order: any) => {
    if (order.status === 'CANCELLED_BY_CUSTOMER' || order.status === 'CANCELLED_BY_SHOP') {
      return { text: 'Đã hủy', color: 'red' };
    }
    if (order.status === 'NEW' || order.status === 'CONFIRMED') {
      return { text: 'Đang xử lý', color: 'blue' };
    }
    if (order.status === 'SHIPPING') {
      return { text: 'Đang giao hàng', color: 'orange' };
    }
    if (order.status === 'DELIVERED') {
      let endDate = null;
      
      // Check warranty units first
      if (item.warranty_units && item.warranty_units.length > 0) {
         // Use the latest end date
         const dates = item.warranty_units.map((u: any) => dayjs(u.end_date));
         // Sort descending
         endDate = dates.sort((a: any, b: any) => b.valueOf() - a.valueOf())[0];
      } else if (order.delivered_date) {
         // Fallback to order delivered date + warranty snapshot
         endDate = dayjs(order.delivered_date).add(item.warranty_months_snapshot || 12, 'month');
      }

      if (endDate) {
        const now = dayjs();
        if (endDate.isBefore(now)) {
          return { text: 'Hết bảo hành', color: 'default' };
        } else {
          const diffDays = endDate.diff(now, 'day');
          const diffMonths = endDate.diff(now, 'month');
          
          let remainingText = '';
          if (diffMonths > 0) remainingText = `Còn ${diffMonths} tháng bảo hành`;
          else remainingText = `Còn ${diffDays} ngày bảo hành`;

          return { text: remainingText, color: 'green' };
        }
      }
      return { text: 'Đã giao', color: 'green' };
    }
    return { text: 'Không xác định', color: 'default' };
  };

  const purchasedProducts = orders.flatMap(order => 
    order.items.map((item: any) => ({
      ...item,
      order: order
    }))
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Tài khoản của tôi</Title>
        <Button icon={<LogoutOutlined />} onClick={handleLogout}>Đăng xuất</Button>
      </div>

      <div style={{ display: 'flex', gap: 24, flexDirection: 'row' }}>
        {/* Sidebar / User Info */}
        <Card style={{ width: 300, height: 'fit-content' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Avatar size={64} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
            <Title level={4}>{user?.full_name}</Title>
            <Text type="secondary">{user?.email}</Text>
          </div>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Số điện thoại">{user?.phone || 'Chưa cập nhật'}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{user?.address || 'Chưa cập nhật'}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Main Content */}
        <Card style={{ flex: 1 }}>
          <Tabs
            items={[
              {
                key: 'products',
                label: (<span><AppstoreOutlined /> Sản phẩm đã mua</span>),
                children: (
                  <List
                    itemLayout="horizontal"
                    dataSource={purchasedProducts}
                    locale={{ emptyText: <Empty description="Chưa có sản phẩm nào" /> }}
                    renderItem={(item: any) => {
                      const status = getProductStatus(item, item.order);
                      return (
                        <List.Item
                          actions={[
                            <Link key="view" href={`/p/${item.product.slug}`}>
                              <Button type="link">Xem sản phẩm</Button>
                            </Link>
                          ]}
                          style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, marginBottom: 16 }}
                        >
                          <List.Item.Meta
                            avatar={<Avatar shape="square" size={80} src={getFirstImage(item.product.images)} />}
                            title={
                              <Space direction="vertical" size={0}>
                                <Text strong>{item.snapshot_name}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>Đơn hàng: #{item.order.order_code}</Text>
                              </Space>
                            }
                            description={
                              <Space direction="vertical" size={4}>
                                <Text>Số lượng: {item.quantity}</Text>
                                <Tag color={status.color}>{status.text}</Tag>
                              </Space>
                            }
                          />
                          <div style={{ alignSelf: 'center' }}>
                            <Text strong style={{ fontSize: 16 }}>{formatVND(item.unit_price_at_purchase)}</Text>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                ),
              },
              {
                key: 'orders',
                label: (<span><ShoppingOutlined /> Đơn hàng của tôi</span>),
                children: (
                  <List
                    itemLayout="vertical"
                    dataSource={orders}
                    renderItem={(order: any) => (
                      <List.Item
                        key={order.id}
                        style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, marginBottom: 16 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Space>
                            <Text strong>#{order.order_code}</Text>
                            <Text type="secondary">{new Date(order.created_at).toLocaleDateString('vi-VN')}</Text>
                          </Space>
                          <Tag color={statusColors[order.status]}>{statusLabels[order.status]}</Tag>
                        </div>
                        
                        <List
                          dataSource={order.items}
                          renderItem={(item: any) => (
                            <List.Item style={{ padding: '8px 0' }}>
                              <List.Item.Meta
                                title={item.snapshot_name}
                                description={`Số lượng: ${item.quantity}`}
                              />
                              <div>{formatVND(item.unit_price_at_purchase)}</div>
                            </List.Item>
                          )}
                        />
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                          <Space>
                            <Text>Tổng tiền:</Text>
                            <Text type="danger" strong style={{ fontSize: 16 }}>{formatVND(order.total_amount)}</Text>
                            <Link href={`/orders/${order.id}`}>
                              <Button type="primary" ghost>Xem chi tiết</Button>
                            </Link>
                          </Space>
                        </div>
                      </List.Item>
                    )}
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
