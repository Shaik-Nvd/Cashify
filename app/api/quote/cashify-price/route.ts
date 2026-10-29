import { NextRequest, NextResponse } from 'next/server';
import { calculateFhoneifyPrice } from '@/lib/pricingCalculator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brand, model, storage, answers } = body;
    if (!brand || !model) {
      return NextResponse.json({ success: false, error: 'brand and model are required' }, { status: 400 });
    }

    // Return reference / calculated quote
    return NextResponse.json({
      success: true,
      data: {
        price: body.fhoneifyPrice || null,
        message: 'Reference market rate processed',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
