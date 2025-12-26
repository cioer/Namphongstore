'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Badge, Input, Select, Card, message, Button, Space } from 'antd';
import { Typography } from 'antd';
import { SearchOutlined, LogoutOutlined, ReloadOutlined } from '@ant-design/icons';
import { formatVND } from '@/lib/utils';
import Link from 'next/link';

const { Search } = Input;
const { Title } = Typography;

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  total_amount: string;
  status: string;
  created_at: string;
  delivered_date: string | null;
  items: { quantity: number }[];
}

const statusConfig: Record<string, { color: string; text: string }> = {
  NEW: { color: 'blue', text: 'Mới' },
  CONFIRMED: { color: 'cyan', text: 'Đã xác nhận' },
  SHIPPING: { color: 'orange', text: 'Đang giao' },
  DELIVERED: { color: 'green', text: 'Đã giao' },
  CANCELLED_BY_CUSTOMER: { color: 'red', text: 'Khách hủy' },
  CANCELLED_BY_SHOP: { color: 'volcano', text: 'Shop hủy' },
};

export default function AdminOrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchOrders();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth', {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (!data.user) {
        router.push('/admin/login');
        return;
      }
      
      setUser(data.user);
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/orders', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      message.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { 
        method: 'DELETE',
        credentials: 'include',
      });
      message.success('Đã đăng xuất');
      router.push('/admin/login');
    } catch (error) {
      message.error('Có lỗi khi đăng xuất');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_code.toLowerCase().includes(searchText.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchText.toLowerCase()) ||
      order.customer_phone.includes(searchText);
    
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'order_code',
      key: 'order_code',
      render: (text: string, record: Order) => (
        <Link href={`/admin/orders/${record.id}`} style={{ fontWeight: 600 }}>
          {text}
        </Link>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (record: Order) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.customer_name}</div>
          <small style={{ color: '#666' }}>{record.customer_phone}</small>
        </div>
      ),
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'customer_city',
      key: 'customer_city',
    },
    {
      title: 'Số lượng',
      key: 'total_items',
      render: (record: Order) => {
        const totalQty = record.items.reduce((sum, item) => sum + item.quantity, 0);
        return `${totalQty} sản phẩm`;
      },
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: string) => (
        <strong style={{ color: '#d32f2f' }}>{formatVND(Number(amount))}</strong>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge 
          color={statusConfig[status]?.color || 'default'} 
          text={statusConfig[status]?.text || status} 
        />
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (record: Order) => (
        <Link href={`/admin/orders/${record.id}`}>
          <Button type="link" size="small">Xem chi tiết</Button>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={2}>Quản lý đơn hàng</Title>
        </div>
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Search
              placeholder="Tìm theo mã đơn, tên, SĐT..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              style={{ flex: 1, minWidth: 300 }}
              onChange={e => setSearchText(e.target.value)}
            />
            <Select
              size="large"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 200 }}
            >
              <Select.Option value="ALL">Tất cả trạng thái</Select.Option>
              {Object.entries(statusConfig).map(([key, { text }]) => (
                <Select.Option key={key} value={key}>{text}</Select.Option>
              ))}
            </Select>
            <Button 
              size="large" 
              icon={<ReloadOutlined />} 
              onClick={fetchOrders}
            >
              Tải lại
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={filteredOrders}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} đơn hàng`,
            }}
          />
        </Card>
      </div>
    </div>
  );
}
