'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Card, Typography, message, Space, Tag, Popconfirm, Modal, Form, Input, InputNumber, Select, DatePicker, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatVND } from '@/lib/utils';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      } else {
        message.error('Không thể tải danh sách mã giảm giá');
      }
    } catch (error) {
      message.error('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCoupon(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: Coupon) => {
    setEditingCoupon(record);
    form.setFieldsValue({
      ...record,
      valid_range: [dayjs(record.valid_from), dayjs(record.valid_until)],
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        message.success('Xóa mã giảm giá thành công');
        fetchCoupons();
      } else {
        message.error('Không thể xóa mã giảm giá');
      }
    } catch (error) {
      message.error('Lỗi kết nối');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        valid_from: values.valid_range[0].toISOString(),
        valid_until: values.valid_range[1].toISOString(),
      };
      delete payload.valid_range;

      let res;
      if (editingCoupon) {
        res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        message.success(`${editingCoupon ? 'Cập nhật' : 'Tạo'} mã giảm giá thành công`);
        setIsModalVisible(false);
        fetchCoupons();
      } else {
        const data = await res.json();
        message.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Giảm giá',
      key: 'discount',
      render: (_: any, record: Coupon) => (
        <span>
          {record.discount_type === 'percentage' 
            ? `${record.discount_value}% (Tối đa ${formatVND(record.max_discount || 0)})` 
            : formatVND(record.discount_value)}
        </span>
      ),
    },
    {
      title: 'Đơn tối thiểu',
      dataIndex: 'min_order_value',
      key: 'min_order_value',
      render: (val: number) => val ? formatVND(val) : '-',
    },
    {
      title: 'Lượt dùng',
      key: 'usage',
      render: (_: any, record: Coupon) => (
        <span>{record.used_count} / {record.usage_limit || '∞'}</span>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_: any, record: Coupon) => (
        <div style={{ fontSize: '12px' }}>
          <div>{dayjs(record.valid_from).format('DD/MM/YYYY')}</div>
          <div>{dayjs(record.valid_until).format('DD/MM/YYYY')}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Hoạt động' : 'Vô hiệu'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Coupon) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={4}>Quản lý Mã giảm giá</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Tạo mã mới
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={coupons}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingCoupon ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="code"
              label="Mã code"
              rules={[{ required: true, message: 'Vui lòng nhập mã' }]}
            >
              <Input placeholder="VD: SALE50" style={{ textTransform: 'uppercase' }} />
            </Form.Item>
            <Form.Item
              name="name"
              label="Tên chương trình"
              rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
            >
              <Input placeholder="VD: Giảm giá mùa hè" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="discount_type"
              label="Loại giảm giá"
              initialValue="percentage"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="percentage">Theo phần trăm (%)</Option>
                <Option value="fixed">Số tiền cố định (VNĐ)</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="discount_value"
              label="Giá trị giảm"
              rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="max_discount"
              label="Giảm tối đa (cho %)"
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="Để trống nếu không giới hạn" />
            </Form.Item>
            <Form.Item
              name="min_order_value"
              label="Đơn tối thiểu"
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="usage_limit"
              label="Giới hạn lượt dùng"
            >
              <InputNumber style={{ width: '100%' }} min={1} placeholder="Để trống nếu không giới hạn" />
            </Form.Item>
            <Form.Item
              name="valid_range"
              label="Thời gian hiệu lực"
              rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
            >
              <RangePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="is_active" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
