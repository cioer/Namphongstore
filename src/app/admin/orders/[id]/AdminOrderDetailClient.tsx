'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Descriptions,
  Table,
  Badge,
  Button,
  Space,
  message,
  Modal,
  Input,
  Timeline,
  Tag,
  Divider,
  Alert,
} from 'antd';
import { Typography } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { formatVND } from '@/lib/utils';
import Link from 'next/link';

const { Title, Text } = Typography;

const { TextArea } = Input;


interface User {
  full_name: string;
  role: string;
}

interface EventLog {
  id: string;
  event_type: string;
  metadata: any;
  created_at: string;
  user: User | null;
}

interface WarrantyUnit {
  id: string;
  unit_no: number;
  warranty_code_auto: string;
  serial_no: string | null;
  warranty_months_at_purchase: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface OrderItem {
  id: string;
  snapshot_name: string;
  quantity: number;
  unit_price_at_purchase: string;
  warranty_months_snapshot: number;
  product: {
    name: string;
    images: any;
  };
  warranty_units: WarrantyUnit[];
}

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string;
  customer_ward: string | null;
  customer_district: string | null;
  customer_city: string;
  notes: string | null;
  status: string;
  total_amount: string;
  delivered_date: string | null;
  created_at: string;
  items: OrderItem[];
  event_logs: EventLog[];
}

const statusConfig: Record<string, { color: string; text: string }> = {
  NEW: { color: 'blue', text: 'Mới' },
  CONFIRMED: { color: 'cyan', text: 'Đã xác nhận' },
  SHIPPING: { color: 'orange', text: 'Đang giao' },
  DELIVERED: { color: 'green', text: 'Đã giao' },
  CANCELLED_BY_CUSTOMER: { color: 'red', text: 'Khách hủy' },
  CANCELLED_BY_SHOP: { color: 'volcano', text: 'Shop hủy' },
};

const eventTypeLabels: Record<string, string> = {
  ORDER_STATUS_CHANGED: 'Thay đổi trạng thái',
  ORDER_DELIVERED_CONFIRMED: 'Xác nhận giao hàng',
  WARRANTY_CODES_GENERATED: 'Tạo mã bảo hành',
  ORDER_CREATED: 'Tạo đơn hàng',
};

const warrantyStatusConfig: Record<string, { color: string; text: string }> = {
  ACTIVE: { color: 'green', text: 'Còn hạn' },
  EXPIRED: { color: 'red', text: 'Hết hạn' },
  REPLACED: { color: 'orange', text: 'Đã thay thế' },
  VOIDED: { color: 'magenta', text: 'Đã chấm dứt' },
};

export default function AdminOrderDetailClient({ order }: { order: Order }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');

  // Terminate Warranty State
  const [terminateModalVisible, setTerminateModalVisible] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyUnit | null>(null);

  const isDelivered = order.status === 'DELIVERED';
  const isCancelled = order.status.includes('CANCELLED');

  const getNextActions = () => {
    const transitions: Record<string, { status: string; label: string; type: any }[]> = {
      NEW: [
        { status: 'CONFIRMED', label: 'Xác nhận đơn', type: 'primary' },
        { status: 'CANCELLED_BY_SHOP', label: 'Hủy đơn', type: 'default' },
      ],
      CONFIRMED: [
        { status: 'SHIPPING', label: 'Bắt đầu giao hàng', type: 'primary' },
        { status: 'CANCELLED_BY_SHOP', label: 'Hủy đơn', type: 'default' },
      ],
      SHIPPING: [
        { status: 'DELIVERED', label: 'Xác nhận đã giao', type: 'primary' },
        { status: 'CANCELLED_BY_SHOP', label: 'Hủy đơn', type: 'default' },
      ],
    };
    return transitions[order.status] || [];
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_status: selectedStatus,
          note: note.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        message.error(data.error || 'Cập nhật thất bại');
        return;
      }

      message.success(data.message || 'Cập nhật thành công!');
      setModalVisible(false);
      setNote('');
      router.refresh();
    } catch (error) {
      message.error('Có lỗi xảy ra');
    } finally {
      setUpdating(false);
    }
  };

  const handleTerminateWarranty = async () => {
    if (!selectedWarranty) return;

    if (!terminateReason.trim()) {
      message.error('Vui lòng nhập lý do');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/warranty/${selectedWarranty.id}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: terminateReason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        message.error(data.error || 'Thất bại');
        return;
      }

      message.success('Đã chấm dứt bảo hành');
      setTerminateModalVisible(false);
      setTerminateReason('');
      setSelectedWarranty(null);
      router.refresh();
    } catch (error) {
      message.error('Có lỗi xảy ra');
    } finally {
      setUpdating(false);
    }
  };

  const handleVoidExchange = async () => {
    if (!selectedWarranty) return;

    if (!terminateReason.trim()) {
      message.error('Vui lòng nhập lý do');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/warranty/${selectedWarranty.id}/void-exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: terminateReason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        message.error(data.error || 'Thất bại');
        return;
      }

      message.success('Đã chấm dứt quyền đổi trả 1-1');
      setTerminateModalVisible(false);
      setTerminateReason('');
      setSelectedWarranty(null);
      router.refresh();
    } catch (error) {
      message.error('Có lỗi xảy ra');
    } finally {
      setUpdating(false);
    }
  };

  const openStatusModal = (status: string) => {
    setSelectedStatus(status);
    setModalVisible(true);
  };

  const itemColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'snapshot_name',
      key: 'snapshot_name',
      render: (text: string, record: OrderItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          {record.product && (
            <small style={{ color: '#666' }}>{record.product.name}</small>
          )}
        </div>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unit_price_at_purchase',
      key: 'unit_price_at_purchase',
      render: (price: string) => formatVND(Number(price)),
    },
    {
      title: 'Thành tiền',
      key: 'subtotal',
      render: (record: OrderItem) => (
        <strong>{formatVND(Number(record.unit_price_at_purchase) * record.quantity)}</strong>
      ),
    },
    {
      title: 'BH (tháng)',
      dataIndex: 'warranty_months_snapshot',
      key: 'warranty_months_snapshot',
    },
  ];

  const warrantyColumns = [
    {
      title: 'Số thứ tự',
      dataIndex: 'unit_no',
      key: 'unit_no',
      width: 100,
    },
    {
      title: 'Mã bảo hành',
      dataIndex: 'warranty_code_auto',
      key: 'warranty_code_auto',
      render: (code: string) => (
        <Text copyable style={{ fontFamily: 'monospace' }}>{code}</Text>
      ),
    },
    {
      title: 'Serial',
      dataIndex: 'serial_no',
      key: 'serial_no',
      render: (serial: string | null) => serial || <Text type="secondary">Chưa có</Text>,
    },
    {
      title: 'Thời hạn BH',
      key: 'warranty_period',
      render: (record: WarrantyUnit) => `${record.warranty_months_at_purchase} tháng`,
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Ngày hết hạn',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={warrantyStatusConfig[status]?.color || 'default'}>
          {warrantyStatusConfig[status]?.text || status}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (record: WarrantyUnit) => (
         record.status === 'ACTIVE' && (
           <Button
             danger
             size="small"
             icon={<StopOutlined />}
             onClick={() => {
               setSelectedWarranty(record);
               setTerminateModalVisible(true);
             }}
           >
             Kết thúc
           </Button>
         )
      ),
    },
  ];

  const allWarrantyUnits = order.items.flatMap(item => 
    item.warranty_units.map(unit => ({
      ...unit,
      product_name: item.snapshot_name,
    }))
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 24 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '16px 24px' }}>
        <Space>
          <Link href="/admin/orders">
            <Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
          </Link>
          <Title level={4} style={{ margin: 0 }}>Chi tiết đơn hàng #{order.order_code}</Title>
          <Badge 
            color={statusConfig[order.status]?.color} 
            text={statusConfig[order.status]?.text} 
          />
        </Space>
      </div>

      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {/* Action Buttons */}
        {!isCancelled && !isDelivered && (
          <Card style={{ marginBottom: 16 }}>
            <Space wrap>
              {getNextActions().map(action => (
                <Button
                  key={action.status}
                  type={action.type}
                  size="large"
                  onClick={() => openStatusModal(action.status)}
                >
                  {action.label}
                </Button>
              ))}
            </Space>
          </Card>
        )}

        {/* Customer Info */}
        <Card title="Thông tin khách hàng" style={{ marginBottom: 16 }}>
          <Descriptions column={2}>
            <Descriptions.Item label="Họ tên">{order.customer_name}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{order.customer_phone}</Descriptions.Item>
            <Descriptions.Item label="Email">{order.customer_email || 'Không có'}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">
              {[order.customer_address, order.customer_ward, order.customer_district, order.customer_city]
                .filter(Boolean)
                .join(', ')}
            </Descriptions.Item>
            {order.notes && (
              <Descriptions.Item label="Ghi chú" span={2}>{order.notes}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Order Items */}
        <Card title="Sản phẩm" style={{ marginBottom: 16 }}>
          <Table
            columns={itemColumns}
            dataSource={order.items}
            rowKey="id"
            pagination={false}
            footer={() => (
              <div style={{ textAlign: 'right', fontWeight: 600, fontSize: 16 }}>
                Tổng cộng: <span style={{ color: '#d32f2f' }}>{formatVND(Number(order.total_amount))}</span>
              </div>
            )}
          />
        </Card>

        {/* Warranty Section */}
        {isDelivered && allWarrantyUnits.length > 0 && (
          <Card title="Thông tin bảo hành" style={{ marginBottom: 16 }}>
            <Table
              columns={warrantyColumns}
              dataSource={allWarrantyUnits}
              rowKey="id"
              pagination={false}
            />
          </Card>
        )}

        {/* Timeline */}
        <Card title="Lịch sử đơn hàng">
          <Timeline>
            {order.event_logs.map(log => {
              const isStatusChange = log.event_type === 'ORDER_STATUS_CHANGED';
              const isDelivered = log.event_type === 'ORDER_DELIVERED_CONFIRMED';
              const isWarranty = log.event_type === 'WARRANTY_CODES_GENERATED';

              let icon = <ClockCircleOutlined />;
              let color = 'blue';

              if (isDelivered) {
                icon = <CheckCircleOutlined />;
                color = 'green';
              } else if (isWarranty) {
                color = 'green';
              } else if (log.metadata?.to?.includes('CANCELLED')) {
                icon = <CloseCircleOutlined />;
                color = 'red';
              }

              return (
                <Timeline.Item key={log.id} dot={icon} color={color}>
                  <div>
                    <strong>{eventTypeLabels[log.event_type] || log.event_type}</strong>
                    {isStatusChange && (
                      <div>
                        <Tag color={statusConfig[log.metadata.from]?.color}>
                          {statusConfig[log.metadata.from]?.text}
                        </Tag>
                        →
                        <Tag color={statusConfig[log.metadata.to]?.color}>
                          {statusConfig[log.metadata.to]?.text}
                        </Tag>
                      </div>
                    )}
                    {isWarranty && (
                      <div>Đã tạo {log.metadata.total_codes} mã bảo hành</div>
                    )}
                    {log.metadata?.note && (
                      <div style={{ color: '#666', marginTop: 4 }}>
                        Ghi chú: {log.metadata.note}
                      </div>
                    )}
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                      {log.user && ` • ${log.user.full_name} (${log.user.role})`}
                    </div>
                  </div>
                </Timeline.Item>
              );
            })}
            <Timeline.Item color="blue">
              <div>
                <strong>Đơn hàng được tạo</strong>
                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                  {new Date(order.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
            </Timeline.Item>
          </Timeline>
        </Card>
      </div>

      {/* Status Update Modal */}
      <Modal
        title="Cập nhật trạng thái"
        open={modalVisible}
        onOk={handleStatusUpdate}
        onCancel={() => {
          setModalVisible(false);
          setNote('');
        }}
        confirmLoading={updating}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <p>
          Bạn có chắc muốn chuyển trạng thái đơn hàng sang{' '}
          <strong>{statusConfig[selectedStatus]?.text}</strong>?
        </p>
        {selectedStatus === 'DELIVERED' && (
          <div style={{ padding: 12, background: '#e6f7ff', borderRadius: 4, marginBottom: 12 }}>
            <strong>Lưu ý:</strong> Hệ thống sẽ tự động tạo mã bảo hành cho tất cả sản phẩm trong đơn hàng.
          </div>
        )}
        <TextArea
          placeholder="Ghi chú (tùy chọn)"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Modal>

      {/* Terminate Warranty Modal */}
      <Modal
        title="Quản lý hiệu lực bảo hành"
        open={terminateModalVisible}
        onCancel={() => {
            setTerminateModalVisible(false);
            setTerminateReason('');
            setSelectedWarranty(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setTerminateModalVisible(false)}>
            Hủy
          </Button>,
          <Button 
            key="void_exchange" 
            type="primary" 
            danger 
            onClick={handleVoidExchange}
            loading={updating}
            ghost
          >
            Chấm dứt Đổi trả 1-1
          </Button>,
          <Button 
            key="void_warranty" 
            type="primary" 
            danger 
            onClick={handleTerminateWarranty}
            loading={updating}
          >
            Chấm dứt TOÀN BỘ Bảo hành
          </Button>,
        ]}
      >
        <Alert 
          message="Vui lòng chọn loại hình chấm dứt hiệu lực" 
          description={
            <ul>
                <li><b>Chấm dứt Đổi trả 1-1:</b> Khách không còn quyền đổi trả nhưng vẫn được bảo hành kỹ thuật.</li>
                <li><b>Chấm dứt TOÀN BỘ:</b> Khách mất mọi quyền lợi bảo hành (Void).</li>
            </ul>
          }
          type="warning" 
          showIcon 
          style={{ marginBottom: 16 }}
        />
        <div style={{ marginBottom: 8 }}>
          <Text strong>Lý do (bắt buộc):</Text>
        </div>
        <TextArea
          rows={3}
          value={terminateReason}
          onChange={(e) => setTerminateReason(e.target.value)}
          placeholder="Nhập lý do vi phạm hoặc chấm dứt..."
        />
      </Modal>
    </div>
  );
}
