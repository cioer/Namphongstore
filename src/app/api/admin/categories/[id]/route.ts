import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function checkAuth(request: NextRequest) {
  const sessionId = request.cookies.get('admin_session')?.value;
  if (!sessionId) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: sessionId },
  });
  
  if (!user || !['ADMIN', 'SALES'].includes(user.role)) return null;
  return user;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await checkAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, description, parent_id, image_url } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    let slug = existingCategory.slug;
    if (name !== existingCategory.name) {
        slug = name.toLowerCase()
          .replace(/đ/g, 'd')
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Ensure unique slug (excluding self)
        let uniqueSlug = slug;
        let counter = 1;
        while (await prisma.category.findFirst({ where: { slug: uniqueSlug, NOT: { id: params.id } } })) {
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }
        slug = uniqueSlug;
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        description,
        image_url,
        parent_id: parent_id || null,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await checkAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Check if category has products
    const productCount = await prisma.product.count({
      where: { category_id: params.id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing products' },
        { status: 400 }
      );
    }

    // Check if category has subcategories
    const childrenCount = await prisma.category.count({
      where: { parent_id: params.id },
    });

    if (childrenCount > 0) {
        return NextResponse.json(
            { error: 'Cannot delete category with subcategories' },
            { status: 400 }
        );
    }

    await prisma.category.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
