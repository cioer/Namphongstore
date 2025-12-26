import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export async function POST(
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

    if (!user || !['ADMIN', 'SALES', 'TECH'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { admin_note } = body;

    if (!admin_note || admin_note.trim().length < 10) {
      return NextResponse.json(
        { error: 'Vui lòng nhập lý do từ chối (ít nhất 10 ký tự)' },
        { status: 400 }
      );
    }

    // Fetch return request
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: params.id },
      include: {
        order: true,
      },
    });

    if (!returnRequest) {
      return NextResponse.json(
        { error: 'Yêu cầu đổi trả không tồn tại' },
        { status: 404 }
      );
    }

    if (returnRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Yêu cầu đã được xử lý trước đó' },
        { status: 400 }
      );
    }

    // Reject return request with event log
    const updated = await prisma.$transaction(async (tx: TransactionClient) => {
      const updatedReturn = await tx.returnRequest.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          admin_note: admin_note.trim(),
        },
      });

      await tx.eventLog.create({
        data: {
          order_id: returnRequest.order_id,
          return_request_id: params.id,
          user_id: user.id,
          event_type: 'RETURN_REJECTED',
          metadata: {
            admin_note: admin_note.trim(),
          },
        },
      });

      return updatedReturn;
    });

    return NextResponse.json({
      success: true,
      message: 'Đã từ chối yêu cầu đổi trả',
      return_request: updated,
    });
  } catch (error) {
    console.error('Error rejecting return:', error);
    return NextResponse.json(
      { error: 'Có lỗi khi từ chối yêu cầu' },
      { status: 500 }
    );
  }
}
