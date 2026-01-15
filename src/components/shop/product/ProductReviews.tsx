'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  Rate, 
  Button, 
  Form, 
  Input, 
  message, 
  Typography, 
  Space, 
  Avatar, 
  Progress,
  Row,
  Col,
  Tag,
  Empty,
  Modal,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  LikeOutlined, 
  CheckCircleOutlined,
  StarFilled
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  helpful_votes: number;
  is_verified: boolean;
  created_at: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

interface RatingDistribution {
  rating: number;
  count: number;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, totalReviews: 0 });
  const [distribution, setDistribution] = useState<RatingDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  
  // New states for auth and purchase check
  const [user, setUser] = useState<any>(null);
  const [canReview, setCanReview] = useState(false);
  const [reviewCheckMessage, setReviewCheckMessage] = useState('');
  const [reviewCheckReason, setReviewCheckReason] = useState('');

  useEffect(() => {
    fetchReviews();
    checkAuth();
  }, [productId]);

  useEffect(() => {
    if (user) {
      checkReviewEligibility();
    }
  }, [user, productId]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
    }
  };

  const checkReviewEligibility = async () => {
    try {
      const response = await fetch(`/api/reviews/check?product_id=${productId}`);
      const data = await response.json();
      setCanReview(data.canReview);
      setReviewCheckMessage(data.message);
      setReviewCheckReason(data.reason);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      setCanReview(false);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews?product_id=${productId}`);
      const data = await response.json();
      
      if (response.ok) {
        setReviews(data.reviews || []);
        setStats(data.stats || { averageRating: 0, totalReviews: 0 });
        setDistribution(data.distribution || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (values: any) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          rating: values.rating,
          comment: values.comment,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi khi gửi đánh giá');
      }

      message.success('Cảm ơn bạn đã đánh giá sản phẩm!');
      setReviewModalVisible(false);
      form.resetFields();
      fetchReviews(); // Refresh reviews
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewModal = () => {
    setReviewModalVisible(true);
  };

  const formatRating = (rating: number) => {
    return rating ? rating.toFixed(1) : '0.0';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#52c41a';
    if (rating >= 3.5) return '#faad14';
    if (rating >= 2.5) return '#fa8c16';
    return '#f5222d';
  };

  return (
    <div style={{ marginTop: 24 }}>
      <Title level={4}>Đánh giá sản phẩm</Title>
      
      {/* Rating Summary */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={24} align="middle">
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: getRatingColor(stats.averageRating) }}>
                {formatRating(stats.averageRating)}
              </div>
              <Rate 
                disabled 
                value={stats.averageRating} 
                allowHalf 
                style={{ fontSize: '20px' }}
              />
              <div style={{ marginTop: 8, color: '#666' }}>
                {stats.totalReviews} đánh giá
              </div>
            </div>
          </Col>
          
          <Col span={12}>
            <div>
              {distribution.map(item => {
                const percentage = stats.totalReviews > 0 ? (item.count / stats.totalReviews) * 100 : 0;
                return (
                  <Row key={item.rating} align="middle" style={{ marginBottom: 8 }}>
                    <Col span={3}>
                      <Space>
                        <Text>{item.rating}</Text>
                        <StarFilled style={{ color: '#fadb14', fontSize: '12px' }} />
                      </Space>
                    </Col>
                    <Col span={16}>
                      <Progress 
                        percent={percentage} 
                        showInfo={false} 
                        strokeColor="#fadb14"
                        size="small"
                      />
                    </Col>
                    <Col span={5} style={{ textAlign: 'right' }}>
                      <Text style={{ fontSize: '12px', color: '#666' }}>
                        {item.count}
                      </Text>
                    </Col>
                  </Row>
                );
              })}
            </div>
          </Col>
          
          <Col span={4} style={{ textAlign: 'right' }}>
            {!user ? (
              <Button 
                type="default" 
                icon={<EditOutlined />}
                onClick={() => {
                  message.info('Vui lòng đăng nhập để đánh giá sản phẩm');
                  window.location.href = '/login';
                }}
              >
                Viết đánh giá
              </Button>
            ) : canReview ? (
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={openReviewModal}
              >
                Viết đánh giá
              </Button>
            ) : (
              <Button 
                type="default" 
                icon={<EditOutlined />}
                onClick={() => {
                  if (reviewCheckReason === 'ALREADY_REVIEWED') {
                    message.info(reviewCheckMessage);
                  } else if (reviewCheckReason === 'NOT_PURCHASED') {
                    Modal.info({
                      title: 'Chưa thể đánh giá',
                      content: (
                        <div>
                          <p>{reviewCheckMessage}</p>
                          <p style={{ marginTop: 12, color: '#1890ff' }}>
                            Hãy thêm vào giỏ hàng và trải nghiệm sản phẩm này nhé!
                          </p>
                        </div>
                      ),
                    });
                  } else {
                    message.warning(reviewCheckMessage);
                  }
                }}
              >
                Viết đánh giá
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* Reviews List */}
      <Card title={`Tất cả đánh giá (${stats.totalReviews})`} loading={loading}>
        {reviews.length > 0 ? (
          <div>
            {reviews.map((review, index) => (
              <div key={review.id}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Avatar 
                    icon={<UserOutlined />} 
                    style={{ backgroundColor: '#1890ff' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text strong>{review.customer_name}</Text>
                      {review.is_verified && (
                        <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: '11px' }}>
                          Đã mua hàng
                        </Tag>
                      )}
                      <Text style={{ fontSize: '12px', color: '#666' }}>
                        {dayjs(review.created_at).fromNow()}
                      </Text>
                    </div>
                    
                    <div style={{ marginBottom: 8 }}>
                      <Rate 
                        disabled 
                        value={review.rating} 
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                    
                    {review.comment && (
                      <Paragraph 
                        style={{ marginBottom: 8, color: '#262626' }}
                        ellipsis={{ rows: 3, expandable: true }}
                      >
                        {review.comment}
                      </Paragraph>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<LikeOutlined />}
                        style={{ padding: '0 4px' }}
                      >
                        Hữu ích ({review.helpful_votes})
                      </Button>
                    </div>
                  </div>
                </div>
                
                {index < reviews.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        ) : (
          <Empty 
            description="Chưa có đánh giá nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        title="Viết đánh giá"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          onFinish={handleSubmitReview}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: '13px' }}>
            ✅ Bạn đang đánh giá với tài khoản: <strong>{user?.email}</strong>
          </Text>
          
          <Form.Item
            label="Đánh giá"
            name="rating"
            rules={[{ required: true, message: 'Vui lòng chọn đánh giá' }]}
          >
            <Rate allowClear style={{ fontSize: '24px' }} />
          </Form.Item>
          
          <Form.Item
            label="Nhận xét (không bắt buộc)"
            name="comment"
          >
            <TextArea
              rows={4}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              maxLength={500}
              showCount
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setReviewModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Gửi đánh giá
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}