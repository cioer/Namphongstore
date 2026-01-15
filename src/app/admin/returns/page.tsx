'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Badge, Card, Typography, message, Button, Select, Space, Tag, Image, Alert, Tabs } from 'antd';
import { LogoutOutlined, ReloadOutlined, SwapOutlined, ToolOutlined } from '@ant-design/icons';
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
    product_name?: string;
  } | null;
}

interface WarrantyService {
  id: string;
  service_type: string;
  service_status: string;
  description: string;
  customer_note?: string;
  created_at: string;
  completed_at?: string | null;
  customer: {
    full_name: string;
    phone: string;
    email: string;
  };
  warranty_unit: {
    warranty_code_auto: string;
    product_name: string;
  };
}

const returnStatusConfig: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'orange', text: 'Chờ duyệt' },
  APPROVED: { color: 'cyan', text: 'Đã duyệt' },
  REJECTED: { color: 'red', text: 'Từ chối' },
  COMPLETED: { color: 'green', text: 'Hoàn tất' },
};

const serviceStatusConfig: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'orange', text: 'Chờ tiếp nhận' },
  IN_PROGRESS: { color: 'blue', text: 'Đang xử lý' },
  COMPLETED: { color: 'green', text: 'Hoàn thành' },
};

const serviceTypeConfig: Record<string, { color: string; text: string; icon: any }> = {
  WARRANTY: { color: 'gold', text: 'Bảo hành', icon: <ToolOutlined /> },
  REPAIR: { color: 'purple', text: 'Sửa chữa', icon: <ToolOutlined /> },
};

export default function AdminReturnsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [services, setServices] = useState<WarrantyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [activeTab, setActiveTab] = useState('returns');
  const router = useRouter();

  const [returnStats, setReturnStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    total: 0
  });

  const [serviceStats, setServiceStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    total: 0
  });

  useEffect(() => {
    checkAuth();
    fetchData();
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

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchReturns(), fetchServices()]);
    setLoading(false);
  };

  const fetchReturns = async () => {
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
      
      setReturnStats({
        pending: returnsData.filter((r: ReturnRequest) => r.status === 'PENDING').length,
        approved: returnsData.filter((r: ReturnRequest) => r.status === 'APPROVED').length,
        rejected: returnsData.filter((r: ReturnRequest) => r.status === 'REJECTED').length,
        completed: returnsData.filter((r: ReturnRequest) => r.status === 'COMPLETED').length,
        total: returnsData.length
      });
    } catch (error) {
      console.error(error);
      message.error('Không thể tải danh sách đổi trả');
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/warranty-services', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      const servicesData = data.services || [];
      setServices(servicesData);

      setServiceStats({
        pending: servicesData.filter((s: WarrantyService) => s.service_status === 'PENDING').length,
        processing: servicesData.filter((s: WarrantyService) => s.service_status === 'IN_PROGRESS').length,
        completed: servicesData.filter((s: WarrantyService) => s.service_status === 'COMPLETED').length,
        cancelled: 0, // Not supported in current schema
        total: servicesData.length
      });
    } catch (error) {
      console.error(error);
      // Fail silently or show weak warning
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

  // Filter Logic
  const filteredReturns = returns
    .filter(ret => statusFilter === 'ALL' || ret.status === statusFilter)
    .sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const filteredServices = services
    .filter(svc => statusFilter === 'ALL' || svc.service_status === statusFilter)
    .sort((a, b) => {
      if (a.service_status === 'PENDING' && b.service_status !== 'PENDING') return -1;
      if (a.service_status !== 'PENDING' && b.service_status === 'PENDING') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const returnColumns = [
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
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.order.customer_name} <br/> {record.order.customer_phone}
          </div>
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
            <div style={{ fontSize: '12px', color: '#666' }}>
                {record.warranty_unit.product_name || `Unit #${record.warranty_unit.unit_no}`}
            </div>
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
      title: 'Thao tác',
      key: 'action',
      render: (record: ReturnRequest) => (
        <Link href={`/admin/returns/${record.id}`}>
          <Button type="link" size="small">Chi tiết</Button>
        </Link>
      ),
    },
  ];

  const serviceColumns = [
    {
        title: 'Loại',
        dataIndex: 'service_type',
        key: 'service_type',
        width: 120,
        render: (type: string) => (
          <Tag icon={serviceTypeConfig[type]?.icon} color={serviceTypeConfig[type]?.color}>
            {serviceTypeConfig[type]?.text}
          </Tag>
        ),
    },
    {
        title: 'Khách hàng',
        key: 'customer',
        render: (record: WarrantyService) => (
          <div>
            <div style={{ fontWeight: 500 }}>{record.customer.full_name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.customer.phone}</div>
          </div>
        ),
    },
    {
        title: 'Thiết bị & Mã BH',
        key: 'device',
        render: (record: WarrantyService) => (
          <div>
            <div style={{ fontWeight: 500 }}>{record.warranty_unit.product_name}</div>
            <Tag style={{ fontFamily: 'monospace' }}>
                {record.warranty_unit.warranty_code_auto}
            </Tag>
          </div>
        ),
    },
    {
        title: 'Mô tả lỗi',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
    },
    {
        title: 'Trạng thái',
        dataIndex: 'service_status',
        key: 'status',
        render: (status: string) => (
          <Badge 
            color={serviceStatusConfig[status]?.color || 'default'} 
            text={serviceStatusConfig[status]?.text || status} 
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
        render: (record: WarrantyService) => (
          <Link href={`/admin/warranty-services/${record.id}`}>
            <Button type="link" size="small">Xử lý</Button>
          </Link>
        ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Title level={2} style={{ margin: 0 }}>Quản lý Đổi trả & Bảo hành</Typography.Title>
          <div style={{ display: 'flex', gap: 8 }}>
             <Button icon={<ReloadOutlined />} onClick={fetchData}>Tải lại</Button>
          </div>
        </div>

        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key);
              setStatusFilter('PENDING');
            }}
            items={[
              {
                key: 'returns',
                label: (
                  <Space>
                    <SwapOutlined />
                    Yêu cầu Đổi trả
                    {returnStats.pending > 0 && <Badge count={returnStats.pending} overflowCount={99} />}
                  </Space>
                ),
                children: (
                  <>
                     <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                        <Select
                          size="large"
                          value={statusFilter}
                          onChange={setStatusFilter}
                          style={{ width: 220 }}
                        >
                          <Select.Option value="PENDING">🔥 Chờ duyệt ({returnStats.pending})</Select.Option>
                          <Select.Option value="ALL">Tất cả trạng thái</Select.Option>
                          {Object.entries(returnStatusConfig)
                            .filter(([key]) => key !== 'PENDING')
                            .map(([key, { text }]) => (
                              <Select.Option key={key} value={key}>{text}</Select.Option>
                            ))
                          }
                        </Select>
                      </div>

                    <Table
                      columns={returnColumns}
                      dataSource={filteredReturns}
                      rowKey="id"
                      loading={loading}
                      pagination={{ 
                          pageSize: 20,
                          showTotal: (total) => `Tổng ${total} yêu cầu`,
                      }}
                    />
                  </>
                ),
              },
              {
                key: 'services',
                label: (
                  <Space>
                    <ToolOutlined />
                    Yêu cầu Dịch vụ
                    {serviceStats.pending > 0 && <Badge count={serviceStats.pending} overflowCount={99} />}
                  </Space>
                ),
                children: (
                   <>
                       <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                        <Select
                          size="large"
                          value={statusFilter}
                          onChange={setStatusFilter}
                          style={{ width: 220 }}
                        >
                          <Select.Option value="PENDING">🔥 Chờ tiếp nhận ({serviceStats.pending})</Select.Option>
                          <Select.Option value="ALL">Tất cả trạng thái</Select.Option>
                           {Object.entries(serviceStatusConfig)
                            .filter(([key]) => key !== 'PENDING')
                            .map(([key, { text }]) => (
                              <Select.Option key={key} value={key}>{text}</Select.Option>
                            ))
                          }
                        </Select>
                      </div>

                    <Table
                      columns={serviceColumns}
                      dataSource={filteredServices}
                      rowKey="id"
                      loading={loading}
                      pagination={{ 
                          pageSize: 20, 
                          showTotal: (total) => `Tổng ${total} yêu cầu`,
                      }}
                    />
                  </>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
