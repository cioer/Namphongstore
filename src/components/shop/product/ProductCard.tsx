'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Badge, Card, Rate } from 'antd';
import { GiftOutlined, StarFilled } from '@ant-design/icons';
import { formatVND, getFirstImage, handleImageError, isPromoActive } from '@/lib/utils';
import { ProductSummary } from '@/types';

interface ProductCardProps {
  product: ProductSummary;
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.discount_percent > 0 && isPromoActive(product.promo_start, product.promo_end);
  const gifts = Array.isArray(product.gifts) ? product.gifts : [];

  return (
    <Link href={`/p/${product.slug}`}>
      <Badge.Ribbon
        text={`-${product.discount_percent}%`}
        color="#D70018"
        style={{ display: hasDiscount ? 'block' : 'none' }}
      >
        <Card
          hoverable
          className="tet-card-hover"
          cover={
            <div style={{ 
              width: '100%', 
              height: '240px', 
              overflow: 'hidden',
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              borderBottom: '1px solid #D4AF37'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', border: '4px double #D4AF37', opacity: 0.3, zIndex: 1 }}></div>
              <Image
                alt={product.name}
                src={getFirstImage(product.images)}
                fill
                style={{
                  objectFit: 'contain',
                  padding: '10px'
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          }
          style={{ height: '100%', borderColor: '#D4AF37' }}
        >
          <Card.Meta
            title={
              <div style={{ 
                height: '48px', 
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                fontSize: '14px',
                fontFamily: "'Playfair Display', serif",
                color: '#333'
              }}>
                {product.name}
              </div>
            }
            description={
              <div>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: '#D70018' 
                  }}>
                    {formatVND(product.price_sale)}
                  </span>
                  {hasDiscount && (
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ 
                        fontSize: '14px', 
                        textDecoration: 'line-through',
                        color: '#999'
                      }}>
                        {formatVND(product.price_original)}
                      </span>
                    </div>
                  )}
                </div>                {/* Rating Display */}
                {product.averageRating && product.averageRating > 0 && (
                  <div style={{ 
                    marginTop: '8px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Rate 
                      disabled 
                      value={product.averageRating} 
                      allowHalf 
                      style={{ fontSize: '12px' }}
                    />
                    <span style={{ color: '#666' }}>
                      {product.averageRating.toFixed(1)} ({product.totalReviews})
                    </span>
                  </div>
                )}                {gifts.length > 0 && (
                  <div style={{ 
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#D4AF37',
                    fontWeight: '500'
                  }}>
                    <GiftOutlined /> {gifts.length} quà Tết
                  </div>
                )}
              </div>
            }
          />
        </Card>
      </Badge.Ribbon>
    </Link>
  );
}
