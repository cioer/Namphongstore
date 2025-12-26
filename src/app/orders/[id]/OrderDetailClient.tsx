'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Typography, 
  Card, 
  Steps, 
  Divider, 
  Tag, 
  Space, 
  Button, 
  Modal, 
  Form, 
  Input,
  message,
  Table,
  Empty,
  Upload,
  Image,
  Select,
  Alert
} from 'antd';
import { 
  ShoppingOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  CloseCircleOutlined,
  SafetyOutlined,
  PhoneOutlined,
  SwapOutlined,
  UploadOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { formatVND } from '@/lib/utils';
import type { UploadFile } from 'antd';

const { TextArea } = Input;

interface OrderDetailClientProps {
  order: any;
}

const statusConfig: Record<string, { label: string; color: string; icon?: any }> = {
  NEW: { label: 'Mới', color: 'blue', icon: <ClockCircleOutlined /> },
  CONFIRMED: { label: 'Đã xác nhận', color: 'cyan', icon: <CheckCircleOutlined /> },
  SHIPPING: { label: 'Đang giao', color: 'orange', icon: <ShoppingOutlined /> },
  DELIVERED: { label: 'Đã giao', color: 'green', icon: <CheckCircleOutlined /> },
  CANCELLED_BY_CUSTOMER: { label: 'Đã hủy bởi khách', color: 'red', icon: <CloseCircleOutlined /> },
  CANCELLED_BY_SHOP: { label: 'Đã hủy bởi cửa hàng', color: 'red', icon: <CloseCircleOutlined /> },
};

const warrantyStatusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Còn hạn', color: 'green' },
  EXPIRED: { label: 'Hết hạn', color: 'red' },
  REPLACED: { label: 'Đã thay thế', color: 'orange' },
};

const returnStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'orange' },
  APPROVED: { label: 'Đã duyệt', color: 'cyan' },
  REJECTED: { label: 'Từ chối', color: 'red' },
  COMPLETED: { label: 'Hoàn tất', color: 'green' },
};

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter();
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelForm] = Form.useForm();
  const [cancelling, setCancelling] = useState(false);

  // Return request state
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnForm] = Form.useForm();
  const [returning, setReturning] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]);
  const [selectedWarrantyUnit, setSelectedWarrantyUnit] = useState<string | null>(null);
  const [returns, setReturns] = useState<any[]>([]);

  // Declare computed values before using them
  const canCancel = order.status === 'NEW' || order.status === 'CONFIRMED';
  const isDelivered = order.status === 'DELIVERED';
  const isCancelled = order.status === 'CANCELLED_BY_CUSTOMER' || order.status === 'CANCELLED_BY_SHOP';

  const fetchReturns = async () => {
    try {
      const res = await fetch(`/api/returns?order_id=${order.id}`);
      const data = await res.json();
      if (res.ok) {
        setReturns(data.returns || []);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
    }
  };

  useEffect(() => {
    if (isDelivered) {
      fetchReturns();
    }
  }, [isDelivered]);

  // Check if within 30 days for returns
  const canReturn = () => {
    if (!isDelivered || !order.delivered_date) return false;
    const deliveredDate = new Date(order.delivered_date);
    const now = new Date();
    const daysSinceDelivery = Math.floor(
      (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceDelivery <= 30;
  };

  // Get all warranty units for selection
  const getAllWarrantyUnits = () => {
    const units: any[] = [];
    order.items.forEach((item: any) => {
      if (item.warranty_units) {
        item.warranty_units.forEach((unit: any) => {
          // Check if this warranty unit has a pending return request
          const hasPendingReturn = returns.some(
            (ret: any) => ret.warranty_unit_id === unit.id && ret.status === 'PENDING'
          );
          
          units.push({
            ...unit,
            product_name: item.snapshot_name,
            hasPendingReturn,
          });
        });
      }
    });
    return units;
  };

  // Calculate timeline step
  const getTimelineStep = () => {
    const statusOrder = ['NEW', 'CONFIRMED', 'SHIPPING', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(order.status);
    return currentIndex >= 0 ? currentIndex : 0;
  };

  const handleCancelOrder = async (values: { reason: string }) => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: values.reason }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Hủy đơn hàng thất bại');
      }

      message.success('Đã hủy đơn hàng thành công');
      setCancelModalVisible(false);
      router.refresh();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleUploadChange = async ({ fileList: newFileList }: any) => {
    // Limit to 5 files
    if (newFileList.length > 5) {
      message.error('Tối đa 5 ảnh');
      return;
    }

    setFileList(newFileList);

    // Upload immediately when files are selected
    const filesToUpload = newFileList.filter((file: any) => !file.url && file.originFileObj);
    
    if (filesToUpload.length > 0) {
      const formData = new FormData();
      filesToUpload.forEach((file: any) => {
        formData.append('images', file.originFileObj);
      });

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Upload thất bại');
        }

        setUploadedPaths(data.paths);
        message.success('Upload ảnh thành công');
      } catch (error: any) {
        message.error(error.message);
      }
    }
  };

  const handleSubmitReturn = async (values: any) => {
    if (uploadedPaths.length === 0) {
      message.error('Vui lòng upload ít nhất 1 ảnh');
      return;
    }

    setReturning(true);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          warranty_unit_id: selectedWarrantyUnit,
          reason: values.reason,
          images: uploadedPaths,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gửi yêu cầu thất bại');
      }

      message.success('Đã gửi yêu cầu đổi trả thành công!');
      setReturnModalVisible(false);
      returnForm.resetFields();
      setFileList([]);
      setUploadedPaths([]);
      setSelectedWarrantyUnit(null);
      fetchReturns();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setReturning(false);
    }
  };

  // Warranty table columns
  const warrantyColumns = [
    {
      title: 'STT',
      dataIndex: 'unit_no',
      key: 'unit_no',
      width: 70,
    },
    {
      title: 'Mã bảo hành',
      dataIndex: 'warranty_code_auto',
      key: 'warranty_code_auto',
      render: (code: string) => <Typography.Text strong copyable>{code}</Typography.Text>,
    },
    {
      title: 'Số serial',
      dataIndex: 'serial_no',
      key: 'serial_no',
      render: (serial: string | null) => serial || <Typography.Text type="secondary">Chưa cập nhật</Typography.Text>,
    },
    {
      title: 'Thời hạn',
      key: 'warranty_period',
      render: (record: any) => (
        <div>
          <div>{record.warranty_months_at_purchase} tháng</div>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(record.start_date).toLocaleDateString('vi-VN')} - {new Date(record.end_date).toLocaleDateString('vi-VN')}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={warrantyStatusConfig[status]?.color || 'default'}>
          {warrantyStatusConfig[status]?.label || status}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: '40px 50px', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={2}>
          <ShoppingOutlined /> Chi tiết đơn hàng
        </Typography.Title>
        <Link href={`/orders?phone=${encodeURIComponent(order.customer_phone)}`}>
          <Button icon={<PhoneOutlined />}>
            Xem tất cả đơn hàng
          </Button>
        </Link>
      </div>

      {/* Order Header */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Text strong style={{ fontSize: '18px' }}>
              Đơn hàng #{order.order_code}
            </Typography.Text>
            <Tag 
              color={statusConfig[order.status]?.color || 'default'}
              style={{ marginLeft: '12px', fontSize: '14px' }}
            >
              {statusConfig[order.status]?.icon} {statusConfig[order.status]?.label || order.status}
            </Tag>
          </div>
          <Space>
            {canCancel && (
              <Button danger onClick={() => setCancelModalVisible(true)}>
                Hủy đơn hàng
              </Button>
            )}
            {canReturn() && (
              <Button 
                type="primary" 
                icon={<SwapOutlined />}
                onClick={() => setReturnModalVisible(true)}
              >
                Yêu cầu đổi trả
              </Button>
            )}
          </Space>
        </div>

        <Divider />

        <div>
          <Typography.Text type="secondary">Ngày đặt hàng: </Typography.Text>
          <Typography.Text strong>
            {new Date(order.created_at).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography.Text>
        </div>

        {order.delivered_date && (
          <div style={{ marginTop: '8px' }}>
            <Typography.Text type="secondary">Ngày giao hàng: </Typography.Text>
            <Typography.Text strong>
              {new Date(order.delivered_date).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography.Text>
          </div>
        )}

        {order.cancel_reason && (
          <div style={{ marginTop: '8px' }}>
            <Typography.Text type="secondary">Lý do hủy: </Typography.Text>
            <Typography.Text>{order.cancel_reason}</Typography.Text>
          </div>
        )}
      </Card>

      {/* Status Timeline */}
      {!isCancelled && (
        <Card title="Trạng thái đơn hàng" style={{ marginBottom: '20px' }}>
          <Steps
            current={getTimelineStep()}
            items={[
              {
                title: 'Đơn hàng mới',
                description: 'Đơn hàng đã được tạo',
                icon: <ClockCircleOutlined />,
              },
              {
                title: 'Đã xác nhận',
                description: 'Shop đã xác nhận đơn hàng',
                icon: <CheckCircleOutlined />,
              },
              {
                title: 'Đang giao',
                description: 'Đơn hàng đang được vận chuyển',
                icon: <ShoppingOutlined />,
              },
              {
                title: 'Đã giao',
                description: 'Đơn hàng đã được giao thành công',
                icon: <CheckCircleOutlined />,
              },
            ]}
          />
        </Card>
      )}

      {/* Customer Info */}
      <Card title="Thông tin người nhận" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>Người nhận: </Typography.Text>
            <Typography.Text>{order.customer_name}</Typography.Text>
          </div>
          <div>
            <Typography.Text strong>Số điện thoại: </Typography.Text>
            <Typography.Text>{order.customer_phone}</Typography.Text>
          </div>
          {order.customer_email && (
            <div>
              <Typography.Text strong>Email: </Typography.Text>
              <Typography.Text>{order.customer_email}</Typography.Text>
            </div>
          )}
          <div>
            <Typography.Text strong>Địa chỉ giao hàng: </Typography.Text>
            <Typography.Text>
              {order.customer_address}
              {order.customer_ward && `, ${order.customer_ward}`}
              {order.customer_district && `, ${order.customer_district}`}
              , {order.customer_city}
            </Typography.Text>
          </div>
          {order.notes && (
            <div>
              <Typography.Text strong>Ghi chú: </Typography.Text>
              <Typography.Text>{order.notes}</Typography.Text>
            </div>
          )}
        </Space>
      </Card>

      {/* Products */}
      <Card title="Sản phẩm đã đặt" style={{ marginBottom: '20px' }}>
        {order.items.map((item: any, index: number) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 0',
              borderBottom: index < order.items.length - 1 ? '1px solid #f0f0f0' : 'none',
            }}
          >
            <div style={{ flex: 1 }}>
              <Typography.Text strong>{item.snapshot_name}</Typography.Text>
              <div style={{ marginTop: '4px', color: '#666', fontSize: '14px' }}>
                Số lượng: {item.quantity} × {formatVND(item.unit_price_at_purchase)}
              </div>
            </div>
            <Typography.Text strong style={{ color: '#ff4d4f' }}>
              {formatVND(Number(item.unit_price_at_purchase) * item.quantity)}
            </Typography.Text>
          </div>
        ))}

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Typography.Text>Tạm tính:</Typography.Text>
          <Typography.Text strong>{formatVND(order.total_amount)}</Typography.Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Typography.Text>Phí vận chuyển:</Typography.Text>
          <Typography.Text strong style={{ color: '#52c41a' }}>Miễn phí</Typography.Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text strong style={{ fontSize: '18px' }}>Tổng cộng:</Typography.Text>
          <Typography.Text strong style={{ fontSize: '24px', color: '#ff4d4f' }}>
            {formatVND(order.total_amount)}
          </Typography.Text>
        </div>
      </Card>

      {/* Warranty Section */}
      <Card 
        title={
          <span>
            <SafetyOutlined /> Thông tin bảo hành
          </span>
        }
        style={{ marginBottom: '20px' }}
      >
        {!isDelivered ? (
          <Empty
            description="Thông tin bảo hành sẽ được cập nhật sau khi đơn hàng được giao thành công"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div>
            <Typography.Paragraph>
              Mã bảo hành sẽ được kích hoạt từ ngày giao hàng. Vui lòng lưu giữ mã bảo hành để sử dụng dịch vụ bảo hành.
            </Typography.Paragraph>
            
            {order.items.map((item: any) => (
              <div key={item.id} style={{ marginBottom: '24px' }}>
                <Typography.Title level={5}>{item.snapshot_name}</Typography.Title>
                
                {item.warranty_units && item.warranty_units.length > 0 ? (
                  <Table
                    columns={warrantyColumns}
                    dataSource={item.warranty_units}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    bordered
                  />
                ) : (
                  <Empty 
                    description="Chưa có thông tin bảo hành" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Returns Section */}
      {isDelivered && returns.length > 0 && (
        <Card 
          title={
            <span>
              <SwapOutlined /> Yêu cầu đổi trả
            </span>
          }
          style={{ marginBottom: '20px' }}
        >
          {returns.map((returnReq: any) => (
            <Card key={returnReq.id} type="inner" style={{ marginBottom: 12 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography.Text strong>Yêu cầu #{returnReq.id.substring(0, 8)}</Typography.Text>
                  <Tag color={returnStatusConfig[returnReq.status]?.color}>
                    {returnStatusConfig[returnReq.status]?.label}
                  </Tag>
                </div>
                <div>
                  <Typography.Text type="secondary">Lý do: </Typography.Text>
                  <Typography.Text>{returnReq.reason}</Typography.Text>
                </div>
                {returnReq.admin_note && (
                  <div>
                    <Typography.Text type="secondary">Ghi chú quản trị: </Typography.Text>
                    <Typography.Text>{returnReq.admin_note}</Typography.Text>
                  </div>
                )}
                {returnReq.images && returnReq.images.length > 0 && (
                  <div>
                    <Typography.Text type="secondary">Hình ảnh: </Typography.Text>
                    <Image.PreviewGroup>
                      <Space>
                        {returnReq.images.map((img: string, idx: number) => (
                          <Image
                            key={idx}
                            src={img}
                            alt={`Return image ${idx + 1}`}
                            width={80}
                            height={80}
                            style={{ objectFit: 'cover', borderRadius: 4 }}
                          />
                        ))}
                      </Space>
                    </Image.PreviewGroup>
                  </div>
                )}
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(returnReq.created_at).toLocaleString('vi-VN')}
                </Typography.Text>
              </Space>
            </Card>
          ))}
        </Card>
      )}

      {/* Cancel Modal */}
      <Modal
        title="Hủy đơn hàng"
        open={cancelModalVisible}
        onCancel={() => {
          setCancelModalVisible(false);
          cancelForm.resetFields();
        }}
        footer={null}
      >
        <Typography.Paragraph>
          Bạn có chắc chắn muốn hủy đơn hàng <Typography.Text strong>#{order.order_code}</Typography.Text>?
        </Typography.Paragraph>

        <Form
          form={cancelForm}
          layout="vertical"
          onFinish={handleCancelOrder}
        >
          <Form.Item
            label="Lý do hủy đơn"
            name="reason"
            rules={[
              { required: true, message: 'Vui lòng nhập lý do hủy đơn' },
              { min: 10, message: 'Lý do phải có ít nhất 10 ký tự' },
            ]}
          >
            <TextArea
              placeholder="Ví dụ: Đặt nhầm sản phẩm, thay đổi nhu cầu..."
              rows={4}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={cancelling}
              >
                Xác nhận hủy
              </Button>
              <Button onClick={() => setCancelModalVisible(false)}>
                Quay lại
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Return Request Modal */}
      <Modal
        title="Yêu cầu đổi trả sản phẩm"
        open={returnModalVisible}
        onCancel={() => {
          setReturnModalVisible(false);
          returnForm.resetFields();
          setFileList([]);
          setUploadedPaths([]);
          setSelectedWarrantyUnit(null);
        }}
        footer={null}
        width={700}
      >
        <Alert
          message="Chính sách đổi trả"
          description="Sản phẩm được đổi trả trong vòng 30 ngày kể từ ngày giao hàng. Vui lòng cung cấp hình ảnh và mô tả lý do đổi trả."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={returnForm}
          layout="vertical"
          onFinish={handleSubmitReturn}
        >
          <Form.Item
            label="Chọn mã bảo hành (tùy chọn)"
            help="Nếu đổi trả cho một sản phẩm cụ thể, vui lòng chọn mã bảo hành"
          >
            <Select
              placeholder="Chọn mã bảo hành..."
              allowClear
              value={selectedWarrantyUnit}
              onChange={setSelectedWarrantyUnit}
            >
              {getAllWarrantyUnits().map((unit: any) => (
                <Select.Option 
                  key={unit.id} 
                  value={unit.id}
                  disabled={unit.hasPendingReturn}
                >
                  {unit.product_name} - {unit.warranty_code_auto} (Số {unit.unit_no})
                  {unit.hasPendingReturn && <Tag color="orange" style={{ marginLeft: 8 }}>Đang chờ duyệt</Tag>}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Lý do đổi trả"
            name="reason"
            rules={[
              { required: true, message: 'Vui lòng nhập lý do đổi trả' },
              { min: 10, message: 'Lý do phải có ít nhất 10 ký tự' },
            ]}
          >
            <TextArea
              placeholder="Mô tả chi tiết lý do đổi trả (lỗi kỹ thuật, không đúng mô tả, v.v.)"
              rows={4}
            />
          </Form.Item>

          <Form.Item
            label="Hình ảnh sản phẩm"
            required
            help="Tối đa 5 ảnh, mỗi ảnh không quá 5MB"
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('Chỉ chấp nhận file ảnh!');
                  return false;
                }
                const isLt5M = file.size / 1024 / 1024 < 5;
                if (!isLt5M) {
                  message.error('Ảnh phải nhỏ hơn 5MB!');
                  return false;
                }
                return false; // Prevent auto upload, we handle it manually
              }}
              onRemove={(file) => {
                const index = fileList.indexOf(file);
                const newFileList = fileList.slice();
                newFileList.splice(index, 1);
                setFileList(newFileList);
                
                // Remove from uploaded paths
                const newPaths = uploadedPaths.slice();
                newPaths.splice(index, 1);
                setUploadedPaths(newPaths);
              }}
              maxCount={5}
            >
              {fileList.length >= 5 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={returning}
                icon={<SwapOutlined />}
              >
                Gửi yêu cầu
              </Button>
              <Button onClick={() => setReturnModalVisible(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
