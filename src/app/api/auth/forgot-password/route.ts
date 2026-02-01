import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Vui lòng nhập email' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // In a real security scenario, you might not want to reveal if a user exists.
      // But for this project/demo, explicit feedback is fine.
      return NextResponse.json(
        { message: 'Email không tồn tại trong hệ thống' },
        { status: 404 }
      );
    }

    // Logic gửi email reset password sẽ ở đây
    // (Trong phạm vi demo, chúng ta giả lập thành công)
    
    return NextResponse.json({
      message: 'Yêu cầu đã được tiếp nhận. Vui lòng kiểm tra email để đặt lại mật khẩu.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: 'Lỗi máy chủ' },
      { status: 500 }
    );
  }
}
