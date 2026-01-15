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
  const sectionStyle = {
    background: 'rgba(255, 253, 245, 0.95)',
    borderRadius: '16px',
    padding: '30px',
    margin: '20px auto',
    maxWidth: '1200px',
    boxShadow: '0 4px 12px rgba(215, 0, 24, 0.15)',
    border: '1px solid #D4AF37'
  };

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 200px)', paddingBottom: '40px' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #D70018 0%, #990000 100%)',
        padding: '80px 50px',
        textAlign: 'center',
        color: '#fff',
        borderBottom: '4px solid #D4AF37',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Circles */}
        <div style={{ position: 'absolute', top: -50, left: -50, width: 200, height: 200, border: '2px solid rgba(212, 175, 55, 0.3)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: -50, right: -50, width: 300, height: 300, border: '2px solid rgba(212, 175, 55, 0.3)', borderRadius: '50%' }}></div>
        
        <h1 style={{ 
          color: '#D4AF37', 
          fontSize: '56px', 
          marginBottom: '20px', 
          fontFamily: "'Playfair Display', serif", 
          fontWeight: 'bold', 
          textShadow: '2px 4px 6px rgba(0,0,0,0.4)',
          letterSpacing: '2px'
        }}>
          🧧 CUNG CHÚC TÂN XUÂN
        </h1>
        <p style={{ 
          fontSize: '24px', 
          color: '#FFFDF5', 
          marginBottom: '30px', 
          fontFamily: "'Playfair Display', serif", 
          fontStyle: 'italic',
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
        }}>
          An Khang Thịnh Vượng - Vạn Sự Như Ý
        </p>
      </div>

      {/* Categories */}
      <div style={sectionStyle}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#D70018', fontSize: '32px', margin: 0 }}>
            🌸 Danh Mục Sắm Tết
          </h2>
          <div style={{ width: '100px', height: '3px', background: '#D4AF37', margin: '10px auto' }}></div>
        </div>
        
        <Row gutter={[16, 16]}>
          {categories.map((cat) => (
            <Col xs={12} sm={8} md={4} key={cat.id}>
              <Link href={`/c/${cat.slug}`}>
                <Card
                  hoverable
                  className="tet-card-hover"
                  cover={
                    <div style={{ 
                      height: '120px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: '#fff',
                      borderBottom: '1px solid #D4AF37',
                      borderRadius: '16px 16px 0 0'
                    }}>
                      <img
                        alt={cat.name}
                        src={cat.image_url || ''}
                        style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  }
                  styles={{ body: { textAlign: 'center', padding: '12px' } }}
                  style={{ borderColor: '#D4AF37', borderRadius: '16px', overflow: 'hidden' }}
                >
                  <div style={{ fontWeight: 'bold', color: '#990000' }}>{cat.name}</div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>

      {/* Deals Section */}
      {dealsProducts.length > 0 && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '2px solid #D4AF37', paddingBottom: '10px' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#D70018', fontSize: '28px', margin: 0 }}>
              <FireOutlined style={{ color: '#D70018', marginRight: '10px' }} /> 
              Lộc Xuân Giá Sốc
            </h2>
            <Link href="/deals" style={{ color: '#D4AF37', fontStyle: 'italic' }}>Xem tất cả &gt;</Link>
          </div>
          <Row gutter={[16, 16]}>
            {dealsProducts.map((product) => (
              <Col xs={24} sm={12} md={6} key={product.id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Best Sellers */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '2px solid #D4AF37', paddingBottom: '10px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#D70018', fontSize: '28px', margin: 0 }}>
            <ThunderboltOutlined style={{ color: '#D4AF37', marginRight: '10px' }} /> 
            Khai Xuân Đắc Lộc
          </h2>
          <Link href="/best-sellers" style={{ color: '#D4AF37', fontStyle: 'italic' }}>Xem tất cả &gt;</Link>
        </div>
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
