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
          <Layout.Footer style={{ textAlign: 'center', background: '#001529', color: '#fff' }}>
            Điện máy Nam Phong ©{new Date().getFullYear()} - Uy tín, Chất lượng
          </Layout.Footer>
        )}
      </Layout>
    </ConfigProvider>
  );
}
