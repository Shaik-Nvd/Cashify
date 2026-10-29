import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { otps, generateOtpToken } from '@/lib/otpStore';

const PhoneSchema = z.string().trim().regex(/^\+[1-9]\d{9,14}$/, 'Enter a valid phone number with country code');

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const result = z.object({ phone: PhoneSchema }).safeParse(json);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.issues[0].message }, { status: 400 });
    }

    const { phone } = result.data;
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otps.set(phone, { code, expiresAt, attempts: 0 });

    const otpToken = generateOtpToken(phone, code);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      code,
      debugCode: code,
      otpToken,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
