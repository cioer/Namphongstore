'use client';

import { usePathname } from 'next/navigation';
import { ConfigProvider, Layout } from 'antd';
import viVN from 'antd/locale/vi_VN';
import Header from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  
  // Check if current page is admin page
  const isAdminPage = pathname?.startsWith('/admin');
  
  return (
    <ConfigProvider locale={viVN}>
      <Layout style={{ minHeight: '100vh' }}>
        {/* Only show header for non-admin pages */}
        {!isAdminPage && <Header />}
        <Layout.Content style={{ background: isAdminPage ? '#fff' : '#f0f2f5' }}>
          {children}
        </Layout.Content>
        {/* Only show footer for non-admin pages */}
        {!isAdminPage && (
          <Layout.Footer style={{ textAlign: 'center', background: '#8B0000', color: '#FFFDF5', padding: '24px 50px', borderTop: '4px solid #D4AF37' }}>
            <div style={{ marginBottom: 16 }}>
              <a href="/chinh-sach-bao-hanh" style={{ color: '#D4AF37', textDecoration: 'underline' }}>Chính sách bảo hành</a>
              <span style={{ margin: '0 8px', color: '#D4AF37' }}>|</span>
              <span style={{ color: '#FFFDF5' }}>Hotline Tết: 1900-1234</span>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', color: '#D4AF37' }}>
              Điện máy Nam Phong ©{new Date().getFullYear()} - Kính Chúc Quý Khách An Khang Thịnh Vượng
            </div>
          </Layout.Footer>
        )}
      </Layout>
    </ConfigProvider>
  );
}
