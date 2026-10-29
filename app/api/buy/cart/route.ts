import { NextRequest, NextResponse } from 'next/server';
import * as buyService from '@/server/modules/buy/service';

export async function GET() {
  const items = buyService.getCart('usr_guest');
  return NextResponse.json({ success: true, data: items });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { listingId } = json;
    if (!listingId) {
      return NextResponse.json({ success: false, error: 'listingId is required' }, { status: 400 });
    }

    const success = buyService.addToCart('usr_guest', listingId);
    return NextResponse.json({ success, message: success ? 'Added to cart' : 'Failed to add' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
