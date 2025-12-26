'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Row, Col, Typography, Pagination, Breadcrumb, Skeleton, Empty, Space } from 'antd';
import { HomeOutlined, SearchOutlined } from '@ant-design/icons';
import Link from 'next/link';
import ProductCard from '@/components/shop/product/ProductCard';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (query) {
      fetchSearchResults();
    } else {
      setLoading(false);
    }
  }, [query, currentPage]);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        page: currentPage.toString(),
        limit: '12',
      });

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      
      setProducts(data.products || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px 50px', minHeight: 'calc(100vh - 200px)' }}>
      <Breadcrumb style={{ marginBottom: '20px' }}>
        <Breadcrumb.Item>
          <Link href="/">
            <HomeOutlined /> Trang chủ
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Tìm kiếm</Breadcrumb.Item>
      </Breadcrumb>

      <Typography.Title level={2}>
        <SearchOutlined /> Kết quả tìm kiếm: "{query}"
      </Typography.Title>
      
      {!query ? (
        <Empty
          description="Vui lòng nhập từ khóa tìm kiếm"
          style={{ padding: '60px 0' }}
        />
      ) : loading ? (
        <Row gutter={[16, 16]}>
          {[...Array(12)].map((_, i) => (
            <Col xs={24} sm={12} md={6} key={i}>
              <Skeleton.Image style={{ width: '100%', height: 300 }} active />
              <Skeleton active paragraph={{ rows: 2 }} />
            </Col>
          ))}
        </Row>
      ) : products.length === 0 ? (
        <Empty
          description={`Không tìm thấy sản phẩm nào với từ khóa "${query}"`}
          style={{ padding: '60px 0' }}
        />
      ) : (
        <>
          <div style={{ marginBottom: '20px', color: '#666' }}>
            Tìm thấy {pagination.total} sản phẩm
          </div>

          <Row gutter={[16, 16]}>
            {products.map((product) => (
              <Col xs={24} sm={12} md={6} key={product.id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <Pagination
                current={pagination.page}
                total={pagination.total}
                pageSize={pagination.limit}
                onChange={(page) => {
                  const newParams = new URLSearchParams({ q: query, page: page.toString() });
                  window.location.href = `/search?${newParams.toString()}`;
                }}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}><Skeleton active /></div>}>
      <SearchContent />
    </Suspense>
  );
}
