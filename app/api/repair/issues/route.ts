import { NextResponse } from 'next/server';

export async function GET() {
  const issues = ['Screen', 'Battery', 'Camera', 'ChargingPort', 'Speaker', 'Motherboard'];
  return NextResponse.json({ success: true, data: issues });
}
