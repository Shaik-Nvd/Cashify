import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as repairService from '@/server/modules/repair/service';

const BookingSchema = z.object({
  quoteId: z.string().min(1, 'Quote ID is required'),
  address: z.string().min(10, 'Complete address is required'),
  pickupDate: z.string().min(1, 'Pickup date is required'),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const result = BookingSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.issues[0].message }, { status: 400 });
    }

    const booking = await repairService.bookRepair(
      'usr_guest',
      result.data.quoteId,
      result.data.address,
      result.data.pickupDate
    );

    return NextResponse.json({
      success: true,
      data: booking,
      message: 'Repair booked successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
