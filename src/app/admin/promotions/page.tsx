'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, 
  Card, 
  Typography, 
  Space, 
  Button, 
  Badge,
  Tag,
  Input,
  Select,
  message,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Switch,
  Statistic,
  Row,
  Col,
  Popconfirm,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ReloadOutlined,
  TagOutlined,
  PercentageOutlined,
  MoneyCollectOutlined,
  CalendarOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { formatVND } from '@/lib/utils';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  min_order_value: string | null;
  max_discount: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  created_at: string;
}

export default function PromotionsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Create/Edit modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/promotions', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch coupons');
      }
      
      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      message.error('Không thể tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: values.code,
          name: values.name,
          description: values.description,
          discount_type: values.discount_type,
          discount_value: values.discount_value,
          min_order_value: values.min_order_value,
          max_discount: values.max_discount,
          usage_limit: values.usage_limit,
          valid_from: values.validity[0].toISOString(),
          valid_until: values.validity[1].toISOString(),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi khi tạo mã giảm giá');
      }

      message.success('Tạo mã giảm giá thành công!');
      setModalVisible(false);
      form.resetFields();
      fetchCoupons();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    form.resetFields();
    setModalVisible(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Đã sao chép mã giảm giá');
  };

  const isExpired = (validUntil: string) => {
    return dayjs(validUntil).isBefore(dayjs());
  };

  const getStatusTag = (coupon: Coupon) => {
    if (!coupon.is_active) {
      return <Tag color="red">Tạm dừng</Tag>;
    }
    if (isExpired(coupon.valid_until)) {
      return <Tag color="volcano">Hết hạn</Tag>;
    }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return <Tag color="orange">Hết lượt</Tag>;
    }
    if (dayjs(coupon.valid_from).isAfter(dayjs())) {
      return <Tag color="blue">Chưa bắt đầu</Tag>;
    }
    return <Tag color="green">Đang hoạt động</Tag>;
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = 
      coupon.code.toLowerCase().includes(searchText.toLowerCase()) ||
      coupon.name.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && coupon.is_active && !isExpired(coupon.valid_until)) ||
      (statusFilter === 'INACTIVE' && (!coupon.is_active || isExpired(coupon.valid_until)));
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Mã giảm giá',
      key: 'code',
      width: 150,
      render: (record: Coupon) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px' }}>
              {record.code}
            </span>
            <Tooltip title="Sao chép">
              <Button 
                type="text" 
                size="small" 
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(record.code)}
              />
            </Tooltip>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
            {record.name}
          </div>
        </div>
      ),
    },
    {
      title: 'Loại & Giá trị',
      key: 'discount',
      width: 150,
      render: (record: Coupon) => (
        <div>
          <Tag 
            color={record.discount_type === 'percentage' ? 'blue' : 'green'}
            icon={record.discount_type === 'percentage' ? <PercentageOutlined /> : <MoneyCollectOutlined />}
          >
            {record.discount_type === 'percentage' 
              ? `${record.discount_value}%` 
              : formatVND(record.discount_value)
            }
          </Tag>
          {record.max_discount && record.discount_type === 'percentage' && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: 2 }}>
              Tối đa: {formatVND(record.max_discount)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Điều kiện',
      key: 'conditions',
      width: 120,
      render: (record: Coupon) => (
        <div style={{ fontSize: '12px' }}>
          {record.min_order_value && (
            <div>Tối thiểu: {formatVND(record.min_order_value)}</div>
          )}
          {record.usage_limit && (
            <div>Giới hạn: {record.usage_limit} lượt</div>
          )}
        </div>
      ),
    },
    {
      title: 'Sử dụng',
      key: 'usage',
      width: 100,
      render: (record: Coupon) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {record.used_count}
          </div>
          {record.usage_limit && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              / {record.usage_limit}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Thời gian',
      key: 'validity',
      width: 200,
      render: (record: Coupon) => (
        <div style={{ fontSize: '12px' }}>
          <div>Từ: {dayjs(record.valid_from).format('DD/MM/YYYY HH:mm')}</div>
          <div>Đến: {dayjs(record.valid_until).format('DD/MM/YYYY HH:mm')}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (record: Coupon) => getStatusTag(record),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (record: Coupon) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} size="small">
            Sửa
          </Button>
          <Popconfirm
            title="Xóa mã giảm giá"
            description="Bạn có chắc muốn xóa mã này?"
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Calculate stats
  const activeCoupons = coupons.filter(c => c.is_active && !isExpired(c.valid_until)).length;
  const expiredCoupons = coupons.filter(c => isExpired(c.valid_until)).length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.used_count, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TagOutlined style={{ marginRight: 12 }} />
            Quản lý khuyến mãi
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchCoupons}
              loading={loading}
            >
              Làm mới
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Tạo mã giảm giá
            </Button>
          </Space>
        </div>

        {/* Stats Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Tổng mã giảm giá" 
                value={coupons.length}
                prefix={<TagOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Đang hoạt động" 
                value={activeCoupons}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Đã hết hạn" 
                value={expiredCoupons}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Lượt sử dụng" 
                value={totalUsage}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col flex="300px">
              <Search
                placeholder="Tìm theo mã hoặc tên..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col flex="200px">
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%' }}
              >
                <Select.Option value="ALL">Tất cả</Select.Option>
                <Select.Option value="ACTIVE">Đang hoạt động</Select.Option>
                <Select.Option value="INACTIVE">Không hoạt động</Select.Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Coupons Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredCoupons}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mã`,
            }}
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          title={editingCoupon ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={700}
        >
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            style={{ marginTop: 16 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Mã giảm giá"
                  name="code"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mã giảm giá' },
                    { pattern: /^[A-Z0-9]+$/, message: 'Chỉ được dùng chữ hoa và số' }
                  ]}
                >
                  <Input placeholder="VD: SUMMER2024" style={{ textTransform: 'uppercase' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Tên khuyến mãi"
                  name="name"
                  rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                >
                  <Input placeholder="VD: Khuyến mãi mùa hè" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Mô tả"
              name="description"
            >
              <Input.TextArea rows={2} placeholder="Mô tả chi tiết về khuyến mãi..." />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Loại giảm giá"
                  name="discount_type"
                  rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
                >
                  <Select placeholder="Chọn loại">
                    <Select.Option value="percentage">Phần trăm (%)</Select.Option>
                    <Select.Option value="fixed">Số tiền cố định (₫)</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Giá trị giảm"
                  name="discount_value"
                  rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
                >
                  <InputNumber 
                    min={0} 
                    style={{ width: '100%' }} 
                    placeholder="VD: 10"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item dependencies={['discount_type']}>
                  {({ getFieldValue }) => {
                    const discountType = getFieldValue('discount_type');
                    if (discountType === 'percentage') {
                      return (
                        <Form.Item
                          label="Giảm tối đa"
                          name="max_discount"
                        >
                          <InputNumber 
                            min={0} 
                            style={{ width: '100%' }} 
                            placeholder="VD: 100000"
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          />
                        </Form.Item>
                      );
                    }
                    return null;
                  }}
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Giá trị đơn hàng tối thiểu"
                  name="min_order_value"
                >
                  <InputNumber 
                    min={0} 
                    style={{ width: '100%' }} 
                    placeholder="VD: 500000"
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Giới hạn sử dụng"
                  name="usage_limit"
                >
                  <InputNumber 
                    min={1} 
                    style={{ width: '100%' }} 
                    placeholder="Để trống = không giới hạn"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Thời gian hiệu lực"
              name="validity"
              rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
            >
              <RangePicker 
                showTime={{ format: 'HH:mm' }}
                format="DD/MM/YYYY HH:mm"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setModalVisible(false)}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  {editingCoupon ? 'Cập nhật' : 'Tạo mã'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

      </div>
    </div>
  );
}