'use client';

import { Row, Col, Divider, Card } from 'antd';
import { ThunderboltOutlined, FireOutlined } from '@ant-design/icons';
import Link from 'next/link';
import ProductCard from '@/components/shop/product/ProductCard';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  specs: any;
  gifts: any;
  images: any;
  price_original: string;
  price_sale: string;
  discount_percent: number;
  promo_start: string | null;
  promo_end: string | null;
  warranty_months: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HomeContentProps {
  categories: Category[];
  dealsProducts: Product[];
  bestSellers: Product[];
}

export default function HomeContent({ categories, dealsProducts, bestSellers }: HomeContentProps) {
  return (
    <div style={{ background: '#f0f2f5', minHeight: 'calc(100vh - 200px)' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '60px 50px',
        textAlign: 'center',
        color: '#fff'
      }}>
        <h1 style={{ color: '#fff', fontSize: '48px', marginBottom: '20px' }}>
          <ThunderboltOutlined /> Điện máy Nam Phong
        </h1>
        <p style={{ fontSize: '20px', color: '#fff', marginBottom: '30px' }}>
          Uy tín - Chất lượng - Giá tốt nhất thị trường
        </p>
      </div>

      {/* Categories */}
      <div style={{ padding: '40px 50px', background: '#fff' }}>
        <h2>Danh mục sản phẩm</h2>
        <Row gutter={[16, 16]}>
          {categories.map((cat) => (
            <Col xs={12} sm={8} md={4} key={cat.id}>
              <Link href={`/c/${cat.slug}`}>
                <Card
                  hoverable
                  cover={
                    <div style={{ 
                      height: '120px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: '#f5f5f5'
                    }}>
                      <img
                        alt={cat.name}
                        src={cat.image_url || ''}
                        style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  }
                  styles={{ body: { textAlign: 'center', padding: '12px' } }}
                >
                  <div style={{ fontWeight: 'bold' }}>{cat.name}</div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>

      <Divider />

      {/* Deals Section */}
      {dealsProducts.length > 0 && (
        <div style={{ padding: '40px 50px' }}>
          <h2>
            <FireOutlined style={{ color: '#ff4d4f' }} /> Khuyến mãi hot
          </h2>
          <Row gutter={[16, 16]}>
            {dealsProducts.map((product) => (
              <Col xs={24} sm={12} md={6} key={product.id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        </div>
      )}

      <Divider />

      {/* Best Sellers */}
      <div style={{ padding: '40px 50px', background: '#fff' }}>
        <h2>
          <ThunderboltOutlined style={{ color: '#1890ff' }} /> Sản phẩm bán chạy
        </h2>
        <Row gutter={[16, 16]}>
          {bestSellers.map((product) => (
            <Col xs={24} sm={12} md={6} key={product.id}>
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
