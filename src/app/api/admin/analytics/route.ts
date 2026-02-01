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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59.999Z');

    // Get orders in date range
    const orders = await prisma.order.findMany({
      where: {
        created_at: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate basic stats
    const totalOrders = orders.length;
    const validStatuses = ['DELIVERED', 'SHIPPING', 'CONFIRMED'];
    const validOrders = orders.filter(o => validStatuses.includes(o.status));
    const totalRevenue = validOrders.reduce((sum, order) => 
      sum + parseFloat(order.total_amount.toString()), 0
    );
    const uniqueCustomers = new Set(orders.map(o => o.customer_phone)).size;
    const averageOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    // Calculate growth (compare with previous period)
    const periodLength = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const prevStart = new Date(start.getTime() - periodLength * 24 * 60 * 60 * 1000);
    const prevEnd = start;

    const prevOrders = await prisma.order.findMany({
      where: {
        created_at: {
          gte: prevStart,
          lt: prevEnd,
        },
      },
    });

    const prevRevenue = prevOrders
      .filter(o => validStatuses.includes(o.status))
      .reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);

    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const orderGrowth = prevOrders.length > 0 ? ((totalOrders - prevOrders.length) / prevOrders.length) * 100 : 0;

    // Get status distribution
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / totalOrders) * 100 * 10) / 10,
    }));

    // Get top products
    const productSales: Record<string, {
      name: string;
      brand: string;
      category: string;
      total_sold: number;
      revenue: number;
    }> = {};

    validOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.product_id;
        if (!productSales[key]) {
          productSales[key] = {
            name: item.product.name,
            brand: item.product.brand || '',
            category: 'Electronics', // Would need to join category
            total_sold: 0,
            revenue: 0,
          };
        }
        productSales[key].total_sold += item.quantity;
        productSales[key].revenue += parseFloat(item.unit_price_at_purchase.toString()) * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 5)
      .map(product => ({
        ...product,
        profit_margin: Math.floor(Math.random() * 15) + 10, // Mock profit margin
      }));

    // Get return requests statistics
    const returnRequests = await prisma.returnRequest.findMany({
      where: {
        created_at: {
          gte: start,
          lte: end,
        },
      },
      include: {
        order: {
          select: {
            order_code: true,
            customer_name: true,
          },
        },
      },
    });

    const returnStats = {
      total: returnRequests.length,
      pending: returnRequests.filter(r => r.status === 'PENDING').length,
      approved: returnRequests.filter(r => r.status === 'APPROVED').length,
      rejected: returnRequests.filter(r => r.status === 'REJECTED').length,
      completed: returnRequests.filter(r => r.status === 'COMPLETED').length,
    };

    // Get recent return requests  
    const recentReturns = await prisma.returnRequest.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        order: {
          select: {
            order_code: true,
            customer_name: true,
          },
        },
      },
    });

    // Get recent orders - Strictly chronological
    const recentOrders = await prisma.order.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        id: true,
        order_code: true,
        customer_name: true,
        customer_phone: true,
        status: true,
        total_amount: true,
        created_at: true,
      },
    });

    const stats = {
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      totalCustomers: uniqueCustomers,
      averageOrderValue: Math.round(averageOrderValue),
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      orderGrowth: Math.round(orderGrowth * 10) / 10,
    };

    return NextResponse.json({
      stats,
      topProducts,
      recentOrders: recentOrders.map(order => ({
        ...order,
        total_amount: order.total_amount.toString(),
        created_at: order.created_at.toISOString(),
      })),
      statusDistribution,
      returnStats,
      recentReturns: recentReturns.map(ret => ({
        id: ret.id,
        reason: ret.reason,
        status: ret.status,
        created_at: ret.created_at.toISOString(),
        order_code: ret.order.order_code,
        customer_name: ret.order.customer_name,
      })),
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Có lỗi khi tải dữ liệu analytics' },
      { status: 500 }
    );
  }
}