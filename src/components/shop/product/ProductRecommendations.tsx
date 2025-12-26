'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Spin, Empty } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import ProductCard from './ProductCard';

const { Title } = Typography;

interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price_original: string;
  price_sale: string;
  discount_percent: number;
  promo_start: string | null;
  promo_end: string | null;
  images: any;
  gifts: any;
}

interface ProductRecommendationsProps {
  productId: string;
  title?: string;
  limit?: number;
}

export default function ProductRecommendations({ 
  productId, 
  title = "Sản phẩm liên quan", 
  limit = 6 
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchRecommendations();
    }
  }, [productId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recommendations?product_id=${productId}&limit=${limit}`);
      const data = await response.json();
      
      if (response.ok) {
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card style={{ marginTop: 32 }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#666' }}>Đang tải sản phẩm gợi ý...</div>
        </div>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card style={{ marginTop: 32 }}>
        <Title level={4} style={{ marginBottom: 16 }}>
          <ThunderboltOutlined style={{ marginRight: 8 }} />
          {title}
        </Title>
        <Empty 
          description="Không có sản phẩm gợi ý"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card style={{ marginTop: 32 }}>
      <Title level={4} style={{ marginBottom: 24 }}>
        <ThunderboltOutlined style={{ marginRight: 8 }} />
        {title}
      </Title>
      
      <Row gutter={[16, 16]}>
        {recommendations.map((product) => (
          <Col xs={12} sm={8} md={6} lg={4} key={product.id}>
            <ProductCard 
              product={{
                ...product,
                price_sale: parseFloat(product.price_sale),
                price_original: parseFloat(product.price_original),
              }} 
            />
          </Col>
        ))}
      </Row>
    </Card>
  );
}