'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layout, Input, Badge, Button, Space, Drawer, Typography, Dropdown, Menu, Avatar } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, PhoneOutlined, MenuOutlined, UserOutlined, LogoutOutlined, ProfileOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Search } = Input;
const { Title } = Typography;

export default function Header() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Update cart count from localStorage
    updateCartCount();
    checkAuth();

    // Listen for cart updates
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      console.error('Auth check failed', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<ProfileOutlined />}>
        <Link href="/profile">Tài khoản của tôi</Link>
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const total = cart.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    setCartCount(total);
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value.trim())}`);
    }
    setMobileMenuVisible(false); // Close mobile menu after search
  };

  return (
    <>
      <AntHeader style={{ 
        background: '#fff', 
        padding: '0 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Desktop Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ 
            margin: 0, 
            color: '#1890ff',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            <span style={{ display: 'inline-block' }}>⚡</span>
            <span className="desktop-text">Điện máy Nam Phong</span>
            <span className="mobile-text">Nam Phong</span>
          </h1>
        </Link>

        {/* Desktop Search */}
        <div className="desktop-search" style={{ 
          flex: 1,
          maxWidth: '400px',
          margin: '0 20px'
        }}>
          <Search
            placeholder="Tìm kiếm sản phẩm..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
          />
        </div>

        {/* Desktop Actions */}
        <div className="desktop-actions" style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PhoneOutlined style={{ fontSize: '18px', color: '#ff4d4f', marginRight: '6px' }} />
            <div>
              <div style={{ fontSize: '11px', color: '#666', lineHeight: 1 }}>Hotline</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff4d4f', lineHeight: 1 }}>
                1900-xxxx
              </div>
            </div>
          </div>

          {user ? (
            <Dropdown overlay={userMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                <span style={{ fontWeight: 500 }}>{user.full_name}</span>
              </div>
            </Dropdown>
          ) : (
            <Link href="/login">
              <Button icon={<UserOutlined />}>Đăng nhập</Button>
            </Link>
          )}
          
          <Link href="/cart">
            <Badge count={cartCount} showZero>
              <Button 
                type="primary" 
                icon={<ShoppingCartOutlined />} 
                size="large"
              >
                Giỏ hàng
              </Button>
            </Badge>
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="mobile-actions" style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Link href="/cart">
            <Badge count={cartCount} showZero size="small">
              <Button 
                type="text" 
                icon={<ShoppingCartOutlined />} 
                size="large"
                style={{ padding: '4px 8px' }}
              />
            </Badge>
          </Link>
          
          <Button 
            type="text"
            icon={<MenuOutlined />}
            size="large"
            style={{ padding: '4px 8px' }}
            onClick={() => setMobileMenuVisible(true)}
          />
        </div>
      </AntHeader>

      {/* Mobile Menu Drawer */}
      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        width={280}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Mobile Search */}
          <div>
            <Title level={5} style={{ marginBottom: 12 }}>Tìm kiếm</Title>
            <Search
              placeholder="Tìm kiếm sản phẩm..."
              allowClear
              enterButton="Tìm"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </div>

          {/* Mobile Contact */}
          <div>
            <Title level={5} style={{ marginBottom: 12 }}>Liên hệ</Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <PhoneOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Hotline hỗ trợ</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff4d4f' }}>
                  1900-xxxx
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>8:00 - 22:00 hàng ngày</div>
              </div>
            </div>
          </div>

          {/* Mobile User */}
          <div>
            <Title level={5} style={{ marginBottom: 12 }}>Tài khoản</Title>
            {user ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                  <span style={{ fontWeight: 500 }}>{user.full_name}</span>
                </div>
                <Link href="/profile" onClick={() => setMobileMenuVisible(false)}>
                  <Button block icon={<ProfileOutlined />}>Tài khoản của tôi</Button>
                </Link>
                <Button block danger icon={<LogoutOutlined />} onClick={() => { handleLogout(); setMobileMenuVisible(false); }}>
                  Đăng xuất
                </Button>
              </Space>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Link href="/login" onClick={() => setMobileMenuVisible(false)}>
                  <Button type="primary" block icon={<UserOutlined />}>Đăng nhập</Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuVisible(false)}>
                  <Button block>Đăng ký</Button>
                </Link>
              </Space>
            )}
          </div>

          {/* Mobile Navigation */}
          <div>
            <Title level={5} style={{ marginBottom: 12 }}>Liên kết</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Link href="/" onClick={() => setMobileMenuVisible(false)}>
                <Button type="text" block style={{ textAlign: 'left', height: 'auto', padding: '8px 0' }}>
                  🏠 Trang chủ
                </Button>
              </Link>
              <Link href="/orders" onClick={() => setMobileMenuVisible(false)}>
                <Button type="text" block style={{ textAlign: 'left', height: 'auto', padding: '8px 0' }}>
                  📋 Tra cứu đơn hàng
                </Button>
              </Link>
              <Link href="/track-order" onClick={() => setMobileMenuVisible(false)}>
                <Button type="text" block style={{ textAlign: 'left', height: 'auto', padding: '8px 0' }}>
                  🚚 Theo dõi giao hàng
                </Button>
              </Link>
            </Space>
          </div>
        </Space>
      </Drawer>
    </>
  );
}
