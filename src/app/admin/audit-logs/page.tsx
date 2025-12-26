'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Card, message, Button, Space, Tag, Select, Collapse } from 'antd';
import { Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const { Panel } = Collapse;
const { Title } = Typography;

// Dynamic import to avoid SSR issues
const ReactJson = dynamic(
  () => import('react-json-view'),
  { 
    ssr: false,
    loading: () => <div>Loading...</div>
  }
);

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuditLog {
  id: string;
  action: string;
  before_json: any;
  after_json: any;
  changed_fields: string[] | null;
  created_at: string;
  product: {
    name: string;
    slug: string;
  };
  user: {
    full_name: string;
    email: string;
    role: string;
  };
}

const actionColors: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
};

export default function AuditLogsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchAuditLogs();
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
      
      if (data.user.role !== 'ADMIN') {
        message.error('Chỉ ADMIN mới có quyền xem audit logs');
        router.push('/admin/orders');
        return;
      }
      
      setUser(data.user);
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/audit-logs', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      const data = await response.json();
      setAuditLogs(data.audit_logs || []);
    } catch (error) {
      message.error('Không thể tải audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesAction;
  });

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
      width: 180,
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={actionColors[action] || 'default'}>{action}</Tag>
      ),
      width: 100,
    },
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (record: AuditLog) => (
        <Link href={`/p/${record.product.slug}`} target="_blank">
          {record.product.name}
        </Link>
      ),
    },
    {
      title: 'Người thực hiện',
      key: 'user',
      render: (record: AuditLog) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.user.full_name}</div>
          <small style={{ color: '#666' }}>{record.user.email}</small>
        </div>
      ),
      width: 200,
    },
    {
      title: 'Trường thay đổi',
      dataIndex: 'changed_fields',
      key: 'changed_fields',
      render: (fields: string[] | null) => {
        if (!fields || fields.length === 0) return '-';
        return (
          <div>
            {fields.map(field => (
              <Tag key={field} style={{ marginBottom: 4 }}>{field}</Tag>
            ))}
          </div>
        );
      },
      width: 300,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ 
        background: '#fff', 
        borderBottom: '1px solid #e8e8e8',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Audit Logs - Lịch sử thay đổi</Title>
          {user && <small style={{ color: '#666' }}>{user.full_name} ({user.role})</small>}
        </div>

      </div>

      <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
            <Select
              size="large"
              value={actionFilter}
              onChange={setActionFilter}
              style={{ width: 200 }}
            >
              <Select.Option value="ALL">Tất cả hành động</Select.Option>
              <Select.Option value="CREATE">CREATE</Select.Option>
              <Select.Option value="UPDATE">UPDATE</Select.Option>
              <Select.Option value="DELETE">DELETE</Select.Option>
            </Select>
            <Button 
              size="large" 
              icon={<ReloadOutlined />} 
              onClick={fetchAuditLogs}
            >
              Tải lại
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={filteredLogs}
            rowKey="id"
            loading={loading}
            expandable={{
              expandedRowRender: (record: AuditLog) => (
                <div style={{ padding: 16, background: '#fafafa' }}>
                  <Title level={5}>Chi tiết thay đổi</Title>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {record.before_json && (
                      <div>
                        <strong>Before (Trước khi thay đổi):</strong>
                        <div style={{ marginTop: 8 }}>
                          <ReactJson
                            src={record.before_json}
                            collapsed={1}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            enableClipboard={false}
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <strong>After (Sau khi thay đổi):</strong>
                      <div style={{ marginTop: 8 }}>
                        <ReactJson
                          src={record.after_json}
                          collapsed={1}
                          displayDataTypes={false}
                          displayObjectSize={false}
                          enableClipboard={false}
                        />
                      </div>
                    </div>
                  </Space>
                </div>
              ),
            }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} bản ghi`,
            }}
          />
        </Card>
      </div>
    </div>
  );
}
