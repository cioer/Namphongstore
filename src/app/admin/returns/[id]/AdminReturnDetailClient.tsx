'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Typography,
  message,
  Modal,
  Input,
  Tag,
  Image,
  Timeline,
  Divider,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { TextArea } = Input;

const returnStatusConfig: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'orange', text: 'Chờ duyệt' },
  APPROVED: { color: 'cyan', text: 'Đã duyệt' },
  REJECTED: { color: 'red', text: 'Từ chối' },
  COMPLETED: { color: 'green', text: 'Hoàn tất' },
};

const eventTypeLabels: Record<string, string> = {
  RETURN_CREATED: 'Tạo yêu cầu',
  RETURN_APPROVED: 'Duyệt yêu cầu',
  RETURN_REJECTED: 'Từ chối yêu cầu',
  RETURN_COMPLETED: 'Hoàn tất thay thế',
  WARRANTY_REPLACED: 'Thay thế bảo hành',
  WARRANTY_NEW_CREATED_FROM_REPLACEMENT: 'Tạo mã BH mới',
};

export default function AdminReturnDetailClient({ returnRequest }: { returnRequest: any }) {
  const router = useRouter();
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const canApprove = returnRequest.status === 'PENDING';
  const canComplete = returnRequest.status === 'APPROVED' && returnRequest.warranty_unit_id;

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/returns/${returnRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_note: adminNote }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Duyệt thất bại');
      }

      message.success('Đã duyệt yêu cầu đổi trả');
      setApproveModalVisible(false);
      router.refresh();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!adminNote || adminNote.trim().length < 10) {
      message.error('Vui lòng nhập lý do từ chối (ít nhất 10 ký tự)');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/returns/${returnRequest.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_note: adminNote }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Từ chối thất bại');
      }

      message.success('Đã từ chối yêu cầu đổi trả');
      setRejectModalVisible(false);
      router.refresh();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/returns/${returnRequest.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Hoàn tất thất bại');
      }

      message.success('Đã hoàn tất thay thế sản phẩm');
      setCompleteModalVisible(false);
      router.refresh();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 24 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '16px 24px' }}>
        <Space>
          <Link href="/admin/returns">
            <Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
          </Link>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Yêu cầu đổi trả #{returnRequest.id.substring(0, 8)}
          </Typography.Title>
          <Tag color={returnStatusConfig[returnRequest.status]?.color}>
            {returnStatusConfig[returnRequest.status]?.text}
          </Tag>
        </Space>
      </div>

      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        {/* Action Buttons */}
        {(canApprove || canComplete) && (
          <Card style={{ marginBottom: 16 }}>
            <Space wrap>
              {canApprove && (
                <>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircleOutlined />}
                    onClick={() => setApproveModalVisible(true)}
                  >
                    Duyệt yêu cầu
                  </Button>
                  <Button
                    danger
                    size="large"
                    icon={<CloseCircleOutlined />}
                    onClick={() => setRejectModalVisible(true)}
                  >
                    Từ chối
                  </Button>
                </>
              )}
              {canComplete && (
                <Button
                  type="primary"
                  size="large"
                  icon={<ToolOutlined />}
                  onClick={() => setCompleteModalVisible(true)}
                >
                  Hoàn tất thay thế
                </Button>
              )}
            </Space>
          </Card>
        )}

        {/* Return Request Info */}
        <Card title="Thông tin yêu cầu" style={{ marginBottom: 16 }}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Đơn hàng">
              <Link href={`/admin/orders/${returnRequest.order.id}`}>
                {returnRequest.order.order_code}
              </Link>
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              {returnRequest.order.customer_name}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {returnRequest.order.customer_phone}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {new Date(returnRequest.created_at).toLocaleString('vi-VN')}
            </Descriptions.Item>
            {returnRequest.warranty_unit && (
              <>
                <Descriptions.Item label="Mã bảo hành">
                  <Typography.Text copyable style={{ fontFamily: 'monospace' }}>
                    {returnRequest.warranty_unit.warranty_code_auto}
                  </Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="Số thứ tự">
                  {returnRequest.warranty_unit.unit_no}
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="Lý do đổi trả" span={2}>
              {returnRequest.reason}
            </Descriptions.Item>
            {returnRequest.admin_note && (
              <Descriptions.Item label="Ghi chú quản trị" span={2}>
                <Alert message={returnRequest.admin_note} type="info" />
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Images */}
        {returnRequest.images && returnRequest.images.length > 0 && (
          <Card title="Hình ảnh sản phẩm" style={{ marginBottom: 16 }}>
            <Image.PreviewGroup>
              <Space wrap>
                {returnRequest.images.map((img: string, idx: number) => (
                  <Image
                    key={idx}
                    src={img}
                    alt={`Return image ${idx + 1}`}
                    width={150}
                    height={150}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          </Card>
        )}

        {/* Replacement Info */}
        {returnRequest.warranty_unit?.replaced_old_unit && (
          <Card title="Thông tin thay thế" style={{ marginBottom: 16 }}>
            <Alert
              message="Sản phẩm đã được thay thế"
              description={
                <div>
                  <div>Mã BH mới: <Typography.Text copyable strong>{returnRequest.warranty_unit.replaced_old_unit.warranty_code_auto}</Typography.Text></div>
                  <div style={{ marginTop: 8 }}>
                    <Typography.Text type="secondary">
                      Ngày bắt đầu: {new Date(returnRequest.warranty_unit.replaced_old_unit.start_date).toLocaleDateString('vi-VN')}
                    </Typography.Text>
                    {' | '}
                    <Typography.Text type="secondary">
                      Ngày hết hạn: {new Date(returnRequest.warranty_unit.replaced_old_unit.end_date).toLocaleDateString('vi-VN')}
                    </Typography.Text>
                  </div>
                </div>
              }
              type="success"
              showIcon
            />
          </Card>
        )}

        {/* Timeline */}
        <Card title="Lịch sử xử lý">
          <Timeline>
            {returnRequest.event_logs.map((log: any) => (
              <Timeline.Item key={log.id} color="blue">
                <div>
                  <strong>{eventTypeLabels[log.event_type] || log.event_type}</strong>
                  {log.metadata?.admin_note && (
                    <div style={{ color: '#666', marginTop: 4 }}>
                      Ghi chú: {log.metadata.admin_note}
                    </div>
                  )}
                  {log.metadata?.old_warranty_code && (
                    <div style={{ color: '#666', marginTop: 4 }}>
                      Mã BH cũ: {log.metadata.old_warranty_code} → Mã BH mới: {log.metadata.new_warranty_code}
                    </div>
                  )}
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    {new Date(log.created_at).toLocaleString('vi-VN')}
                    {log.user && ` • ${log.user.full_name} (${log.user.role})`}
                  </div>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      </div>

      {/* Approve Modal */}
      <Modal
        title="Duyệt yêu cầu đổi trả"
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => setApproveModalVisible(false)}
        confirmLoading={processing}
        okText="Xác nhận duyệt"
        cancelText="Hủy"
      >
        <p>Bạn có chắc muốn duyệt yêu cầu đổi trả này?</p>
        <TextArea
          placeholder="Ghi chú (tùy chọn)"
          rows={3}
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
        />
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Từ chối yêu cầu đổi trả"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={processing}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
      >
        <p>Bạn có chắc muốn từ chối yêu cầu đổi trả này?</p>
        <TextArea
          placeholder="Lý do từ chối (bắt buộc, ít nhất 10 ký tự)"
          rows={3}
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          required
        />
      </Modal>

      {/* Complete Modal */}
      <Modal
        title="Hoàn tất thay thế"
        open={completeModalVisible}
        onOk={handleComplete}
        onCancel={() => setCompleteModalVisible(false)}
        confirmLoading={processing}
        okText="Xác nhận hoàn tất"
        cancelText="Hủy"
      >
        <Alert
          message="Lưu ý"
          description="Hệ thống sẽ tự động tạo mã bảo hành mới cho sản phẩm thay thế và liên kết với mã bảo hành cũ."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <p>Bạn có chắc đã hoàn tất việc thay thế sản phẩm?</p>
      </Modal>
    </div>
  );
}
