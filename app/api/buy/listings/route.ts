import { NextRequest, NextResponse } from 'next/server';
import * as buyService from '@/server/modules/buy/service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brand = searchParams.get('brand') || undefined;
    const city = searchParams.get('city') || undefined;
    const condition = searchParams.get('condition') || undefined;
    const isSelectTier = searchParams.get('isSelectTier') === 'true' ? true : undefined;

    const result = buyService.getListings({ brand, city, condition, isSelectTier });
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
