'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Row, Col, Typography, Select, Pagination, Breadcrumb, Skeleton, Empty, Space, Button } from 'antd';
import { HomeOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import Link from 'next/link';
import ProductCard from '@/components/shop/product/ProductCard';

const { Option } = Select;

interface CategoryPageProps {
  params: { slug: string };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { slug } = params;

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const currentBrand = searchParams.get('brand') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    fetchProducts();
  }, [slug, currentBrand, currentSort, currentPage]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: slug,
        sort: currentSort,
        page: currentPage.toString(),
        limit: '12',
      });
      
      if (currentBrand) {
        params.append('brand', currentBrand);
      }

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      
      setProducts(data.products || []);
      setPagination(data.pagination);

      // Extract unique brands
      const uniqueBrands = Array.from(new Set(data.products.map((p: any) => p.brand).filter(Boolean))) as string[];
      setBrands(uniqueBrands);

      // Get category info from first product
      if (data.products.length > 0) {
        setCategory(data.products[0].category);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filters change
    if (key !== 'page') {
      params.set('page', '1');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters = currentBrand || currentSort !== 'newest';

  return (
    <div style={{ padding: '20px 50px', minHeight: 'calc(100vh - 200px)' }}>
      <Breadcrumb style={{ marginBottom: '20px' }}>
        <Breadcrumb.Item>
          <Link href="/">
            <HomeOutlined /> Trang chủ
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{category?.name || slug}</Breadcrumb.Item>
      </Breadcrumb>

      <Typography.Title level={2}>{category?.name || slug}</Typography.Title>

      {/* Filters */}
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        marginBottom: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Space wrap>
          <span><FilterOutlined /> Bộ lọc:</span>
          
          <Select
            placeholder="Thương hiệu"
            style={{ width: 200 }}
            value={currentBrand || undefined}
            onChange={(value) => updateFilters('brand', value || '')}
            allowClear
          >
            {brands.map((brand) => (
              <Option key={brand} value={brand}>
                {brand}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Sắp xếp"
            style={{ width: 200 }}
            value={currentSort}
            onChange={(value) => updateFilters('sort', value)}
          >
            <Option value="newest">Mới nhất</Option>
            <Option value="price-asc">Giá tăng dần</Option>
            <Option value="price-desc">Giá giảm dần</Option>
            <Option value="name">Tên A-Z</Option>
          </Select>

          {hasFilters && (
            <Button icon={<ClearOutlined />} onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          )}
        </Space>
      </div>

      {/* Products Grid */}
      {loading ? (
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
          description="Không tìm thấy sản phẩm"
          style={{ padding: '60px 0' }}
        />
      ) : (
        <>
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
                onChange={(page) => updateFilters('page', page.toString())}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
