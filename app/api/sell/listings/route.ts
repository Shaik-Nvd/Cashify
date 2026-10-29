import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as sellService from '@/server/modules/sell/service';

const CreateListingSchema = z.object({
  deviceId: z.string().min(1, 'deviceId is required'),
  storage: z.string().optional(),
  condition: z.string().optional(),
  askingPrice: z.number().optional(),
  price: z.number().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export async function GET() {
  const data = sellService.getMyListings('usr_guest');
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const result = CreateListingSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.issues[0].message }, { status: 400 });
    }

    const listing = sellService.createListing('usr_guest', result.data);
    return NextResponse.json({ success: true, data: listing, message: 'Listing created successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
