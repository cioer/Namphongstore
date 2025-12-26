'use client';

import { Button, message } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { getFirstImage } from '@/lib/utils';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price_sale: number | string;
    images?: any;
  };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const handleAddToCart = () => {
    message.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.productId === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price_sale,
        quantity: 1,
        image: getFirstImage(product.images),
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <Button 
      type="default" 
      size="large" 
      icon={<ShoppingCartOutlined />}
      onClick={handleAddToCart}
      style={{ flex: 1 }}
    >
      Thêm vào giỏ
    </Button>
  );
}
