import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics, recordVisitor } from '@/lib/leadsStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getAnalytics();
    return NextResponse.json({
      success: true,
      data: {
        totalVisitors: stats.totalVisitors,
        pageViews: stats.pageViews,
        lastUpdated: stats.lastUpdated,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try { body = await req.json(); } catch {}
    
    // IP or client-provided session identifier
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const sessionId = body.sessionId || Buffer.from(`${clientIp}-${userAgent}`).toString('base64');

    const stats = await recordVisitor(sessionId);
    return NextResponse.json({
      success: true,
      data: {
        totalVisitors: stats.totalVisitors,
        pageViews: stats.pageViews,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to record visitor' }, { status: 500 });
  }
}
