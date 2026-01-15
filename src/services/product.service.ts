import { prisma } from '@/lib/prisma';
import { Product } from '@/types';

interface GetProductsParams {
  categorySlug?: string | null;
  brand?: string | null;
  sort?: string | null;
  page?: number;
  limit?: number;
  search?: string | null;
}

export const getProducts = async (params: GetProductsParams) => {
  const {
    categorySlug,
    brand,
    sort = 'newest',
    page = 1,
    limit = 12,
    search
  } = params;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = { is_active: true };
  
  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (brand) {
    where.brand = brand;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Build orderBy clause
  let orderBy: any = { created_at: 'desc' };
  switch (sort) {
    case 'price-asc':
      orderBy = { price_sale: 'asc' };
      break;
    case 'price-desc':
      orderBy = { price_sale: 'desc' };
      break;
    case 'name':
      orderBy = { name: 'asc' };
      break;
  }

  // Fetch products and total count
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAllProducts = async () => {
  return await prisma.product.findMany({
    include: {
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });
};

export const createProduct = async (data: any) => {
  return await prisma.product.create({
    data,
  });
};

export const createProductWithAudit = async (data: any, userId: string) => {
  return await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data: {
        ...data,
        price_original: Number(data.price_original),
        price_sale: Number(data.price_sale),
        discount_percent: Number(data.discount_percent) || 0,
        warranty_months: Number(data.warranty_months) || 12,
        warranty_exchange_months: Number(data.warranty_exchange_months) || 1,
        stock_quantity: Number(data.stock_quantity) || 0,
        sku: data.sku || null,
        promo_start: data.promo_start ? new Date(data.promo_start) : null,
        promo_end: data.promo_end ? new Date(data.promo_end) : null,
      },
    });

    // Create audit log (CREATE action)
    await tx.auditLog.create({
      data: {
        product_id: newProduct.id,
        user_id: userId,
        action: 'CREATE',
        after_json: {
          ...newProduct,
          price_original: Number(newProduct.price_original),
          price_sale: Number(newProduct.price_sale),
        },
      },
    });

    return newProduct;
  });
};

export const deleteProduct = async (id: string) => {
  return await prisma.product.delete({
    where: { id },
  });
};

export const getProductById = async (id: string) => {
  return await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });
};

export const getProductBySlug = async (slug: string) => {
  return await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
    },
  });
};

export const updateProduct = async (id: string, data: any) => {
  return await prisma.product.update({
    where: { id },
    data,
  });
};

export const getBestSellingProducts = async (limit: number = 8) => {
  const now = new Date();
  // Month is 0-indexed.
  // If now is Jan (0), last month is Dec (-1). Date constructor handles this correctly.
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // Group by product_id and count quantity
  const bestSellingItems = await prisma.orderItem.groupBy({
    by: ['product_id'],
    where: {
      order: {
        created_at: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
        status: {
          in: ['CONFIRMED', 'SHIPPING', 'DELIVERED']
        }
      }
    },
    _sum: {
      quantity: true
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: limit
  });

  const productIds = bestSellingItems.map(item => item.product_id);

  if (productIds.length === 0) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      is_active: true
    }
  });

  // Sort products to match the aggregations order (highest sales first)
  const sortedProducts = productIds
    .map(id => products.find(p => p.id === id))
    .filter((p): p is typeof products[0] => p !== undefined);

  return sortedProducts;
};
