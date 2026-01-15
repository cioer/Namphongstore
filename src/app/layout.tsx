import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import AppLayout from '@/components/layout/AppLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Điện máy Nam Phong',
  description: 'Cửa hàng điện máy uy tín, chất lượng',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <AntdRegistry>
          <ConfigProvider
            locale={viVN}
            theme={{
              token: {
                colorPrimary: '#D70018', // Lucky Red
                colorLink: '#D70018',
                borderRadius: 16, // Bo góc mềm mại
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                colorBgLayout: 'transparent',
              },
              components: {
                Button: {
                  primaryShadow: '0 2px 0 rgba(215, 0, 24, 0.1)',
                },
                Card: {
                  colorBgContainer: '#ffffff',
                }
              }
            }}
          >
            <AppLayout>{children}</AppLayout>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
