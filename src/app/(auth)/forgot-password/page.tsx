'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra');
      }

      setSuccess(true);
      message.success('Đã gửi yêu cầu thành công');
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh',
      background: '#f0f2f5',
      padding: '20px'
    }}>
      <Card style={{ width: 400, maxWidth: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Typography.Title level={3}>Quên Mật Khẩu</Typography.Title>
          <Typography.Text type="secondary">Nhập email để lấy lại mật khẩu</Typography.Text>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <Alert
              message="Yêu cầu thành công"
              description="Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu vào email của bạn. Vui lòng kiểm tra hộp thư đến."
              type="success"
              showIcon
              style={{ marginBottom: 24, textAlign: 'left' }}
            />
            <Link href="/login">
              <Button type="primary" block>
                Quay lại Đăng nhập
              </Button>
            </Link>
          </div>
        ) : (
          <Form
            name="forgot-password"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="Email đã đăng ký" 
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Gửi yêu cầu
              </Button>
            </Form.Item>
            
            <div style={{ textAlign: 'center' }}>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeftOutlined /> Quay lại Đăng nhập
              </Link>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
}
