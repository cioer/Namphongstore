'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, 
  Card, 
  Typography, 
  Space, 
  Button, 
  Badge,
  Tag,
  Input,
  Select,
  message,
  Modal,
  Form,
  InputNumber,
  Statistic,
  Row,
  Col,
  Alert
} from 'antd';
import { 
  WarningOutlined, 
  EditOutlined, 
  ReloadOutlined,
  ExclamationCircleOutlined,
  ShoppingCartOutlined,
  AlertOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { formatVND } from '@/lib/utils';

const { Title } = Typography;
const { Search } = Input;

interface Product {
  id: string;
  name: string;
  brand: string;
  category: { name: string };
  price_sale: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

interface InventoryStats {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
}

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0
  });
  
  // Bulk update modal
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [bulkForm] = Form.useForm();
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Single product update modal
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [updateForm] = Form.useForm();
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/products', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      
      const data = await response.json();
      const productList = data.products || [];
      setProducts(productList);
      
      // Calculate stats
      const totalProducts = productList.length;
      const lowStockCount = productList.filter((p: Product) => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
      const outOfStockCount = productList.filter((p: Product) => p.stock_quantity === 0).length;
      const totalValue = productList.reduce((sum: number, p: Product) => sum + (parseFloat(p.price_sale) * p.stock_quantity), 0);
      
      setStats({
        totalProducts,
        lowStockCount,
        outOfStockCount,
        totalValue
      });
    } catch (error) {
      message.error('Không thể tải dữ liệu kho hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleUpdate = async (values: any) => {
    if (!selectedProduct) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          stock_quantity: values.stock_quantity,
          is_active: values.is_active
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Cập nhật thất bại');
      }

      message.success('Cập nhật thành công!');
      setUpdateModalVisible(false);
      fetchInventory();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkUpdate = async (values: any) => {
    setBulkUpdating(true);
    try {
      const promises = selectedRowKeys.map(productId => 
        fetch(`/api/admin/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            stock_quantity: values.action === 'set' ? values.stock_quantity : undefined,
            stock_adjustment: values.action === 'adjust' ? values.adjustment : undefined,
            is_active: values.is_active
          }),
        })
      );

      await Promise.all(promises);
      message.success(`Đã cập nhật ${selectedRowKeys.length} sản phẩm`);
      setBulkModalVisible(false);
      setSelectedRowKeys([]);
      bulkForm.resetFields();
      fetchInventory();
    } catch (error) {
      message.error('Có lỗi khi cập nhật hàng loạt');
    } finally {
      setBulkUpdating(false);
    }
  };

  const openSingleUpdate = (product: Product) => {
    setSelectedProduct(product);
    updateForm.setFieldsValue({
      stock_quantity: product.stock_quantity,
      is_active: product.is_active
    });
    setUpdateModalVisible(true);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { color: 'red', text: 'Hết hàng' };
    if (quantity <= 5) return { color: 'orange', text: 'Sắp hết' };
    if (quantity <= 20) return { color: 'yellow', text: 'Ít' };
    return { color: 'green', text: 'Còn hàng' };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
      product.category.name.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStock = 
      stockFilter === 'ALL' ||
      (stockFilter === 'LOW' && product.stock_quantity > 0 && product.stock_quantity <= 5) ||
      (stockFilter === 'OUT' && product.stock_quantity === 0);
    
    return matchesSearch && matchesStock;
  });

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 300,
      render: (record: Product) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.brand} • {record.category.name}
          </div>
        </div>
      ),
    },
    {
      title: 'Giá bán',
      dataIndex: 'price_sale',
      key: 'price_sale',
      width: 120,
      render: (price: string) => formatVND(price),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 100,
      render: (quantity: number) => {
        const status = getStockStatus(quantity);
        return (
          <Tag color={status.color} icon={quantity === 0 ? <ExclamationCircleOutlined /> : undefined}>
            {quantity} - {status.text}
          </Tag>
        );
      },
      sorter: (a: Product, b: Product) => a.stock_quantity - b.stock_quantity,
    },
    {
      title: 'Giá trị tồn',
      key: 'total_value',
      width: 120,
      render: (record: Product) => formatVND(parseFloat(record.price_sale) * record.stock_quantity),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean) => (
        <Badge 
          status={isActive ? 'success' : 'default'} 
          text={isActive ? 'Đang bán' : 'Tạm dừng'} 
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (record: Product) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />}
            onClick={() => openSingleUpdate(record)}
          >
            Sửa
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            <ShoppingCartOutlined style={{ marginRight: 12 }} />
            Quản lý kho hàng
          </Title>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchInventory}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>

        {/* Stats Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Tổng sản phẩm" 
                value={stats.totalProducts}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Sắp hết hàng" 
                value={stats.lowStockCount}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Hết hàng" 
                value={stats.outOfStockCount}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Tổng giá trị kho" 
                value={formatVND(stats.totalValue)}
                prefix="₫"
              />
            </Card>
          </Col>
        </Row>

        {/* Low Stock Alert */}
        {stats.lowStockCount > 0 && (
          <Alert
            type="warning"
            showIcon
            icon={<AlertOutlined />}
            message={`Có ${stats.lowStockCount} sản phẩm sắp hết hàng`}
            description="Kiểm tra và nhập thêm hàng để tránh hết stock"
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" onClick={() => setStockFilter('LOW')}>
                Xem danh sách
              </Button>
            }
          />
        )}

        {/* Filters and Actions */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col flex="300px">
              <Search
                placeholder="Tìm theo tên, thương hiệu, danh mục..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col flex="200px">
              <Select
                value={stockFilter}
                onChange={setStockFilter}
                style={{ width: '100%' }}
              >
                <Select.Option value="ALL">Tất cả</Select.Option>
                <Select.Option value="LOW">Sắp hết hàng</Select.Option>
                <Select.Option value="OUT">Hết hàng</Select.Option>
              </Select>
            </Col>
            <Col flex="auto" style={{ textAlign: 'right' }}>
              <Space>
                {selectedRowKeys.length > 0 && (
                  <Button 
                    type="primary"
                    onClick={() => setBulkModalVisible(true)}
                  >
                    Cập nhật hàng loạt ({selectedRowKeys.length})
                  </Button>
                )}
                <Link href="/admin/products/new">
                  <Button type="primary">Thêm sản phẩm mới</Button>
                </Link>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Inventory Table */}
        <Card>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredProducts}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} sản phẩm`,
            }}
            scroll={{ x: 1000 }}
          />
        </Card>

        {/* Single Update Modal */}
        <Modal
          title="Cập nhật sản phẩm"
          open={updateModalVisible}
          onCancel={() => setUpdateModalVisible(false)}
          footer={null}
        >
          <Form
            form={updateForm}
            onFinish={handleSingleUpdate}
            layout="vertical"
          >
            <Form.Item
              label="Số lượng tồn kho"
              name="stock_quantity"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              label="Trạng thái"
              name="is_active"
              valuePropName="checked"
            >
              <Select>
                <Select.Option value={true}>Đang bán</Select.Option>
                <Select.Option value={false}>Tạm dừng</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setUpdateModalVisible(false)}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={updating}>
                  Cập nhật
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Bulk Update Modal */}
        <Modal
          title="Cập nhật hàng loạt"
          open={bulkModalVisible}
          onCancel={() => setBulkModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={bulkForm}
            onFinish={handleBulkUpdate}
            layout="vertical"
          >
            <Form.Item
              label="Thao tác với tồn kho"
              name="action"
              rules={[{ required: true, message: 'Vui lòng chọn thao tác' }]}
            >
              <Select placeholder="Chọn thao tác">
                <Select.Option value="set">Đặt số lượng cố định</Select.Option>
                <Select.Option value="adjust">Điều chỉnh (+ hoặc -)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item dependencies={['action']}>
              {({ getFieldValue }) => {
                const action = getFieldValue('action');
                if (action === 'set') {
                  return (
                    <Form.Item
                      label="Số lượng mới"
                      name="stock_quantity"
                      rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  );
                } else if (action === 'adjust') {
                  return (
                    <Form.Item
                      label="Điều chỉnh số lượng (+ hoặc -)"
                      name="adjustment"
                      rules={[{ required: true, message: 'Vui lòng nhập số điều chỉnh' }]}
                    >
                      <InputNumber style={{ width: '100%' }} placeholder="VD: +10, -5" />
                    </Form.Item>
                  );
                }
                return null;
              }}
            </Form.Item>

            <Form.Item
              label="Trạng thái"
              name="is_active"
            >
              <Select placeholder="Giữ nguyên trạng thái hiện tại" allowClear>
                <Select.Option value={true}>Đang bán</Select.Option>
                <Select.Option value={false}>Tạm dừng</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setBulkModalVisible(false)}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={bulkUpdating}>
                  Cập nhật {selectedRowKeys.length} sản phẩm
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

      </div>
    </div>
  );
}