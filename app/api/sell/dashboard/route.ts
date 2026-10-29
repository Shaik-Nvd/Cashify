import { NextResponse } from 'next/server';
import * as sellService from '@/server/modules/sell/service';

export async function GET() {
  const data = sellService.getSellerDashboard('usr_guest');
  return NextResponse.json({ success: true, data });
}
