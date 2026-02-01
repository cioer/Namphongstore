'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Row, Col, Breadcrumb, Tabs, Button, Space, Tag, Divider, message } from 'antd';
import { HomeOutlined, ThunderboltOutlined, GiftOutlined, SafetyOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatVND, getFirstImage } from '@/lib/utils';
import ImageGallery from '@/components/shop/product/ImageGallery';
import AddToCartButton from '@/components/shop/product/AddToCartButton';
import ProductReviews from '@/components/shop/product/ProductReviews';
import ProductRecommendations from '@/components/shop/product/ProductRecommendations';
import { Product } from '@/types';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  
  // Parse JSON fields safely
  const specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : (product.specs || {});
  const gifts = Array.isArray(product.gifts) ? product.gifts : [];
  const images = Array.isArray(product.images) ? product.images : [];

  const hasPromo = product.discount_percent > 0 && 
    product.promo_start && 
    product.promo_end && 
    new Date() >= new Date(product.promo_start) && 
    new Date() <= new Date(product.promo_end);

  const handleBuyNow = () => {
    const newItem = {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price_sale,
      quantity: 1,
      image: getFirstImage(product.images),
    };

    // Set checkout items to only this product
    localStorage.setItem('checkout_items', JSON.stringify([newItem]));
    router.push('/checkout');
  };

  const tabItems = [
    {
      key: 'description',
      label: 'Mô tả sản phẩm',
      children: (
        <div style={{ padding: '20px' }}>
          <div style={{ fontSize: '16px', lineHeight: '1.8', whiteSpace: 'pre-wrap', color: '#333' }}>
            {product.description || 'Thông tin mô tả sản phẩm đang được cập nhật.'}
          </div>
        </div>
      ),
    },
    {
      key: 'specs',
      label: 'Thông số kỹ thuật',
      children: (
        <div style={{ padding: '20px' }}>
          {Object.keys(specs).length === 0 ? (
            <p>Thông số kỹ thuật đang được cập nhật.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {Object.entries(specs).map(([key, value], index) => (
                  <tr key={key} style={{ 
                    background: index % 2 === 0 ? '#fafafa' : '#fff',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', width: '40%' }}>{key}</td>
                    <td style={{ padding: '12px' }}>{value as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ),
    },
    {
      key: 'gifts',
      label: `Quà tặng (${gifts.length})`,
      children: (
        <div style={{ padding: '20px' }}>
          {gifts.length === 0 ? (
            <p>Sản phẩm hiện không có quà tặng kèm theo.</p>
          ) : (
            <ul style={{ fontSize: '16px', lineHeight: '2' }}>
              {gifts.map((gift: string, index: number) => (
                <li key={index}>
                  <GiftOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                  {gift}
                </li>
              ))}
            </ul>
          )}
        </div>
      ),
    },
    {
      key: 'reviews',
      label: 'Đánh giá từ khách hàng',
      children: (
        <ProductReviews 
          productId={product.id}
          productName={product.name}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '20px 50px', background: '#fff', minHeight: 'calc(100vh - 200px)' }}>
      <Breadcrumb style={{ marginBottom: '20px' }}>
        <Breadcrumb.Item>
          <Link href="/">
            <HomeOutlined /> Trang chủ
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link href={`/c/${product.category?.slug}`}>
            {product.category?.name}
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{product.name}</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[32, 32]}>
        {/* Image Gallery */}
        <Col xs={24} md={10}>
          <ImageGallery images={images} productName={product.name} />
        </Col>

        {/* Product Info */}
        <Col xs={24} md={14}>
          <h2>{product.name}</h2>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* Brand */}
            {product.brand && (
              <div>
                <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Thương hiệu: </span>
                <Tag color="blue">{product.brand}</Tag>
              </div>
            )}

            {/* Price */}
            <div style={{ 
              background: '#fff7e6', 
              padding: '20px', 
              borderRadius: '8px',
              border: '2px solid #ffa940'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {formatVND(product.price_sale)}
              </div>
              
              {hasPromo && product.discount_percent > 0 && (
                <>
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '18px', color: '#999', textDecoration: 'line-through' }}>
                      {formatVND(product.price_original)}
                    </span>
                    <Tag color="red" style={{ marginLeft: '10px', fontSize: '16px' }}>
                      -{product.discount_percent}%
                    </Tag>
                  </div>
                  <span style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.45)' }}>
                    Tiết kiệm: {formatVND(Number(product.price_original) - Number(product.price_sale))}
                  </span>
                </>
              )}
            </div>

            {/* Gifts Preview */}
            {gifts.length > 0 && (
              <div style={{ 
                background: '#f6ffed', 
                padding: '15px', 
                borderRadius: '8px',
                border: '1px solid #b7eb8f'
              }}>
                <span style={{ fontWeight: 600, color: '#52c41a' }}>
                  <GiftOutlined /> Quà tặng kèm theo:
                </span>
                <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                  {gifts.slice(0, 3).map((gift: string, index: number) => (
                    <li key={index}>{gift}</li>
                  ))}
                  {gifts.length > 3 && <li>Và {gifts.length - 3} quà tặng khác...</li>}
                </ul>
              </div>
            )}

            {/* Warranty */}
            <div style={{ 
              background: '#e6f7ff', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid #91d5ff'
            }}>
              <span style={{ fontWeight: 600, color: '#1890ff' }}>
                <SafetyOutlined /> Bảo hành: {product.warranty_months} tháng
              </span>
            </div>

            <Divider />

            {/* Actions */}
            <Space size="large" style={{ width: '100%' }}>
              <AddToCartButton product={product} />
              <Button 
                type="primary" 
                danger
                size="large" 
                icon={<ThunderboltOutlined />}
                block
                onClick={handleBuyNow}
              >
                Mua ngay (COD)
              </Button>
            </Space>

            {/* Additional Info */}
            <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
              <p>✓ Giao hàng miễn phí toàn quốc</p>
              <p>✓ Thanh toán khi nhận hàng (COD)</p>
              <p>✓ Đổi trả trong 30 ngày</p>
            </div>
          </Space>
        </Col>
      </Row>

      <Divider />

      {/* Tabs */}
      <Tabs defaultActiveKey="description" items={tabItems} size="large" />
      
      {/* Product Recommendations */}
      <ProductRecommendations 
        productId={product.id}
        title="Khách hàng cũng mua"
        limit={6}
      />
    </div>
  );
}
