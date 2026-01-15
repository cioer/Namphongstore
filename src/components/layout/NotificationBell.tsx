'use client';

import { useState, useEffect } from 'react';
import { Badge, Button, Popover, List, Typography, Empty, Avatar } from 'antd';
import { BellOutlined, InfoCircleOutlined, ShopOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text } = Typography;

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'WARRANTY': return <SafetyCertificateOutlined style={{ color: 'red' }} />;
      case 'ORDER': return <ShopOutlined style={{ color: 'blue' }} />;
      default: return <InfoCircleOutlined />;
    }
  };

  const content = (
    <div style={{ width: 350, maxHeight: 400, overflow: 'auto' }}>
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        locale={{ emptyText: <Empty description="Không có thông báo nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        renderItem={(item) => (
          <List.Item 
            style={{ 
              backgroundColor: item.is_read ? '#fff' : '#e6f7ff',
              padding: '12px',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
            onClick={() => {
              if (!item.is_read) markAsRead(item.id);
            }}
          >
            <List.Item.Meta
              avatar={<Avatar icon={getIcon(item.type)} style={{ backgroundColor: item.is_read ? '#ccc' : '#fff' }} />}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong={!item.is_read} style={{ fontSize: 13 }}>{item.title}</Text>
                  {!item.is_read && <Badge status="processing" />}
                </div>
              }
              description={
                <div>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>{item.message}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{dayjs(item.created_at).fromNow()}</div>
                  {item.link && (
                    <Link href={item.link} style={{ fontSize: 12 }}>Xem chi tiết</Link>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Popover 
      content={content} 
      title={`Thông báo (${unreadCount})`} 
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
    >
      <Badge count={unreadCount} overflowCount={99}>
        <Button 
          type="text" 
          icon={<BellOutlined style={{ fontSize: 20 }} />} 
          shape="circle" 
          onClick={() => setOpen(!open)}
        />
      </Badge>
    </Popover>
  );
}
