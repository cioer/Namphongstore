'use client';

import { Typography, Card, Divider, Space } from 'antd';
import { SafetyCertificateOutlined, SyncOutlined, StopOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function WarrantyPolicyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', backgroundColor: '#FFFDF5', minHeight: '100vh' }}>
      <Typography>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 40, fontFamily: "'Playfair Display', serif", color: '#D70018' }}>
          🧧 Chính sách Bảo hành & Đổi trả
        </Title>

        <Card 
          style={{ marginBottom: 24, borderColor: '#D4AF37' }}
          className="tet-card-hover"
        >
          <Space align="start">
            <SyncOutlined style={{ fontSize: 24, color: '#D4AF37', marginTop: 5 }} />
            <div>
              <Title level={4} style={{ color: '#990000', fontFamily: "'Playfair Display', serif" }}>1. Chính sách Đổi trả 1-1 (30 Ngày Đầu)</Title>
              <Paragraph>
                Áp dụng cho các sản phẩm gặp lỗi phần cứng do nhà sản xuất trong thời gian <Text strong>30 ngày đầu tiên</Text> kể từ ngày nhận hàng (căn cứ theo thời gian giao hàng thành công trên hệ thống).
              </Paragraph>
              <Text strong style={{ color: '#D70018' }}>Quyền lợi:</Text>
              <ul>
                <li>Đổi ngay sản phẩm mới 100% cùng model, cùng cấu hình.</li>
                <li>Trường hợp sản phẩm hết hàng: Khách hàng được đổi sang model tương đương hoặc hoàn tiền 100% giá trị trên hóa đơn.</li>
                <li>Sản phẩm đổi trả phải còn nguyên vẹn, đầy đủ hộp, phụ kiện và quà tặng kèm theo (nếu có).</li>
              </ul>
            </div>
          </Space>
        </Card>

        <Card 
          style={{ marginBottom: 24, borderColor: '#D4AF37' }}
          className="tet-card-hover"
        >
          <Space align="start">
            <SafetyCertificateOutlined style={{ fontSize: 24, color: '#D4AF37', marginTop: 5 }} />
            <div>
              <Title level={4} style={{ color: '#990000', fontFamily: "'Playfair Display', serif" }}>2. Chính sách Bảo hành Sửa chữa</Title>
              <Paragraph>
                Áp dụng từ <Text strong>tháng thứ 2</Text> đến hết thời hạn bảo hành niêm yết của sản phẩm (thường là 12 tháng).
              </Paragraph>
              <Text strong style={{ color: '#D70018' }}>Quy trình:</Text>
              <ul>
                <li>Tiếp nhận sản phẩm và kiểm tra lỗi tại trung tâm bảo hành Nam Phong.</li>
                <li>Sửa chữa hoặc thay thế linh kiện chính hãng miễn phí với các lỗi do nhà sản xuất.</li>
                <li>Thời gian xử lý: Từ 3 - 7 ngày làm việc (không tính Thứ 7, CN và ngày Lễ/Tết).</li>
                <li>Trong trường hợp không sửa được, Shop sẽ đổi mainboard hoặc đổi máy tương đương theo thỏa thuận.</li>
              </ul>
            </div>
          </Space>
        </Card>

        <Card style={{ borderColor: '#D70018', borderWidth: '2px' }}>
          <Space align="start">
            <StopOutlined style={{ fontSize: 24, color: '#D70018', marginTop: 5 }} />
            <div>
              <Title level={4} style={{ color: '#D70018', fontFamily: "'Playfair Display', serif" }}>3. Điều Kiện & Từ chối Bảo hành</Title>
              <Paragraph>
                Sản phẩm được bảo hành khi còn trong thời gian bảo hành và thỏa mãn các điều kiện sau. Shop có quyền từ chối bảo hành (Void) nếu:
              </Paragraph>
              <ul>
                <li>Sản phẩm hết hạn bảo hành (căn cứ theo Serial Number hoặc hóa đơn điện tử).</li>
                <li>Sản phẩm bị rơi vỡ, cấn móp, biến dạng khung vỏ, hỏng màn hình do tác động vật lý.</li>
                <li>Sản phẩm bị vào nước, hóa chất, ẩm mốc hoặc có dấu hiệu côn trùng xâm nhập.</li>
                <li><Text type="danger" strong>Tem bảo hành bị rách, chắp vá, tẩy xóa hoặc không còn nguyên vẹn.</Text></li>
                <li>Tự ý tháo lắp, sửa chữa, thay đổi linh kiện bên ngoài hệ thống của Nam Phong Store.</li>
                <li>Hư hỏng do thiên tai, hỏa hoạn, sét đánh hoặc sử dụng sai điện áp quy định.</li>
              </ul>
            </div>
          </Space>
        </Card>
      </Typography>
    </div>
  );
}
