import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    // Check for customer_session (from login route logic) or token (from other auth logic I saw earlier?)
    // Login route sets 'customer_session' with user.id
    const sessionId = cookieStore.get('customer_session')?.value;
    
    // Also check for JWT 'token' as seen in update profile code previously, just in case mixed auth is used
    // But login route explicitly sets 'customer_session'. Let's stick to what we saw in the active login route.
    
    // Actually, let's verify auth method. 
    // Previous analysis: login route sets 'customer_session'.
    
    let userId = sessionId;

    if (!userId) { 
        // fallback to token if customer_session missing (legacy/admin auth?)
        // actually for safety, let's just require authentication.
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Vui lòng nhập đầy đủ thông tin' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check current password (using direct comparison as per login implementation)
    if (user.password_hash !== currentPassword) {
      return NextResponse.json(
        { message: 'Mật khẩu hiện tại không chính xác' },
        { status: 400 }
      );
    }

    // Update to new password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: newPassword,
      },
    });

    return NextResponse.json({
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { message: 'Lỗi máy chủ' },
      { status: 500 }
    );
  }
}
