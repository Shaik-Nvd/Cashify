import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as buyService from '@/server/modules/buy/service';

const CreateOrderSchema = z.object({
  address: z.string().min(1, 'address is required'),
  couponCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const result = CreateOrderSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.issues[0].message }, { status: 400 });
    }

    const order = buyService.createOrder('usr_guest', result.data);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: order, message: 'Order created' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
