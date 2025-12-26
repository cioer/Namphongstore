'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Badge, Card, Typography, message, Button, Select, Space, Tag, Image, Alert } from 'antd';
import { LogoutOutlined, ReloadOutlined, SwapOutlined } from '@ant-design/icons';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface ReturnRequest {
  id: string;
  reason: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  images: string[];
  order: {
    order_code: string;
    customer_name: string;
    customer_phone: string;
  };
  warranty_unit: {
    warranty_code_auto: string;
    unit_no: number;
  } | null;
}

const returnStatusConfig: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'orange', text: 'Chờ duyệt' },
  APPROVED: { color: 'cyan', text: 'Đã duyệt' },
  REJECTED: { color: 'red', text: 'Từ chối' },
  COMPLETED: { color: 'green', text: 'Hoàn tất' },
};

export default function AdminReturnsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING'); // Default to pending
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    total: 0
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchReturns();
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

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/returns', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch returns');
      }
      const data = await response.json();
      const returnsData = data.returns || [];
      setReturns(returnsData);
      
      // Calculate stats
      const newStats = {
        pending: returnsData.filter((r: ReturnRequest) => r.status === 'PENDING').length,
        approved: returnsData.filter((r: ReturnRequest) => r.status === 'APPROVED').length,
        rejected: returnsData.filter((r: ReturnRequest) => r.status === 'REJECTED').length,
        completed: returnsData.filter((r: ReturnRequest) => r.status === 'COMPLETED').length,
        total: returnsData.length
      };
      setStats(newStats);
    } catch (error) {
      message.error('Không thể tải danh sách đổi trả');
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

  const filteredReturns = returns
    .filter(ret => {
      const matchesStatus = statusFilter === 'ALL' || ret.status === statusFilter;
      return matchesStatus;
    })
    .sort((a, b) => {
      // Prioritize PENDING status first
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      
      // Then sort by created date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const columns = [
    {
      title: 'Mã YC',
      key: 'id',
      render: (record: ReturnRequest) => (
        <Link href={`/admin/returns/${record.id}`} style={{ fontWeight: 600 }}>
          #{record.id.substring(0, 8)}
        </Link>
      ),
    },
    {
      title: 'Đơn hàng',
      key: 'order',
      render: (record: ReturnRequest) => (
        <div>
          <Link href={`/admin/orders/${record.id}`}>
            <div style={{ fontWeight: 500 }}>{record.order.order_code}</div>
          </Link>
          <small style={{ color: '#666' }}>
            {record.order.customer_name} - {record.order.customer_phone}
          </small>
        </div>
      ),
    },
    {
      title: 'Mã BH',
      key: 'warranty',
      render: (record: ReturnRequest) => (
        record.warranty_unit ? (
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              {record.warranty_unit.warranty_code_auto}
            </div>
            <small style={{ color: '#666' }}>Số {record.warranty_unit.unit_no}</small>
          </div>
        ) : (
          <span style={{ color: '#999' }}>-</span>
        )
      ),
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      width: 250,
    },
    {
      title: 'Hình ảnh',
      key: 'images',
      render: (record: ReturnRequest) => (
        record.images && record.images.length > 0 ? (
          <Image.PreviewGroup>
            <Space size={4}>
              {record.images.slice(0, 3).map((img: string, idx: number) => (
                <Image
                  key={idx}
                  src={img}
                  alt={`Return ${idx + 1}`}
                  width={40}
                  height={40}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
              ))}
              {record.images.length > 3 && (
                <Tag>+{record.images.length - 3}</Tag>
              )}
            </Space>
          </Image.PreviewGroup>
        ) : (
          <span style={{ color: '#999' }}>Không có</span>
        )
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge 
          color={returnStatusConfig[status]?.color || 'default'} 
          text={returnStatusConfig[status]?.text || status} 
        />
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (record: ReturnRequest) => (
        <Link href={`/admin/returns/${record.id}`}>
          <Button type="link" size="small">Chi tiết</Button>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Typography.Title level={2}>Quản lý đổi trả & bảo hành</Typography.Title>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <Card size="small" style={{ background: stats.pending > 0 ? '#fff2e8' : '#fafafa', border: stats.pending > 0 ? '1px solid #ff7a00' : '1px solid #d9d9d9' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: stats.pending > 0 ? '#ff7a00' : '#666' }}>{stats.pending}</div>
              <div style={{ color: '#666' }}>Chờ duyệt</div>
            </div>
          </Card>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>{stats.approved}</div>
              <div style={{ color: '#666' }}>Đã duyệt</div>
            </div>
          </Card>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>{stats.completed}</div>
              <div style={{ color: '#666' }}>Hoàn tất</div>
            </div>
          </Card>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#666' }}>{stats.total}</div>
              <div style={{ color: '#666' }}>Tổng cộng</div>
            </div>
          </Card>
        </div>
        
        <Card>
          {stats.pending > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`Có ${stats.pending} yêu cầu đổi trả chờ duyệt`}
              description="Vui lòng xem xét và phản hồi sớm cho khách hàng."
              style={{ marginBottom: 16 }}
              action={
                <Button 
                  type="primary" 
                  size="small" 
                  onClick={() => setStatusFilter('PENDING')}
                  style={{ backgroundColor: '#ff7a00', borderColor: '#ff7a00' }}
                >
                  Xem ngay
                </Button>
              }
            />
          )}
          
          <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
            <Select
              size="large"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 220 }}
            >
              <Select.Option value="PENDING">🔥 Chờ duyệt ({stats.pending})</Select.Option>
              <Select.Option value="ALL">Tất cả trạng thái</Select.Option>
              {Object.entries(returnStatusConfig)
                .filter(([key]) => key !== 'PENDING')
                .map(([key, { text }]) => (
                  <Select.Option key={key} value={key}>{text}</Select.Option>
                ))
              }
            </Select>
            <Button 
              size="large" 
              icon={<ReloadOutlined />} 
              onClick={fetchReturns}
            >
              Tải lại
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={filteredReturns}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} yêu cầu`,
            }}
          />
        </Card>
      </div>
    </div>
  );
}
