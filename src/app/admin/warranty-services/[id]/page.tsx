'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Typography, Descriptions, Tag, Button, Select, Input, message, Divider, Steps, Spin, Space, Row, Col, Image } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface WarrantyServiceDetail {
  id: string;
  type: string;
  status: string;
  issue_description: string;
  technician_note: string | null;
  created_at: string;
  updated_at: string;
  warranty_unit: {
    warranty_code_auto: string;
    unit_no: number;
    start_date: string;
    end_date: string;
    order_item: {
      snapshot_name: string;
      product: {
        name: string;
        images: string[];
      };
      order: {
        id: string;
        order_code: string;
        customer_name: string;
        customer_phone: string;
      };
    };
  };
}

const statusSteps = [
  { 
    key: 'PENDING', 
    title: 'Tiếp nhận', 
    icon: <ClockCircleOutlined /> 
  },
  { 
    key: 'IN_PROGRESS', 
    title: 'Đang xử lý', 
    icon: <SyncOutlined spin /> 
  },
  { 
    key: 'COMPLETED', 
    title: 'Hoàn thành', 
    icon: <CheckCircleOutlined /> 
  }
];

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const [service, setService] = useState<WarrantyServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Form state
  const [status, setStatus] = useState<string>('');
  const [note, setNote] = useState<string>('');
  
  const router = useRouter();

  useEffect(() => {
    fetchServiceDetail();
  }, [params.id]);

  const fetchServiceDetail = async () => {
    try {
      const res = await fetch(`/api/admin/warranty-services/${params.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch service');
      const data = await res.json();
      setService(data.service);
      setStatus(data.service.status);
      setNote(data.service.technician_note || '');
    } catch (error) {
      message.error('Không thể tải thông tin dịch vụ');
      router.push('/admin/returns');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/warranty-services/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            status, 
            technician_note: note 
        }),
        credentials: 'include' 
      });
      
      if (!res.ok) throw new Error('Update failed');
      
      message.success('Đã cập nhật dịch vụ thành công');
      fetchServiceDetail(); // Refresh data
    } catch (error) {
      message.error('Lỗi khi cập nhật');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>;
  if (!service) return null;

  const currentStep = statusSteps.findIndex(s => s.key === service.status);
  const productInfo = service.warranty_unit.order_item.product;
  const orderInfo = service.warranty_unit.order_item.order;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Link href="/admin/returns">
               <Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
            </Link>
            <Title level={3} style={{ margin: 0 }}>
               Yêu cầu #{service.id.substring(0, 8)} 
            </Title>
            <Tag color="purple">{service.type === 'REPAIR' ? 'Sửa chữa' : service.type}</Tag>
          </Space>
        </div>

        <Row gutter={24}>
          {/* Main Content */}
          <Col span={16}>
            <Card style={{ marginBottom: 24 }}>
               <Steps 
                  current={currentStep} 
                  items={statusSteps.map(s => ({ title: s.title, icon: s.key === status ? s.icon : undefined }))}
                  style={{ marginBottom: 24 }}
               />
               
               <Descriptions title="Thông tin Sản phẩm" bordered column={1}>
                  <Descriptions.Item label="Sản phẩm">
                     <Space>
                        {productInfo.images && productInfo.images[0] && (
                            <Image src={productInfo.images[0]} width={50} />
                        )}
                        <Text strong>{productInfo.name}</Text>
                     </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã bảo hành">
                      <Tag color="cyan" style={{ fontSize: 14 }}>{service.warranty_unit.warranty_code_auto}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời hạn bảo hành">
                      {new Date(service.warranty_unit.start_date).toLocaleDateString('vi-VN')} - {new Date(service.warranty_unit.end_date).toLocaleDateString('vi-VN')}
                  </Descriptions.Item>
               </Descriptions>

               <Divider />

               <Descriptions title="Chi tiết vấn đề" bordered column={1}>
                   <Descriptions.Item label="Mô tả lỗi từ khách">
                       {service.issue_description}
                   </Descriptions.Item>
                   <Descriptions.Item label="Ngày tạo yêu cầu">
                       {new Date(service.created_at).toLocaleString('vi-VN')}
                   </Descriptions.Item>
               </Descriptions>
            </Card>

            <Card title="Xử lý kỹ thuật" style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 16 }}>
                    <Text strong>Cập nhật trạng thái:</Text>
                    <Select 
                        value={status} 
                        onChange={setStatus} 
                        style={{ width: '100%', marginTop: 8 }}
                        size="large"
                    >
                        <Option value="PENDING">Chờ tiếp nhận</Option>
                        <Option value="IN_PROGRESS">Đang xử lý / Sửa chữa</Option>
                        <Option value="COMPLETED">Hoàn thành & Trả máy</Option>
                    </Select>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Text strong>Ghi chú kỹ thuật (Nội bộ/Khách hàng):</Text>
                    <TextArea 
                        rows={6} 
                        value={note} 
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Nhập chi tiết quá trình kiểm tra, linh kiện thay thế, chi phí dự kiến..."
                        style={{ marginTop: 8 }}
                    />
                </div>

                <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    onClick={handleSave}
                    loading={updating}
                    size="large"
                >
                    Lưu cập nhật
                </Button>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col span={8}>
            <Card title="Thông tin Khách hàng" style={{ marginBottom: 24 }}>
                <Descriptions column={1} size="small">
                    <Descriptions.Item label="Tên khách">
                         <Text strong>{orderInfo.customer_name}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                         <a href={`tel:${orderInfo.customer_phone}`}>{orderInfo.customer_phone}</a>
                    </Descriptions.Item>
                    <Descriptions.Item label="Đơn hàng gốc">
                        <Link href={`/admin/orders/${orderInfo.id}`}> 
                             {orderInfo.order_code}
                        </Link>
                    </Descriptions.Item>
                </Descriptions>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
