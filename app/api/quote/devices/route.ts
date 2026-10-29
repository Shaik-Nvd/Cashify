import { NextResponse } from 'next/server';
import { SEED_DEVICES } from '@/lib/seed_devices';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: SEED_DEVICES,
      message: 'Devices fetched successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
