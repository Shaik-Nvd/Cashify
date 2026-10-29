import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as repairService from '@/server/modules/repair/service';
import { SEED_DEVICES } from '@/lib/seed_devices';

const QuoteSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  issue: z.string().min(1, 'Issue is required'),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const result = QuoteSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.issues[0].message }, { status: 400 });
    }

    const { deviceId, issue } = result.data;
    const quote = await repairService.generateQuote(deviceId, issue);

    if (!quote) {
      return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
    }

    const device = SEED_DEVICES.find((d) => d.id === deviceId);

    return NextResponse.json({
      success: true,
      data: {
        ...quote,
        device,
      },
      message: 'Repair quote generated',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
