import { NextRequest, NextResponse } from 'next/server';
import { getLeadsList } from '@/lib/leadsStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let dbLeads: any[] = [];
    try {
      const { default: prisma } = await import('@/server/lib/prisma');
      dbLeads = await prisma.lead.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch {
      // Prisma offline/mock fallback
    }

    const storeLeads = await getLeadsList();
    
    // Combine and deduplicate by id/timestamp
    const allLeadsMap = new Map<string, any>();
    
    for (const l of storeLeads) {
      allLeadsMap.set(l.id, l);
    }
    for (const l of dbLeads) {
      allLeadsMap.set(l.id, l);
    }

    const merged = Array.from(allLeadsMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ success: true, data: merged }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch leads' }, { status: 500 });
  }
}
