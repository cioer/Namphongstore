'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/products/ProductForm';
import { Card, Spin, message } from 'antd';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/admin/products/${params.id}`);
        
        if (!res.ok) {
          message.error('Không tìm thấy sản phẩm');
          router.push('/admin/products');
          return;
        }
        
        const data = await res.json();
        setProduct(data.product);
      } catch (error) {
        message.error('Lỗi khi tải sản phẩm');
        router.push('/admin/products');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card>
          <h3 style={{ marginBottom: 24, fontSize: 20, fontWeight: 600 }}>
            Chỉnh sửa sản phẩm: {product.name}
          </h3>
          <ProductForm mode="edit" initialData={product} productId={params.id as string} />
        </Card>
      </div>
    </div>
  );
}
