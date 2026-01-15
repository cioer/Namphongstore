import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('customer_session')?.value || request.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập để tạo yêu cầu sửa chữa' }, { status: 401 });
    }

    const body = await request.json();
    const { warranty_code, issue_description } = body;

    if (!warranty_code || !issue_description) {
      return NextResponse.json({ error: 'Thiếu thông tin: warranty_code, issue_description' }, { status: 400 });
    }

    const warranty = await prisma.warrantyUnit.findUnique({
      where: { warranty_code_auto: warranty_code },
    });

    if (!warranty) {
      return NextResponse.json({ error: 'Không tìm thấy bảo hành' }, { status: 404 });
    }

    const now = new Date();
    const exchangeUntil = warranty.exchange_until ? new Date(warranty.exchange_until) : null;
    const endDate = new Date(warranty.end_date);

    if (exchangeUntil && now <= exchangeUntil) {
      return NextResponse.json({
        error: 'Đang trong thời hạn đổi sản phẩm mới. Vui lòng tạo yêu cầu đổi trả thay vì sửa chữa.',
        policy: { phase: 'EXCHANGE', exchange_until: warranty.exchange_until }
      }, { status: 400 });
    }

    if (now > endDate) {
      return NextResponse.json({ error: 'Bảo hành đã hết hạn, không thể tạo yêu cầu sửa chữa.' }, { status: 400 });
    }

    const service = await prisma.warrantyService.create({
      data: {
        warranty_unit_id: warranty.id,
        type: 'REPAIR',
        status: 'PENDING',
        issue_description,
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error('Create warranty service error:', error);
    return NextResponse.json({ error: 'Có lỗi khi tạo yêu cầu sửa chữa' }, { status: 500 });
  }
}
