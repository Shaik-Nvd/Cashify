import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imei = searchParams.get('imei') || '';
  const valid = /^\d{15}$/.test(imei);

  return NextResponse.json({
    success: true,
    data: {
      imei,
      isValid: valid,
      status: valid ? 'verified' : 'invalid_length',
    },
  });
}
