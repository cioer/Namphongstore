'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Card, Typography, message, Space, Tag, Popconfirm, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'ADMIN' | 'SALES' | 'TECH';
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        message.error('Không thể tải danh sách nhân viên');
      }
    } catch (error) {
      message.error('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingUser(record);
    form.setFieldsValue({
      ...record,
      password: '', // Don't fill password
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        message.success('Xóa nhân viên thành công');
        fetchUsers();
      } else {
        const data = await res.json();
        message.error(data.error || 'Không thể xóa nhân viên');
      }
    } catch (error) {
      message.error('Lỗi kết nối');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      let res;
      if (editingUser) {
        // Update
        const payload = { ...values };
        if (!payload.password) delete payload.password; // Only send if changed

        res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
      }

      if (res.ok) {
        message.success(`${editingUser ? 'Cập nhật' : 'Tạo'} nhân viên thành công`);
        setIsModalVisible(false);
        fetchUsers();
      } else {
        const data = await res.json();
        message.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Họ tên',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        let color = 'default';
        let text = role;
        switch (role) {
          case 'ADMIN': color = 'red'; text = 'Quản trị viên'; break;
          case 'SALES': color = 'green'; text = 'Bán hàng'; break;
          case 'TECH': color = 'blue'; text = 'Kỹ thuật'; break;
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
            disabled={record.role === 'ADMIN'} // Prevent deleting admins easily or self
          >
            <Button icon={<DeleteOutlined />} danger disabled={record.role === 'ADMIN'} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={4}>Quản lý Nhân viên</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm nhân viên
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingUser ? 'Cập nhật thông tin' : 'Thêm nhân viên mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="full_name"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input placeholder="email@example.com" disabled={!!editingUser} />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingUser ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
            rules={[{ required: !editingUser, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password placeholder="******" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]}
          >
            <Input placeholder="0901234567" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò"
            initialValue="SALES"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select>
              <Option value="ADMIN">Quản trị viên (Admin)</Option>
              <Option value="SALES">Nhân viên Bán hàng (Sales)</Option>
              <Option value="TECH">Kỹ thuật viên (Tech)</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
