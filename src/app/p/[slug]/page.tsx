import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/services/product.service';
import ProductDetailClient from './ProductDetailClient';

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return {
      title: 'Sản phẩm không tồn tại',
    };
  }

  return {
    title: `${product.name} | Nam Phong Store`,
    description: product.description?.substring(0, 160) || `Mua ${product.name} giá tốt tại Nam Phong Store`,
    openGraph: {
      title: product.name,
      description: product.description?.substring(0, 160),
      images: Array.isArray(product.images) && product.images.length > 0 ? [(product.images as string[])[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  // Serialize data to ensure it's safe for client component
  const serializedProduct = JSON.parse(JSON.stringify(product));

  return <ProductDetailClient product={serializedProduct} />;
}
