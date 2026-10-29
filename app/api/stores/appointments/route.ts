import { NextRequest, NextResponse } from 'next/server';
import { StoresService } from '@/server/modules/stores/service';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { storeId, date, time, purpose } = json;
    if (!storeId || !date || !time || !purpose) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const appointment = StoresService.bookAppointment('usr_guest', storeId, date, time, purpose);
    return NextResponse.json({ success: true, data: appointment });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
