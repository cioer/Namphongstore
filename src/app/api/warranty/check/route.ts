import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Thiếu mã bảo hành' }, { status: 400 });
    }

    const warranty = await prisma.warrantyUnit.findUnique({
      where: { warranty_code_auto: code },
    });

    if (!warranty) {
      return NextResponse.json({ error: 'Không tìm thấy bảo hành' }, { status: 404 });
    }

    const now = new Date();
    const exchangeUntil = warranty.exchange_until ? new Date(warranty.exchange_until) : null;
    const endDate = new Date(warranty.end_date);

    let phase: 'EXCHANGE' | 'REPAIR' | 'EXPIRED';
    if (exchangeUntil && now <= exchangeUntil) {
      phase = 'EXCHANGE';
    } else if (now <= endDate) {
      phase = 'REPAIR';
    } else {
      phase = 'EXPIRED';
    }

    return NextResponse.json({
      code,
      phase,
      meta: {
        start_date: warranty.start_date,
        exchange_until: warranty.exchange_until,
        end_date: warranty.end_date,
      }
    });
  } catch (error) {
    console.error('Warranty check error:', error);
    return NextResponse.json({ error: 'Có lỗi khi kiểm tra bảo hành' }, { status: 500 });
  }
}
