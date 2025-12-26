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
        color="red"
        style={{ display: hasDiscount ? 'block' : 'none' }}
      >
        <Card
          hoverable
          cover={
            <div style={{ 
              width: '100%', 
              height: '240px', 
              overflow: 'hidden',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
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
          style={{ height: '100%' }}
        >
          <Card.Meta
            title={
              <div style={{ 
                height: '48px', 
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                fontSize: '14px'
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
                    color: '#ff4d4f' 
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
                    color: '#52c41a'
                  }}>
                    <GiftOutlined /> {gifts.length} quà tặng
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
