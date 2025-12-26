import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    if (!user || !['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Only ADMIN can view audit logs' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const product_id = searchParams.get('product_id');
    const user_id = searchParams.get('user_id');
    const action = searchParams.get('action');

    const where: any = {};
    if (product_id) where.product_id = product_id;
    if (user_id) where.user_id = user_id;
    if (action) where.action = action;

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            full_name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 500, // Limit for performance
    });

    return NextResponse.json({ audit_logs: auditLogs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
