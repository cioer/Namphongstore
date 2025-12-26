import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Đăng xuất thành công',
  });

  response.cookies.delete('customer_session');

  return response;
}
