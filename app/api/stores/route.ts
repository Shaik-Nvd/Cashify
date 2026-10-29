import { NextRequest, NextResponse } from 'next/server';
import { stores } from '@/server/data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');

    const result = city
      ? stores.filter((s) => s.city.toLowerCase() === city.toLowerCase())
      : stores;

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
