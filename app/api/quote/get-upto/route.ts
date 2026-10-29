import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pricingService } from '@/server/modules/quote/pricing';

const deviceField = (name: string) => z.string().trim().min(1, `${name} is required`).max(120);

const GetUptoSchema = z.object({
  devices: z
    .array(z.object({ brand: deviceField('brand'), model: deviceField('model'), storage: deviceField('storage') }))
    .min(1)
    .max(20),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = GetUptoSchema.safeParse(json);
    if (!body.success) {
      return NextResponse.json({ success: false, error: body.error.issues[0].message }, { status: 400 });
    }

    const data = await Promise.all(
      body.data.devices.map(async (device) => {
        const outcome = await pricingService.getUpto(device);
        return { ...device, startingPrice: outcome.ok ? outcome.startingPrice : null };
      })
    );

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
