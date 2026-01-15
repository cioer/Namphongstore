import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = request.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = await prisma.warrantyService.findUnique({
      where: { id: params.id },
      include: {
        warranty_unit: {
          include: {
            order_item: {
              include: {
                order: {
                  select: {
                    id: true,
                    order_code: true,
                    customer_name: true,
                    customer_phone: true,
                  },
                },
                product: {
                    select: {
                        name: true,
                        images: true
                    }
                }
              },
            },
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = request.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: sessionId },
    });

    if (!user || user.role === 'CUSTOMER') { // Basic RBAC
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status, technician_note } = body;

    const updatedService = await prisma.warrantyService.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(technician_note !== undefined && { technician_note }),
      },
    });

    return NextResponse.json({ service: updatedService });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
