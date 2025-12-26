'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Card, message, Space, Tag, Popconfirm, Input } from 'antd';
import { Image } from 'antd';
import { Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatVND } from '@/lib/utils';
import Link from 'next/link';
import { User, Product } from '@/types';

const { Search } = Input;
const { Title } = Typography;

export default function AdminProductsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchProducts();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth', {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (!data.user) {
        router.push('/admin/login');
        return;
      }
      
      setUser(data.user);
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/products', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      message.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      message.success('Đã xóa sản phẩm');
      fetchProducts();
    } catch (error) {
      message.error('Không thể xóa sản phẩm');
    }
  };

  const filteredProducts = products.filter(product => {
    const search = searchText.toLowerCase();
    return (
      product.name.toLowerCase().includes(search) ||
      product.brand?.toLowerCase().includes(search) ||
      product.category?.name.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      title: 'Hình ảnh',
      key: 'image',
      width: 80,
      render: (record: Product) => {
        const images = record.images as any;
        const firstImage = Array.isArray(images) && images.length > 0 ? images[0] : null;
        return firstImage ? (
          <Image
            src={firstImage}
            alt={record.name}
            width={60}
            height={60}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div style={{ 
            width: 60, 
            height: 60, 
            background: '#f0f0f0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 4,
            fontSize: 12,
            color: '#999'
          }}>
            No Image
          </div>
        );
      },
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Product) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <small style={{ color: '#666' }}>{record.brand}</small>
        </div>
      ),
    },
    {
      title: 'Danh mục',
      key: 'category',
      render: (record: Product) => record.category?.name || 'N/A',
    },
    {
      title: 'Giá bán',
      key: 'price',
      render: (record: Product) => (
        <div>
          <div style={{ fontWeight: 600 }}>{formatVND(Number(record.price_sale))}</div>
          {record.discount_percent > 0 && (
            <small style={{ textDecoration: 'line-through', color: '#999' }}>
              {formatVND(Number(record.price_original))}
            </small>
          )}
        </div>
      ),
    },
    {
      title: 'Giảm giá',
      dataIndex: 'discount_percent',
      key: 'discount_percent',
      render: (value: number) => value > 0 ? <Tag color="red">-{value}%</Tag> : '-',
    },
    {
      title: 'BH (tháng)',
      dataIndex: 'warranty_months',
      key: 'warranty_months',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'red'}>
          {value ? 'Hoạt động' : 'Tạm ngưng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: Product) => (
        <Space>
          <Link href={`/admin/products/${record.id}/edit`}>
            <Button type="link" size="small" icon={<EditOutlined />}>
              Sửa
            </Button>
          </Link>
          <Popconfirm
            title="Xóa sản phẩm?"
            description="Bạn có chắc muốn xóa sản phẩm này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ 
        background: '#fff', 
        borderBottom: '1px solid #e8e8e8',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Quản lý sản phẩm</Title>
          {user && <small style={{ color: '#666' }}>{user.full_name} ({user.role})</small>}
        </div>

      </div>

      <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, justifyContent: 'space-between' }}>
            <Search
              placeholder="Tìm theo tên, thương hiệu, danh mục..."
              allowClear
              style={{ width: 400 }}
              onChange={e => setSearchText(e.target.value)}
            />
            <Link href="/admin/products/new">
              <Button type="primary" icon={<PlusOutlined />} size="large">
                Tạo sản phẩm mới
              </Button>
            </Link>
          </div>

          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} sản phẩm`,
            }}
          />
        </Card>
      </div>
    </div>
  );
}
