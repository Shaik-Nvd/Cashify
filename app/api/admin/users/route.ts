import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let dbUsers: any[] = [];
    try {
      const { default: prisma } = await import('@/server/lib/prisma');
      dbUsers = await prisma.user.findMany();
    } catch {
      // Prisma offline fallback
    }

    if (dbUsers.length === 0) {
      const { users } = await import('@/server/data');
      dbUsers = users;
    }

    return NextResponse.json({ success: true, data: dbUsers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch users' }, { status: 500 });
  }
}
