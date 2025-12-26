import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Button, Card, Result, Space, Divider } from 'antd';
import { CheckCircleOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatVND } from '@/lib/utils';

interface SuccessPageProps {
  params: { code: string };
}

export const dynamic = 'force-dynamic';

async function getOrder(orderCode: string) {
  const order = await prisma.order.findUnique({
    where: { order_code: orderCode },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) return null;

  // Convert Decimal to string and Date to ISO string for RSC serialization
  return {
    ...order,
    total_amount: order.total_amount.toString(),
    delivered_date: order.delivered_date?.toISOString() ?? null,
    created_at: order.created_at.toISOString(),
    updated_at: order.updated_at.toISOString(),
    items: order.items.map((item: typeof order.items[number]) => ({
      ...item,
      unit_price_at_purchase: item.unit_price_at_purchase.toString(),
      created_at: item.created_at.toISOString(),
      product: {
        ...item.product,
        price_original: item.product.price_original.toString(),
        price_sale: item.product.price_sale.toString(),
        promo_start: item.product.promo_start?.toISOString() ?? null,
        promo_end: item.product.promo_end?.toISOString() ?? null,
        created_at: item.product.created_at.toISOString(),
        updated_at: item.product.updated_at.toISOString(),
      },
    })),
  };
}

export default async function OrderSuccessPage({ params }: SuccessPageProps) {
  const { code } = params;
  const order = await getOrder(code);

  if (!order) {
    notFound();
  }

  return (
    <div style={{ 
      padding: '40px 50px', 
      minHeight: 'calc(100vh - 200px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Card style={{ maxWidth: '700px', width: '100%' }}>
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title={<h2>Đặt hàng thành công!</h2>}
          subTitle={
            <div>
              <p style={{ fontSize: '16px' }}>
                Cảm ơn bạn đã đặt hàng tại Điện máy Nam Phong!
              </p>
              <p>
                Mã đơn hàng của bạn là: <span style={{ fontWeight: 600, fontSize: '20px', color: '#1890ff' }}>{order.order_code}</span>
              </p>
            </div>
          }
          extra={[
            <Link href={`/track-order?phone=${encodeURIComponent(order.customer_phone)}`} key="track">
              <Button type="primary" size="large" icon={<PhoneOutlined />}>
                Tra cứu đơn hàng
              </Button>
            </Link>,
            <Link href="/" key="home">
              <Button size="large" icon={<HomeOutlined />}>
                Về trang chủ
              </Button>
            </Link>,
          ]}
        />

        <Divider />

        {/* Order Details */}
        <div style={{ padding: '0 24px' }}>
          <h4>Thông tin đơn hàng</h4>
          
          <div style={{ marginBottom: '20px' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Người nhận: </span>
                <span style={{ fontWeight: 600 }}>{order.customer_name}</span>
              </div>
              <div>
                <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Số điện thoại: </span>
                <span style={{ fontWeight: 600 }}>{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div>
                  <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Email: </span>
                  <span>{order.customer_email}</span>
                </div>
              )}
              <div>
                <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Địa chỉ giao hàng: </span>
                <span>
                  {order.customer_address}
                  {order.customer_ward && `, ${order.customer_ward}`}
                  {order.customer_district && `, ${order.customer_district}`}
                  , {order.customer_city}
                </span>
              </div>
            </Space>
          </div>

          <Divider />

          <h4>Sản phẩm đã đặt</h4>
          
          {order.items.map((item: any, index: number) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: index < order.items.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}
            >
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>{item.snapshot_name}</span>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  Số lượng: {item.quantity} × {formatVND(item.unit_price_at_purchase)}
                </div>
              </div>
              <span style={{ fontWeight: 600, color: '#ff4d4f' }}>
                {formatVND(Number(item.unit_price_at_purchase) * item.quantity)}
              </span>
            </div>
          ))}

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Tạm tính:</span>
            <span style={{ fontWeight: 600 }}>{formatVND(order.total_amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span>Phí vận chuyển:</span>
            <span style={{ fontWeight: 600, color: '#52c41a' }}>Miễn phí</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: '18px' }}>Tổng cộng:</span>
            <span style={{ fontWeight: 600, fontSize: '24px', color: '#ff4d4f' }}>
              {formatVND(order.total_amount)}
            </span>
          </div>

          <Divider />

          <div style={{ background: '#e6f7ff', padding: '16px', borderRadius: '8px' }}>
            <h5 style={{ marginTop: 0 }}>
              <CheckCircleOutlined style={{ color: '#1890ff' }} /> Lưu ý quan trọng
            </h5>
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>Đơn hàng của bạn đang được xử lý</li>
              <li>Chúng tôi sẽ liên hệ với bạn qua số điện thoại <span style={{ fontWeight: 600 }}>{order.customer_phone}</span> để xác nhận đơn hàng</li>
              <li>Thanh toán khi nhận hàng (COD)</li>
              <li>Bạn có thể tra cứu đơn hàng bằng số điện thoại hoặc mã đơn hàng</li>
              <li>Liên hệ hotline <span style={{ fontWeight: 600, color: '#ff4d4f' }}>1900-xxxx</span> nếu cần hỗ trợ</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
