import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAllProducts, createProductWithAudit } from '@/services/product.service';

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const sessionId = request.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
    });

    if (!user || !['ADMIN', 'SALES'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const products = await getAllProducts();

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

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

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Only ADMIN can create products' }, { status: 403 });
    }

    const body = await request.json();
    const {
      category_id,
      name,
      slug,
      sku,
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
      warranty_exchange_months,
      stock_quantity,
      is_active,
    } = body;

    // Validate required fields
    if (!category_id || !name || !slug || !price_original || !price_sale) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    // Check SKU uniqueness if provided
    if (sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku },
      });

      if (existingSku) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        );
      }
    }

    // Create product with audit log
    const result = await createProductWithAudit({
      category_id,
      name,
      slug,
      sku: sku || null,
      brand: brand || null,
      description: description || null,
      specs: specs || null,
      gifts: gifts || null,
      images: images || null,
      price_original,
      price_sale,
      discount_percent,
      promo_start,
      promo_end,
      warranty_months,
      warranty_exchange_months,
      stock_quantity,
      is_active: is_active !== false,
    }, user.id);

    return NextResponse.json({
      success: true,
      product: result,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
