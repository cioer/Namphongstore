'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Space, message, Modal, Form, Input } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  UserOutlined,
  TeamOutlined,
  GiftOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [form] = Form.useForm();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Only check auth if not on login page
    if (pathname !== '/admin/login') {
      checkAuth();
    }
  }, [pathname]);

  // Skip layout for login page (moved after hooks to avoid inconsistency)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.user) {
        router.push('/admin/login');
      } else {
        setUser(data.user);
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const handleChangePassword = async (values: any) => {
    try {
      const res = await fetch('/api/admin/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        message.success('Đổi mật khẩu thành công');
        setChangePasswordVisible(false);
        form.resetFields();
      } else {
        message.error(data.error || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
      message.error('Lỗi kết nối');
    }
  };

  const userMenuItems = [
    {
      key: 'change-password',
      icon: <LockOutlined />,
      label: 'Đổi mật khẩu',
      onClick: () => setChangePasswordVisible(true),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: <Link href="/admin">Tổng quan</Link>,
      roles: ['ADMIN'],
    },
    {
      key: '/admin/orders',
      icon: <ShoppingCartOutlined />,
      label: <Link href="/admin/orders">Đơn hàng</Link>,
      roles: ['ADMIN', 'SALES'],
    },
    {
      key: '/admin/products',
      icon: <AppstoreOutlined />,
      label: <Link href="/admin/products">Sản phẩm</Link>,
      roles: ['ADMIN', 'SALES'],
    },
    {
      key: '/admin/categories',
      icon: <UnorderedListOutlined />,
      label: <Link href="/admin/categories">Danh mục</Link>,
      roles: ['ADMIN', 'SALES'],
    },
    {
      key: '/admin/returns',
      icon: <SafetyCertificateOutlined />,
      label: <Link href="/admin/returns">Đổi trả & Bảo hành</Link>,
      roles: ['ADMIN', 'TECH'],
    },
    {
      key: '/admin/coupons',
      icon: <GiftOutlined />,
      label: <Link href="/admin/coupons">Mã giảm giá</Link>,
      roles: ['ADMIN', 'SALES'],
    },
    {
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: <Link href="/admin/users">Nhân viên</Link>,
      roles: ['ADMIN'],
    },
    {
      key: '/admin/audit-logs',
      icon: <FileTextOutlined />,
      label: <Link href="/admin/audit-logs">Nhật ký hệ thống</Link>,
      roles: ['ADMIN'],
    },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            {collapsed ? 'NP' : 'Nam Phong'}
          </Title>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[pathname]}
          items={filteredMenuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          
          <Space>
            {user && (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} />
                  <div style={{ lineHeight: '1.2' }}>
                    <Text strong style={{ display: 'block' }}>{user.full_name}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{user.role}</Text>
                  </div>
                </Space>
              </Dropdown>
            )}
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#fff' }}>
          {children}
        </Content>
      </Layout>

      <Modal
        title="Đổi mật khẩu"
        open={changePasswordVisible}
        onCancel={() => {
          setChangePasswordVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Đổi mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
