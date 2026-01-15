'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Table, 
  Tag,
  Space,
  DatePicker,
  Select,
  Progress,
  Button,
  message
} from 'antd';
import { 
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  TrophyOutlined,
  RiseOutlined,
  BarChartOutlined,
  ReloadOutlined,
  SwapOutlined,
  ExclamationCircleOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  GiftOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { formatVND } from '@/lib/utils';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
}

interface TopProduct {
  name: string;
  brand: string;
  category: string;
  total_sold: number;
  revenue: number;
  profit_margin: number;
}

interface RecentOrder {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total_amount: string;
  created_at: string;
}

interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

interface ReturnStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
}

interface RecentReturn {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  order_code: string;
  customer_name: string;
}

interface CancelledOrder {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  total_amount: string;
  status: string;
  created_at: string;
  cancel_reason?: string;
}

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch('/api/admin/auth');
        const data = await res.json();
        if (data.user) {
          if (data.user.role === 'SALES') {
            router.push('/admin/orders');
          } else if (data.user.role === 'TECH') {
            router.push('/admin/returns');
          }
        }
      } catch (error) {
        console.error('Role check error:', error);
      }
    };
    checkRole();
  }, []);

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    orderGrowth: 0
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [returnStats, setReturnStats] = useState<ReturnStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0
  });
  const [recentReturns, setRecentReturns] = useState<RecentReturn[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<CancelledOrder[]>([]);

  const [processingExpiry, setProcessingExpiry] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      // Fetch analytics data
      const response = await fetch(`/api/admin/analytics?start_date=${startDate}&end_date=${endDate}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      
      setStats(data.stats || {
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        averageOrderValue: 0,
        revenueGrowth: 0,
        orderGrowth: 0
      });
      
      setTopProducts(data.topProducts || []);
      setRecentOrders(data.recentOrders || []);
      setStatusDistribution(data.statusDistribution || []);
      setReturnStats(data.returnStats || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0
      });
      setRecentReturns(data.recentReturns || []);
      setCancelledOrders(data.cancelledOrders || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Mock data for demo when API is not available
      setStats({
        totalRevenue: 125000000,
        totalOrders: 156,
        totalCustomers: 89,
        averageOrderValue: 801000,
        revenueGrowth: 12.5,
        orderGrowth: 8.2
      });
      
      setTopProducts([
        { name: 'Smart TV Samsung 55"', brand: 'Samsung', category: 'TV & Audio', total_sold: 23, revenue: 34500000, profit_margin: 15 },
        { name: 'Tủ lạnh LG InverterLinear', brand: 'LG', category: 'Tủ lạnh', total_sold: 18, revenue: 27000000, profit_margin: 18 },
        { name: 'Máy giặt Panasonic 9kg', brand: 'Panasonic', category: 'Máy giặt', total_sold: 15, revenue: 22500000, profit_margin: 12 },
        { name: 'Điều hòa Daikin 1.5HP', brand: 'Daikin', category: 'Điều hòa', total_sold: 12, revenue: 18000000, profit_margin: 20 },
        { name: 'Nồi cơm điện Toshiba', brand: 'Toshiba', category: 'Gia dụng', total_sold: 28, revenue: 8400000, profit_margin: 25 }
      ]);
      
      setStatusDistribution([
        { status: 'DELIVERED', count: 89, percentage: 57.1 },
        { status: 'SHIPPING', count: 23, percentage: 14.7 },
        { status: 'CONFIRMED', count: 18, percentage: 11.5 },
        { status: 'NEW', count: 15, percentage: 9.6 },
        { status: 'CANCELLED_BY_CUSTOMER', count: 8, percentage: 5.1 },
        { status: 'CANCELLED_BY_SHOP', count: 3, percentage: 1.9 }
      ]);

      setReturnStats({
        total: 12,
        pending: 5,
        approved: 4,
        rejected: 2,
        completed: 1
      });

      setRecentReturns([
        { id: '1', reason: 'Lỗi màn hình', status: 'PENDING', created_at: new Date().toISOString(), order_code: 'DH001', customer_name: 'Nguyễn Văn A' },
        { id: '2', reason: 'Không đúng mô tả', status: 'APPROVED', created_at: new Date().toISOString(), order_code: 'DH002', customer_name: 'Trần Thị B' },
      ]);
      
      setCancelledOrders([
        { id: '1', order_code: 'DH003', customer_name: 'Lê Văn C', customer_phone: '0901234567', total_amount: '2500000', status: 'CANCELLED_BY_CUSTOMER', created_at: new Date(Date.now() - 2*60*60*1000).toISOString(), cancel_reason: 'Thay đổi ý' },
        { id: '2', order_code: 'DH004', customer_name: 'Phạm Thị D', customer_phone: '0902345678', total_amount: '1800000', status: 'CANCELLED_BY_CUSTOMER', created_at: new Date(Date.now() - 4*60*60*1000).toISOString(), cancel_reason: 'Không cần nữa' },
        { id: '3', order_code: 'DH005', customer_name: 'Nguyễn Văn E', customer_phone: '0903456789', total_amount: '3200000', status: 'CANCELLED_BY_SHOP', created_at: new Date(Date.now() - 6*60*60*1000).toISOString(), cancel_reason: 'Hết hàng' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleScanExpiredWarranties = async () => {
    setProcessingExpiry(true);
    try {
      const res = await fetch('/api/cron/check-warranty-expiry', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.processed_count > 0) {
        message.success(`Đã xử lý ${data.processed_count} bảo hành hết hạn.`);
      } else {
        message.info('Không có bảo hành nào hết hạn.');
      }
    } catch (e) {
      message.error('Lỗi khi quét bảo hành hết hạn');
    } finally {
        setProcessingExpiry(false);
    }
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    NEW: { color: 'blue', label: 'Mới' },
    CONFIRMED: { color: 'orange', label: 'Đã xác nhận' },
    SHIPPING: { color: 'purple', label: 'Đang giao' },
    DELIVERED: { color: 'green', label: 'Đã giao' },
    CANCELLED_BY_CUSTOMER: { color: 'red', label: 'Khách hủy' },
    CANCELLED_BY_SHOP: { color: 'volcano', label: 'Shop hủy' },
  };

  const returnStatusConfig: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'orange', label: 'Chờ duyệt' },
    APPROVED: { color: 'cyan', label: 'Đã duyệt' },
    REJECTED: { color: 'red', label: 'Từ chối' },
    COMPLETED: { color: 'green', label: 'Hoàn tất' },
  };

  const productColumns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_: any, __: any, index: number) => (
        <div style={{ textAlign: 'center', fontWeight: 600 }}>
          {index + 1}
        </div>
      ),
    },
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (record: TopProduct) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.brand} • {record.category}
          </div>
        </div>
      ),
    },
    {
      title: 'Đã bán',
      dataIndex: 'total_sold',
      key: 'total_sold',
      width: 80,
      render: (count: number) => (
        <Tag color="blue">{count} cái</Tag>
      ),
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 120,
      render: (revenue: number) => (
        <span style={{ fontWeight: 500 }}>{formatVND(revenue)}</span>
      ),
    },
    {
      title: 'Margin',
      dataIndex: 'profit_margin',
      key: 'profit_margin',
      width: 100,
      render: (margin: number) => (
        <Tag color={margin > 20 ? 'green' : margin > 15 ? 'orange' : 'red'}>
          {margin}%
        </Tag>
      ),
    },
  ];

  const orderColumns = [
    {
      title: 'Mã đơn',
      dataIndex: 'order_code',
      key: 'order_code',
      width: 120,
      render: (code: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{code}</span>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (record: RecentOrder) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.customer_name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.customer_phone}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusConfig[status]?.color}>
          {statusConfig[status]?.label}
        </Tag>
      ),
    },
    {
      title: 'Giá trị',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount: string) => (
        <span style={{ fontWeight: 500 }}>{formatVND(amount)}</span>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (date: string) => (
        <span style={{ fontSize: '12px' }}>
          {dayjs(date).format('DD/MM HH:mm')}
        </span>
      ),
    },
  ];

  const returnColumns = [
    {
      title: 'Mã YC',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{id.substring(0, 8)}</span>
      ),
    },
    {
      title: 'Đơn hàng',
      dataIndex: 'order_code',
      key: 'order_code',
      width: 100,
      render: (code: string) => (
        <span style={{ fontFamily: 'monospace' }}>{code}</span>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={returnStatusConfig[status]?.color}>
          {returnStatusConfig[status]?.label}
        </Tag>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (date: string) => (
        <span style={{ fontSize: '12px' }}>
          {dayjs(date).format('DD/MM HH:mm')}
        </span>
      ),
    },
  ];
  
  const cancelledOrderColumns = [
    {
      title: 'Mã đơn',
      dataIndex: 'order_code',
      key: 'order_code',
      width: 100,
      render: (code: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{code}</span>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (record: CancelledOrder) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.customer_name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.customer_phone}</div>
        </div>
      ),
    },
    {
      title: 'Giá trị',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount: string) => (
        <span style={{ fontWeight: 500, color: '#f5222d' }}>{formatVND(amount)}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusConfig[status]?.color}>
          {statusConfig[status]?.label}
        </Tag>
      ),
    },
    {
      title: 'Lý do',
      dataIndex: 'cancel_reason',
      key: 'cancel_reason',
      ellipsis: true,
      width: 150,
    },
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (date: string) => (
        <span style={{ fontSize: '12px' }}>
          {dayjs(date).format('DD/MM HH:mm')}
        </span>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            <BarChartOutlined style={{ marginRight: 12 }} />
            Dashboard Analytics
          </Title>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              format="DD/MM/YYYY"
            />
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchDashboardData}
              loading={loading}
            >
              Làm mới
            </Button>
            <Button 
              icon={<HistoryOutlined />} 
              onClick={handleScanExpiredWarranties}
              loading={processingExpiry}
            >
              Quét bảo hành hết hạn
            </Button>
          </Space>
        </div>

        {/* Quick Actions */}
        <Card title="Truy cập nhanh" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col span={4}>
              <Link href="/admin/orders">
                <Button type="primary" block icon={<ShoppingCartOutlined />} size="large" style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Đơn hàng
                </Button>
              </Link>
            </Col>
            <Col span={4}>
              <Link href="/admin/products">
                <Button block icon={<AppstoreOutlined />} size="large" style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Sản phẩm
                </Button>
              </Link>
            </Col>
            <Col span={4}>
              <Link href="/admin/returns">
                <Button block icon={<SwapOutlined />} size="large" style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Đổi trả
                </Button>
              </Link>
            </Col>
            <Col span={4}>
              <Link href="/admin/promotions">
                <Button block icon={<GiftOutlined />} size="large" style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Khuyến mãi
                </Button>
              </Link>
            </Col>
            <Col span={4}>
              <Link href="/admin/audit-logs">
                <Button block icon={<FileTextOutlined />} size="large" style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Nhật ký
                </Button>
              </Link>
            </Col>
            <Col span={4}>
              <Link href="/admin/inventory">
                <Button block icon={<SafetyCertificateOutlined />} size="large" style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Kho hàng
                </Button>
              </Link>
            </Col>
          </Row>
        </Card>

        {/* KPI Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng doanh thu"
                value={formatVND(stats.totalRevenue)}
                prefix={<DollarOutlined />}
                suffix={
                  <Tag color={stats.revenueGrowth >= 0 ? 'green' : 'red'}>
                    {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}%
                  </Tag>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Số đơn hàng"
                value={stats.totalOrders}
                prefix={<ShoppingCartOutlined />}
                suffix={
                  <Tag color={stats.orderGrowth >= 0 ? 'green' : 'red'}>
                    {stats.orderGrowth >= 0 ? '+' : ''}{stats.orderGrowth}%
                  </Tag>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Khách hàng"
                value={stats.totalCustomers}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Giá trị TB/đơn"
                value={formatVND(stats.averageOrderValue)}
                prefix={<RiseOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Return Requests Stats */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <SwapOutlined />
                  Yêu cầu đổi trả
                  {returnStats.pending > 0 && (
                    <Tag color="orange" style={{ marginLeft: 8 }}>
                      <ExclamationCircleOutlined /> {returnStats.pending} chờ duyệt
                    </Tag>
                  )}
                </Space>
              }
              extra={
                returnStats.pending > 0 ? (
                  <Button 
                    type="primary" 
                    size="small"
                    style={{ backgroundColor: '#ff7a00', borderColor: '#ff7a00' }}
                    href="/admin/returns"
                  >
                    Duyệt ngay
                  </Button>
                ) : (
                  <Button size="small" href="/admin/returns">
                    Xem tất cả
                  </Button>
                )
              }
            >
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ 
                      fontSize: 28, 
                      fontWeight: 'bold', 
                      color: returnStats.pending > 0 ? '#ff7a00' : '#666',
                      marginBottom: 8 
                    }}>
                      {returnStats.pending}
                    </div>
                    <div style={{ color: '#666' }}>Chờ duyệt</div>
                    {returnStats.pending > 0 && (
                      <div style={{ fontSize: '12px', color: '#ff7a00', marginTop: 4 }}>
                        Cần xử lý ngay!
                      </div>
                    )}
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>
                      {returnStats.approved}
                    </div>
                    <div style={{ color: '#666' }}>Đã duyệt</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a', marginBottom: 8 }}>
                      {returnStats.completed}
                    </div>
                    <div style={{ color: '#666' }}>Hoàn tất</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#666', marginBottom: 8 }}>
                      {returnStats.total}
                    </div>
                    <div style={{ color: '#666' }}>Tổng cộng</div>
                  </div>
                </Col>
              </Row>
              
              {recentReturns.length > 0 && (
                <div>
                  <Title level={5} style={{ marginBottom: 16 }}>Yêu cầu gần đây</Title>
                  <Table
                    columns={returnColumns}
                    dataSource={recentReturns}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    size="small"
                    scroll={{ y: 200 }}
                  />
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Cancelled Orders Section */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <span style={{ color: '#f5222d' }}>❌</span>
                  Đơn hàng bị hủy
                  {cancelledOrders.length > 0 && (
                    <Tag color="red" style={{ marginLeft: 8 }}>
                      {cancelledOrders.length} đơn gần đây
                    </Tag>
                  )}
                </Space>
              }
              extra={
                <Button size="small" href="/admin/orders">
                  Xem tất cả đơn hàng
                </Button>
              }
            >
              {cancelledOrders.length > 0 ? (
                <Table
                  columns={cancelledOrderColumns}
                  dataSource={cancelledOrders}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                  size="small"
                  scroll={{ y: 200 }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                  Không có đơn hàng bị hủy gần đây
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          {/* Order Status Distribution */}
          <Col span={12}>
            <Card title="Phân bố trạng thái đơn hàng" style={{ height: 400 }}>
              <div style={{ padding: '20px 0' }}>
                {statusDistribution.map((item, index) => (
                  <div key={item.status} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Tag color={statusConfig[item.status]?.color}>
                        {statusConfig[item.status]?.label}
                      </Tag>
                      <span style={{ fontWeight: 500 }}>
                        {item.count} đơn ({item.percentage}%)
                      </span>
                    </div>
                    <Progress 
                      percent={item.percentage} 
                      showInfo={false}
                      strokeColor={
                        item.status === 'DELIVERED' ? '#52c41a' :
                        item.status === 'SHIPPING' ? '#722ed1' :
                        item.status === 'CONFIRMED' ? '#fa8c16' :
                        item.status === 'NEW' ? '#1890ff' :
                        '#f5222d'
                      }
                    />
                  </div>
                ))}
              </div>
            </Card>
          </Col>

          {/* Top Products */}
          <Col span={12}>
            <Card 
              title={
                <Space>
                  <TrophyOutlined />
                  Top sản phẩm bán chạy
                </Space>
              } 
              style={{ height: 400 }}
            >
              <Table
                columns={productColumns}
                dataSource={topProducts}
                rowKey="name"
                pagination={false}
                loading={loading}
                size="small"
                scroll={{ y: 280 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Recent Orders */}
        <Card title="Đơn hàng gần đây">
          <Table
            columns={orderColumns}
            dataSource={recentOrders}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
            }}
          />
        </Card>

      </div>
    </div>
  );
}