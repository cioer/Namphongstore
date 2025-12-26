import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to detect changed fields
function getChangedFields(before: any, after: any): string[] {
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  for (const key of allKeys) {
    // Skip timestamps and IDs
    if (['id', 'created_at', 'updated_at'].includes(key)) continue;
    
    const beforeVal = JSON.stringify(before[key]);
    const afterVal = JSON.stringify(after[key]);
    
    if (beforeVal !== afterVal) {
      changed.push(key);
    }
  }
  
  return changed;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check auth
    const sessionId = request.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
    });

    if (!user || !['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Only ADMIN can update products' }, { status: 403 });
    }

    const body = await request.json();
    const {
      category_id,
      name,
      slug,
      brand,
      description,
      specs,
      gifts,
      images,
      price_original,
      price_sale,
      discount_percent,
      promo_start,
      promo_end,
      warranty_months,
      stock_quantity,
      is_active,
    } = body;

    // Fetch current product (before state)
    const beforeProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!beforeProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check slug uniqueness (if changed)
    if (slug !== beforeProduct.slug) {
      const existing = await prisma.product.findUnique({
        where: { slug },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      category_id,
      name,
      slug,
      brand: brand || null,
      description: description || null,
      specs: specs || null,
      gifts: gifts || null,
      images: images || null,
      price_original: Number(price_original),
      price_sale: Number(price_sale),
      discount_percent: Number(discount_percent) || 0,
      promo_start: promo_start ? new Date(promo_start) : null,
      promo_end: promo_end ? new Date(promo_end) : null,
      warranty_months: Number(warranty_months) || 12,
      stock_quantity: Number(stock_quantity) || 0,
      is_active: is_active !== false,
    };

    // Update product with audit log
    const result = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      const updatedProduct = await tx.product.update({
        where: { id: params.id },
        data: updateData,
      });

      // Prepare before/after JSON for audit
      const beforeJson = {
        ...beforeProduct,
        price_original: Number(beforeProduct.price_original),
        price_sale: Number(beforeProduct.price_sale),
      };

      const afterJson = {
        ...updatedProduct,
        price_original: Number(updatedProduct.price_original),
        price_sale: Number(updatedProduct.price_sale),
      };

      // Detect changed fields
      const changedFields = getChangedFields(beforeJson, afterJson);

      // Create audit log only if there are changes
      if (changedFields.length > 0) {
        await tx.auditLog.create({
          data: {
            product_id: updatedProduct.id,
            user_id: user.id,
            action: 'UPDATE',
            before_json: beforeJson,
            after_json: afterJson,
            changed_fields: changedFields,
          },
        });
      }

      return updatedProduct;
    });

    return NextResponse.json({
      success: true,
      product: result,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check auth
    const sessionId = request.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
    });

    if (!user || !['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Only ADMIN can delete products' }, { status: 403 });
    }

    // Check if product exists in orders
    const ordersWithProduct = await prisma.orderItem.findFirst({
      where: { product_id: params.id }
    });

    if (ordersWithProduct) {
      return NextResponse.json(
        { error: 'Không thể xóa sản phẩm này vì đã có trong đơn hàng' },
        { status: 400 }
      );
    }

    // Get product info for audit log
    const productToDelete = await prisma.product.findUnique({
      where: { id: params.id },
      select: { name: true }
    });

    await prisma.product.delete({
      where: { id: params.id },
    });

    // Note: Audit logging removed temporarily to avoid schema conflicts

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
