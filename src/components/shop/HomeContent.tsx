'use client';

import { Row, Col, Card, Button, Typography, Tag, Modal } from 'antd';
import { ThunderboltOutlined, FireOutlined, CloseOutlined, GiftOutlined, CopyOutlined } from '@ant-design/icons';
import Link from 'next/link';
import ProductCard from '@/components/shop/product/ProductCard';
import { useState, useEffect } from 'react';

const { Text, Title } = Typography;

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  specs: any;
  gifts: any;
  images: any;
  price_original: string;
  price_sale: string;
  discount_percent: number;
  promo_start: string | null;
  promo_end: string | null;
  warranty_months: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HomeContentProps {
  categories: Category[];
  dealsProducts: Product[];
  bestSellers: Product[];
}

const handleCopyCode = (code: string) => {
  navigator.clipboard.writeText(code);
  Modal.success({
      title: 'Đã sao chép mã giảm giá!',
      content: `Mã ${code} đã được lưu vào bộ nhớ tạm.`,
      maskClosable: true,
      okButtonProps: { style: { background: '#D70018', borderColor: '#D70018' } }
  });
};

const SidebarCard = ({ children, onClose }: { children: React.ReactNode, onClose?: () => void }) => (
  <div style={{ position: 'relative', marginBottom: 15 }}>
      {onClose && (
          <Button 
              type="text" 
              icon={<CloseOutlined />} 
              size="small" 
              onClick={onClose}
              style={{ position: 'absolute', right: 0, top: 0, zIndex: 10, color: '#999' }}
          />
      )}
      {children}
  </div>
);

const LeftSidebar = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  if (!visible) return null;
  return (
      <div style={{ position: 'sticky', top: '90px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', paddingRight: '5px' }} className="custom-scrollbar">
           {/* Store Branding */}
           <SidebarCard onClose={onClose}>
              <div style={{ 
                  borderRadius: '12px', overflow: 'hidden', border: '2px solid #D70018', background: '#fff',
                  boxShadow: '0 4px 12px rgba(215, 0, 24, 0.15)'
              }}>
                   <div style={{ position: 'relative' }}>
                        <img 
                            src="https://img.freepik.com/premium-vector/vietnamese-new-year-tet-banner-illustration_23-2149206307.jpg" 
                            alt="Store" 
                            style={{ width: '100%', height: '140px', objectFit: 'cover' }} 
                            onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/250x140?text=NAM+PHONG'}    
                        />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', padding: '20px 10px 5px' }}>
                             <Title level={5} style={{ color: '#FFD700', margin: 0, textShadow: '1px 1px 2px #000' }}>NAM PHONG STORE</Title>
                        </div>
                   </div>
                   <div style={{ padding: '8px', textAlign: 'center', background: '#fff5f5' }}>
                      <Text style={{ fontSize: '11px', color: '#D70018', fontWeight: 'bold' }}>🧧 TẾT SUM VẦY - LỘC ĐẦY TAY 🧧</Text>
                   </div>
              </div>
          </SidebarCard>

          {/* Ad 1 */}
          <SidebarCard>
              <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 5, left: 5, zIndex: 1, animation: 'pulse 2s infinite' }}>🔥</div>
                <img 
                    src="https://img.freepik.com/free-vector/flat-tet-sale-vertical-poster-template_23-2149206304.jpg" 
                    alt="Ad 1" 
                    style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} 
                />
              </div>
          </SidebarCard>

          {/* Policy Banner */}
          <SidebarCard>
             <div style={{ background: '#FFFDF5', border: '1px dashed #D4AF37', borderRadius: '8px', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ background: '#D70018', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', color: '#fff' }}>🛡️</div>
                    <Text style={{ fontSize: '12px', fontWeight: 'bold' }}>Bảo hành chính hãng</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ background: '#D70018', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', color: '#fff' }}>🚚</div>
                    <Text style={{ fontSize: '12px', fontWeight: 'bold' }}>Miễn phí vận chuyển</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ background: '#D70018', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', color: '#fff' }}>🔄</div>
                    <Text style={{ fontSize: '12px', fontWeight: 'bold' }}>Đổi trả trong 30 ngày</Text>
                </div>
             </div>
          </SidebarCard>
          
           {/* Ad 2 */}
            <SidebarCard>
              <img 
                  src="https://img.freepik.com/free-vector/flat-tet-horizontal-banner-template_23-2149237691.jpg" 
                  alt="Ad 2" 
                  style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} 
              />
          </SidebarCard>
      </div>
  ); 
};

const RightSidebar = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(23, 59, 59, 999);
      
      const diff = target.getTime() - now.getTime();
      
      if (diff > 0) {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!visible) return null;
  return (
      <div style={{ position: 'sticky', top: '90px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', paddingLeft: '5px' }} className="custom-scrollbar">
          <div style={{ position: 'absolute', top: -15, right: -5, fontSize: '24px', zIndex: 20, animation: 'swing 3s infinite ease-in-out' }}>🏮</div>
          <SidebarCard onClose={onClose}>
              {/* Promo 1 */}
              <Card 
                  size="small"
                  title={<span style={{ color: '#D70018', fontSize: '13px', fontWeight: 'bold' }}>🧧 LÌ XÌ 500K</span>}
                  style={{ border: '2px solid #D70018', background: '#FFFDF5', boxShadow: '0 4px 8px rgba(215,0,24,0.1)' }}
                  headStyle={{ background: '#ffe6e6', minHeight: '36px', padding: '0 12px' }}
                  bodyStyle={{ padding: '12px', textAlign: 'center' }}
              >
                  <Tag color="#D70018" style={{ marginBottom: 8, fontSize: '14px', padding: '4px 10px' }}>TET2026</Tag>
                  <Button type="primary" danger size="small" block icon={<CopyOutlined />} onClick={() => handleCopyCode('TET2026')}>Lấy Mã Ngay</Button>
              </Card>
          </SidebarCard>

          {/* Flash Sale Timer */}
          <SidebarCard>
              <div style={{ 
                  background: 'linear-gradient(180deg, #D70018 0%, #990000 100%)', 
                  borderRadius: '12px', padding: '15px', textAlign: 'center', color: '#fff', border: '2px solid #FFD700',
                  boxShadow: '0 0 10px rgba(215, 0, 24, 0.4)'
              }}>
                  <div style={{ marginBottom: '5px' }}>
                      <FireOutlined style={{ fontSize: '20px', color: '#FFD700', marginRight: '5px' }} />
                      <span style={{ fontSize: '14px', color: '#FFD700', fontWeight: 'bold', textTransform: 'uppercase' }}>GIỜ VÀNG GIÁ SỐC</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', padding: '5px', margin: '10px 0' }}>
                    {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <Text style={{ color: '#fff', fontSize: '12px', fontStyle: 'italic' }}>Săn deal giảm tới 50%</Text>
              </div>
          </SidebarCard>

          {/* Promo 2 */}
          <SidebarCard>
              <Card 
                  size="small"
                  style={{ border: '1px solid #D4AF37', background: '#fff' }}
                  bodyStyle={{ padding: '10px', textAlign: 'center' }}
              >
                  <Text strong style={{ color: '#D4AF37', fontSize: '13px', display: 'block', marginBottom: '5px' }}><GiftOutlined /> Giảm 5% Đơn 0đ</Text>
                  <div style={{ margin: '4px 0' }}><Tag color="gold" style={{ fontSize: '13px' }}>NAMPHONG5</Tag></div>
                  <Button size="small" block icon={<CopyOutlined />} onClick={() => handleCopyCode('NAMPHONG5')}>Sao chép</Button>
              </Card>
          </SidebarCard>

          {/* Promo 3 */}
          <SidebarCard>
              <Card 
                  size="small"
                  style={{ border: '1px solid #D4AF37', background: '#fff' }}
                  bodyStyle={{ padding: '10px', textAlign: 'center' }}
              >
                  <Text strong style={{ color: '#D4AF37', fontSize: '13px', display: 'block', marginBottom: '5px' }}><GiftOutlined /> Freeship 30K</Text>
                  <div style={{ margin: '4px 0' }}><Tag color="gold" style={{ fontSize: '13px' }}>FREESHIP30</Tag></div>
                  <Button size="small" block icon={<CopyOutlined />} onClick={() => handleCopyCode('FREESHIP30')}>Sao chép</Button>
              </Card>
          </SidebarCard>

          <SidebarCard>
              <img 
                  src="https://img.freepik.com/premium-vector/traditional-vietnamese-new-year-banner_23-2149223362.jpg" 
                  alt="Ad Right" 
                  style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} 
              />
          </SidebarCard>
          
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
             <img src="https://media1.giphy.com/media/26tOZ42Mg6pbTUPvy/giphy.gif" alt="Decoration" style={{ width: '80%', opacity: 0.8 }} />
          </div>
      </div>
  );
};

export default function HomeContent({ categories, dealsProducts, bestSellers }: HomeContentProps) {
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);

  const sectionStyle = {
    background: 'rgba(255, 253, 245, 0.95)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 4px 12px rgba(215, 0, 24, 0.15)',
    border: '1px solid #D4AF37'
  };







  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Hero Section - Full Width */}
      <div style={{
        background: 'linear-gradient(135deg, #D70018 0%, #990000 100%)',
        padding: '60px 20px',
        textAlign: 'center',
        color: '#fff',
        borderBottom: '4px solid #D4AF37',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        {/* Decorative Circles */}
        <div style={{ position: 'absolute', top: -50, left: -50, width: 200, height: 200, border: '2px solid rgba(212, 175, 55, 0.3)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: -50, right: -50, width: 300, height: 300, border: '2px solid rgba(212, 175, 55, 0.3)', borderRadius: '50%' }}></div>
        
        <h1 style={{ 
          color: '#D4AF37', 
          fontSize: '48px', 
          marginBottom: '10px', 
          fontFamily: "'Playfair Display', serif", 
          fontWeight: 'bold', 
          textShadow: '2px 4px 6px rgba(0,0,0,0.4)',
          letterSpacing: '2px'
        }}>
          🧧 CUNG CHÚC TÂN XUÂN
        </h1>
        <p style={{ 
          fontSize: '20px', 
          color: '#FFFDF5', 
          margin: 0,
          fontFamily: "'Playfair Display', serif", 
          fontStyle: 'italic',
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
        }}>
          An Khang Thịnh Vượng - Vạn Sự Như Ý
        </p>
      </div>

      {/* Main Grid Layout */}
      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 20px' }}>
        <Row gutter={24}>
            {/* Left Sidebar (Hidden on small screens) */}
            <Col xs={0} lg={3} xl={3}>
                <LeftSidebar visible={showLeft} onClose={() => setShowLeft(false)} />
            </Col>

            {/* Center Content */}
            <Col xs={24} lg={18} xl={18}>
                {/* Categories */}
                <div style={sectionStyle}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#D70018', fontSize: '28px', margin: 0 }}>
                        🌸 Danh Mục Sắm Tết
                    </h2>
                    <div style={{ width: '80px', height: '3px', background: '#D4AF37', margin: '10px auto' }}></div>
                    </div>
                    
                    <Row gutter={[12, 12]}>
                    {categories.map((cat) => (
                        <Col xs={12} sm={8} md={6} lg={6} key={cat.id}>
                        <Link href={`/c/${cat.slug}`}>
                            <Card
                            hoverable
                            className="tet-card-hover"
                            cover={
                                <div style={{ 
                                height: '100px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                background: '#fff',
                                borderBottom: '1px solid #D4AF37',
                                borderRadius: '16px 16px 0 0'
                                }}>
                                <img
                                    alt={cat.name}
                                    src={cat.image_url || ''}
                                    style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }}
                                />
                                </div>
                            }
                            styles={{ body: { textAlign: 'center', padding: '8px' } }}
                            style={{ borderColor: '#D4AF37', borderRadius: '16px', overflow: 'hidden' }}
                            >
                            <div style={{ fontWeight: 'bold', color: '#990000', fontSize: '13px' }}>{cat.name}</div>
                            </Card>
                        </Link>
                        </Col>
                    ))}
                    </Row>
                </div>

      {/* Deals Section */}
      {dealsProducts.length > 0 && (
        <div style={{
            ...sectionStyle,
            marginBottom: '60px', // Increased spacing
            background: 'linear-gradient(135deg, #fffcfc 0%, #fff0f0 100%)',
            border: '2px solid #D70018',
            boxShadow: '0 0 15px rgba(215, 0, 24, 0.2), inset 0 0 20px rgba(215, 0, 24, 0.05)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
        }}>
           {/* Decorative Background Elements */}
           <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: 'radial-gradient(#D70018 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
           
           {/* Top Left Decoration - Lanterns */}
           <div style={{ position: 'absolute', top: '-10px', left: '20px', fontSize: '60px', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.2))', animation: 'swing 3s infinite ease-in-out', transformOrigin: 'top center', zIndex: 1 }}>🏮</div>
           <div style={{ position: 'absolute', top: '-25px', left: '80px', fontSize: '45px', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.2))', animation: 'swing 4s infinite ease-in-out', transformOrigin: 'top center', animationDelay: '0.5s', zIndex: 1 }}>🏮</div>

           {/* Top Right Decoration - Blossom Branch & Fireworks */}
           <div style={{ 
              position: 'absolute', 
              top: '-30px', 
              right: '-30px', 
              width: '180px', 
              height: '180px', 
              background: 'url("https://png.pngtree.com/png-vector/20220917/ourmid/pngtree-fireworks-png-image_6182189.png")',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              opacity: 0.8,
              transform: 'rotate(15deg)'
           }}></div>
           <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '50px', zIndex: 1 }}>🌸</div>
           <div style={{ position: 'absolute', top: '40px', right: '50px', fontSize: '30px', zIndex: 1, opacity: 0.8 }}>🌸</div>

           {/* Bottom Decorations - Coins & Envelopes */}
           <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '40px', transform: 'rotate(-15deg)', zIndex: 1 }}>💰</div>
           <div style={{ position: 'absolute', bottom: '20px', left: '60px', fontSize: '30px', transform: 'rotate(15deg)', zIndex: 1 }}>🧧</div>
           <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '40px', transform: 'rotate(15deg)', zIndex: 1 }}>🧧</div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '30px', 
            position: 'relative',
            zIndex: 2
          }}>
            <div style={{
              background: '#D70018',
              color: '#FFD700',
              padding: '5px 20px',
              borderRadius: '20px',
              fontWeight: 'bold',
              marginBottom: '10px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <GiftOutlined /> KHUYẾN MÃI ĐẶC BIỆT TẾT 2026
            </div>
            
            <h2 style={{ 
              fontFamily: "'Playfair Display', serif", 
              background: 'linear-gradient(to right, #D70018, #ff4d4f, #D70018)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '48px', 
              fontWeight: '900',
              margin: 0, 
              textTransform: 'uppercase', 
              filter: 'drop-shadow(2px 2px 0px rgba(255, 215, 0, 0.5))',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              letterSpacing: '2px'
            }}>
              <span style={{ fontSize: '36px', filter: 'none' }}>🎇</span>
              Lộc Xuân Giá Sốc
              <span style={{ fontSize: '36px', filter: 'none' }}>🎇</span>
            </h2>
            <div style={{ height: '3px', width: '150px', background: 'linear-gradient(90deg, transparent, #FFD700, transparent)', marginTop: '8px', borderRadius: '2px' }}></div>
          </div>
          
          <Row gutter={[16, 16]} style={{ position: 'relative', zIndex: 2 }}>
            {dealsProducts.map((product) => (
              <Col xs={24} sm={12} md={6} key={product.id}>
                <div className="product-hover-effect">
                    <div style={{ position: 'absolute', top: '-5px', left: '-5px', zIndex: 10, fontSize: '28px', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))', transform: 'rotate(-15deg)' }}>🧧</div>
                    <ProductCard product={product} />
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <div style={{
            ...sectionStyle,
            background: 'linear-gradient(to bottom, #FFFFF0, #fff)',
            border: '2px solid #D4AF37',
            boxShadow: '0 8px 24px rgba(212, 175, 55, 0.25)',
            position: 'relative',
            overflow: 'hidden'
        }}>
          {/* Gold Decorative Corner */}
           <div style={{
               position: 'absolute',
               top: -50,
               right: -50,
               width: 100,
               height: 100,
               background: 'linear-gradient(135deg, transparent 50%, #D4AF37 50%)',
               opacity: 0.1
           }} />
           <div style={{
               position: 'absolute',
               bottom: -50,
               left: -50,
               width: 100,
               height: 100,
               background: 'linear-gradient(135deg, #D4AF37 50%, transparent 50%)',
               opacity: 0.1
           }} />

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '30px', 
            position: 'relative',
            zIndex: 2
          }}>
            <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center', 
                 borderBottom: '2px solid #D4AF37', 
                 paddingBottom: '15px',
                 width: '100%',
                 maxWidth: '600px'
            }}>
                <h2 style={{ 
                    fontFamily: "'Playfair Display', serif", 
                    color: '#D4AF37', 
                    fontSize: '36px', 
                    fontWeight: 800,
                    margin: 0, 
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                }}>
                <span style={{ fontSize: '40px' }}>👑</span>
                Sản Phẩm Bán Chạy
                <span style={{ fontSize: '40px' }}>👑</span>
                </h2>
            </div>
            <div style={{ fontSize: '14px', color: '#888', marginTop: '8px', fontStyle: 'italic' }}>Những lựa chọn hàng đầu được khách hàng tin dùng</div>
          </div>

          <Row gutter={[16, 16]} style={{ position: 'relative', zIndex: 2 }}>
            {bestSellers.map((product, index) => (
              <Col xs={24} sm={12} md={6} key={product.id}>
                <div className="product-hover-effect">
                    {index < 3 && (
                        <div style={{ 
                            position: 'absolute', 
                            top: -10, 
                            left: 10, 
                            zIndex: 10,
                            background: '#D4AF37',
                            color: '#fff',
                            padding: '4px 12px',
                            borderRadius: '0 0 8px 8px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            fontSize: '12px'
                        }}>
                            TOP {index + 1}
                        </div>
                    )}
                    <ProductCard product={product} />
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}

      <style jsx global>{`
        @keyframes swing {
            0% { transform: rotate(5deg); }
            50% { transform: rotate(-5deg); }
            100% { transform: rotate(5deg); }
        }
        .product-hover-effect {
            transition: all 0.3s ease;
            height: 100%;
        }
        .product-hover-effect:hover {
            transform: translateY(-8px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            z-index: 5;
        }
      `}</style>

            {/* Center Content End */}
            </Col>

             {/* Right Sidebar (Hidden on small screens) */}
             <Col xs={0} lg={3} xl={3}>
                <RightSidebar visible={showRight} onClose={() => setShowRight(false)} />
            </Col>
        </Row>
      </div>
    </div>
  );
}
