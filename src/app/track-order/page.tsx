'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Typography, Card, Form, Input, Button, Space, Spin } from 'antd';
import { PhoneOutlined, SearchOutlined } from '@ant-design/icons';

function TrackOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { phone: string }) => {
    setLoading(true);
    // Redirect to orders page with phone parameter
    router.push(`/orders?phone=${encodeURIComponent(values.phone)}`);
  };

  return (
    <div style={{ 
      padding: '40px 50px', 
      minHeight: 'calc(100vh - 200px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f0f2f5'
    }}>
      <Card style={{ maxWidth: '500px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <PhoneOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
          <Typography.Title level={2}>Tra cứu đơn hàng</Typography.Title>
          <Typography.Paragraph type="secondary">
            Nhập số điện thoại đã dùng khi đặt hàng để tra cứu thông tin đơn hàng
          </Typography.Paragraph>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ phone: searchParams.get('phone') || '' }}
        >
          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { 
                pattern: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 
                message: 'Số điện thoại không hợp lệ (ví dụ: 0901234567)' 
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="0901234567"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<SearchOutlined />}
              loading={loading}
              block
            >
              Tra cứu đơn hàng
            </Button>
          </Form.Item>
        </Form>

        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: '#e6f7ff', 
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <strong>Lưu ý:</strong>
          <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
            <li>Sử dụng số điện thoại đã đăng ký khi đặt hàng</li>
            <li>Bạn có thể xem tất cả đơn hàng đã đặt</li>
            <li>Hủy đơn hàng nếu đơn hàng chưa được xác nhận hoặc giao</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}><Spin size="large" /></div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
