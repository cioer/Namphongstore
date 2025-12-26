'use client';

import ProductForm from '@/components/admin/products/ProductForm';
import { Card } from 'antd';
import { Typography } from 'antd';

const { Title } = Typography;

export default function NewProductPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card>
          <Title level={3} style={{ marginBottom: 24 }}>Tạo sản phẩm mới</Title>
          <ProductForm mode="create" />
        </Card>
      </div>
    </div>
  );
}
