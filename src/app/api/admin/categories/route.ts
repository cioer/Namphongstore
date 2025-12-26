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

export async function GET(request: NextRequest) {
  const user = await checkAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const categories = await prisma.category.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { products: true },
        },
        parent: true,
      },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await checkAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, description, parent_id, image_url } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate slug
    let slug = name.toLowerCase()
      .replace(/đ/g, 'd')
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Ensure unique slug
    let uniqueSlug = slug;
    let counter = 1;
    while (await prisma.category.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: uniqueSlug,
        description,
        image_url,
        parent_id: parent_id || null,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
