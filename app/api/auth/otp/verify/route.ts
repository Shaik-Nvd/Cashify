import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { otps, verifyOtpToken } from '@/lib/otpStore';

const PhoneSchema = z.string().trim().regex(/^\+[1-9]\d{9,14}$/, 'Enter a valid phone number with country code');

const VerifyOtpSchema = z.object({
  phone: PhoneSchema,
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  otpToken: z.string().optional(),
  name: z.string().trim().max(120).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const result = VerifyOtpSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.issues[0].message }, { status: 400 });
    }

    const { phone, code, otpToken, name } = result.data;
    const record = otps.get(phone);

    // 1. Verify via stateless HMAC token (cross-instance safe)
    let isValid = false;
    if (otpToken && verifyOtpToken(phone, code, otpToken)) {
      isValid = true;
    }

    // 2. Fallback to in-memory record (same instance)
    if (!isValid && record && record.code === code && record.expiresAt > Date.now()) {
      isValid = true;
    }

    // 3. Fallback to dev '123456'
    if (!isValid && code === '123456') {
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }

    otps.delete(phone);

    const user = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      phone,
      name: name || 'SS Telecom User',
      createdAt: new Date().toISOString(),
    };

    const token = 'sstelecom_jwt_' + Buffer.from(JSON.stringify(user)).toString('base64');

    return NextResponse.json({
      success: true,
      data: {
        user,
        accessToken: token,
        refreshToken: 'sstelecom_refresh_' + Buffer.from(JSON.stringify(user)).toString('base64'),
        isNewUser: true,
      },
      message: 'Verified successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
