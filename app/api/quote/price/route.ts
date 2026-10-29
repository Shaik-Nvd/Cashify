import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pricingService } from '@/server/modules/quote/pricing';
import type { PricingErrorCode } from '@/lib/pricing/pricingService';

const deviceField = (name: string) => z.string().trim().min(1, `${name} is required`).max(120);

const PriceQuoteSchema = z.object({
  brand: deviceField('brand'),
  model: deviceField('model'),
  storage: deviceField('storage'),
  diagnostics: z.unknown(),
});

const PRICING_ERROR_STATUS: Record<PricingErrorCode, number> = {
  INVALID_DIAGNOSTICS: 400,
  DEVICE_NOT_FOUND: 404,
  REFERENCE_PRICE_UNAVAILABLE: 409,
  PRICING_INVARIANT_VIOLATION: 500,
  MANUAL_INSPECTION_REQUIRED: 422,
};

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = PriceQuoteSchema.safeParse(json);
    if (!body.success) {
      return NextResponse.json({ success: false, error: body.error.issues[0].message }, { status: 400 });
    }

    const outcome = await pricingService.quote(body.data);
    if (!outcome.ok) {
      const status = PRICING_ERROR_STATUS[outcome.code] || 500;
      return NextResponse.json(
        {
          success: false,
          error: outcome.message,
          code: outcome.code,
          ...(outcome.context ? { context: outcome.context } : {}),
        },
        { status }
      );
    }

    const { internal, ok, ...publicQuote } = outcome;

    // Record lead log if request includes user authentication
    try {
      const authHeader = req.headers.get('authorization') || '';
      let userPhone = '';
      let userName = '';
      let userId = '';

      if (authHeader.startsWith('Bearer ')) {
        const rawToken = authHeader.slice(7);
        if (rawToken.startsWith('sstelecom_jwt_')) {
          const payloadBase64 = rawToken.replace('sstelecom_jwt_', '');
          const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          userPhone = decoded.phone || '';
          userName = decoded.name || '';
          userId = decoded.id || '';
        }
      }

      if (userPhone) {
        const cleanPhone = userPhone.replace(/^\+91/, '').trim();
        const { saveLead } = await import('@/lib/leadsStore');
        const calculatedPrice = outcome.fhoneifyPrice || 0;
        await saveLead({
          userId: userId || cleanPhone,
          name: userName || 'Customer',
          phone: cleanPhone,
          brand: body.data.brand,
          model: body.data.model,
          storage: body.data.storage,
          quotedPrice: calculatedPrice,
          status: 'price checked',
          answers: body.data.diagnostics,
        });

        // Also attempt Prisma write if DB is configured
        try {
          const { default: prisma } = await import('@/server/lib/prisma');
          await prisma.lead.create({
            data: {
              userId: userId || null,
              name: userName || 'Customer',
              phone: cleanPhone,
              brand: body.data.brand,
              model: body.data.model,
              storage: body.data.storage,
              quotedPrice: calculatedPrice,
              status: 'price checked',
              answers: body.data.diagnostics as any,
            }
          });
        } catch {
          // Ignore DB connection errors if using memory/file cache
        }
      }
    } catch (logErr) {
      console.warn('Could not record user valuation check lead:', logErr);
    }

    return NextResponse.json({ success: true, data: publicQuote });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
