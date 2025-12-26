'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Space,
  DatePicker,
  Switch,
  message,
  Divider,
  Image,
  Upload,
} from 'antd';
import { Typography } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SaveOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const { TextArea } = Input;

interface ProductFormProps {
  initialData?: any;
  mode: 'create' | 'edit';
  productId?: string;
}

export default function ProductForm({ initialData, mode, productId }: ProductFormProps) {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    if (initialData) {
      // Convert dates for form
      const formData = {
        ...initialData,
        price_original: Number(initialData.price_original),
        price_sale: Number(initialData.price_sale),
        promo_start: initialData.promo_start ? dayjs.utc(initialData.promo_start) : null,
        promo_end: initialData.promo_end ? dayjs.utc(initialData.promo_end) : null,
        specs: initialData.specs ? Object.entries(initialData.specs).map(([key, value]) => ({ key, value })) : [],
        gifts: initialData.gifts || [],
        images: initialData.images || [],
      };
      form.setFieldsValue(formData);
      
      // Set uploaded images from initial data
      if (initialData.images && Array.isArray(initialData.images)) {
        setUploadedImages(initialData.images);
        const initialFileList = initialData.images.map((url: string, index: number) => ({
          uid: `-${index}`,
          name: url.split('/').pop() || `image-${index}`,
          status: 'done' as const,
          url: url,
        }));
        setFileList(initialFileList);
      }
    }
  }, [initialData]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      message.error('Không thể tải danh mục');
    }
  };

  const handleUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      const formData = new FormData();
      formData.append('images', file as File);
      formData.append('type', 'products');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload thất bại');
      }

      // Add uploaded paths to state
      setUploadedImages(prev => [...prev, ...data.paths]);
      onSuccess?.(data);
      message.success('Upload ảnh thành công!');
    } catch (error: any) {
      onError?.(error);
      message.error(error.message || 'Có lỗi khi upload ảnh');
    }
  };

  const handleRemove = (file: UploadFile) => {
    const url = file.url || (file.response?.paths?.[0]);
    if (url) {
      setUploadedImages(prev => prev.filter(img => img !== url));
    }
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Convert specs array to object
      const specs = values.specs?.reduce((acc: any, item: any) => {
        if (item.key && item.value) {
          acc[item.key] = item.value;
        }
        return acc;
      }, {});

      // Convert dates to UTC ISO strings
      const payload = {
        ...values,
        specs: specs || null,
        gifts: values.gifts?.filter((g: string) => g.trim()) || null,
        images: uploadedImages.length > 0 ? uploadedImages : null,
        promo_start: values.promo_start ? values.promo_start.utc().toISOString() : null,
        promo_end: values.promo_end ? values.promo_end.utc().toISOString() : null,
      };

      const url = mode === 'create' 
        ? '/api/admin/products'
        : `/api/admin/products/${productId}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Lưu sản phẩm thất bại');
      }

      message.success(`${mode === 'create' ? 'Tạo' : 'Cập nhật'} sản phẩm thành công!`);
      router.push('/admin/products');
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        is_active: true,
        warranty_months: 12,
        stock_quantity: 0,
        discount_percent: 0,
        specs: [],
        gifts: [],
        images: [],
      }}
    >
      <Card title="Thông tin cơ bản" style={{ marginBottom: 16 }}>
        <Form.Item
          label="Danh mục"
          name="category_id"
          rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
        >
          <Select
            placeholder="Chọn danh mục..."
            showSearch
            optionFilterProp="children"
          >
            {categories.map(cat => (
              <Select.Option key={cat.id} value={cat.id}>
                {cat.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Tên sản phẩm"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
        >
          <Input placeholder="Ví dụ: Tủ lạnh Samsung Inverter 236L" />
        </Form.Item>

        <Form.Item
          label="Slug (URL)"
          name="slug"
          rules={[
            { required: true, message: 'Vui lòng nhập slug' },
            { pattern: /^[a-z0-9-]+$/, message: 'Chỉ chấp nhận chữ thường, số và dấu gạch ngang' },
          ]}
        >
          <Input placeholder="tu-lanh-samsung-inverter-236l" />
        </Form.Item>

        <Form.Item label="Thương hiệu" name="brand">
          <Input placeholder="Samsung, LG, Panasonic..." />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <TextArea rows={4} placeholder="Mô tả chi tiết sản phẩm..." />
        </Form.Item>

        <Form.Item
          label="Kích hoạt"
          name="is_active"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Card>

      <Card title="Giá & Khuyến mãi" style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%' }} direction="vertical">
          <Form.Item
            label="Giá gốc (VNĐ)"
            name="price_original"
            rules={[{ required: true, message: 'Vui lòng nhập giá gốc' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value: any) => value!.replace(/,/g, '')}
            />
          </Form.Item>

          <Form.Item
            label="Giá bán (VNĐ)"
            name="price_sale"
            rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value: any) => value!.replace(/,/g, '')}
            />
          </Form.Item>

          <Form.Item
            label="Giảm giá (%)"
            name="discount_percent"
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Space.Compact style={{ width: '100%' }}>
            <Form.Item
              label="Khuyến mãi từ (UTC)"
              name="promo_start"
              style={{ width: '50%', marginRight: 8 }}
            >
              <DatePicker
                showTime
                style={{ width: '100%' }}
                placeholder="Chọn ngày bắt đầu"
              />
            </Form.Item>

            <Form.Item
              label="Đến (UTC)"
              name="promo_end"
              style={{ width: '50%' }}
            >
              <DatePicker
                showTime
                style={{ width: '100%' }}
                placeholder="Chọn ngày kết thúc"
              />
            </Form.Item>
          </Space.Compact>
        </Space>
      </Card>

      <Card title="Thông số kỹ thuật" style={{ marginBottom: 16 }}>
        <Form.List name="specs">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'key']}
                    style={{ width: 200 }}
                  >
                    <Input placeholder="Tên thuộc tính" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'value']}
                    style={{ width: 300 }}
                  >
                    <Input placeholder="Giá trị" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Thêm thông số
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      <Card title="Quà tặng kèm" style={{ marginBottom: 16 }}>
        <Form.List name="gifts">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={name}
                    style={{ width: 500 }}
                  >
                    <Input placeholder="Ví dụ: Tặng nồi nấu phở" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Thêm quà tặng
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      <Card title="Hình ảnh sản phẩm" style={{ marginBottom: 16 }}>
        <Upload
          listType="picture-card"
          fileList={fileList}
          customRequest={handleUpload}
          onChange={handleChange}
          onRemove={handleRemove}
          accept="image/*"
          multiple
        >
          {fileList.length >= 10 ? null : (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          )}
        </Upload>
        <p style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
          Tối đa 10 ảnh, mỗi ảnh tối đa 5MB. Hỗ trợ: JPG, PNG, WEBP
        </p>
      </Card>

      <Card title="Kho & Bảo hành" style={{ marginBottom: 16 }}>
        <Form.Item
          label="Số lượng tồn kho"
          name="stock_quantity"
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Thời hạn bảo hành (tháng)"
          name="warranty_months"
          rules={[{ required: true, message: 'Vui lòng nhập thời hạn bảo hành' }]}
        >
          <InputNumber min={0} max={120} style={{ width: '100%' }} />
        </Form.Item>
      </Card>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
            size="large"
          >
            {mode === 'create' ? 'Tạo sản phẩm' : 'Cập nhật sản phẩm'}
          </Button>
          <Button size="large" onClick={() => router.back()}>
            Hủy
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
