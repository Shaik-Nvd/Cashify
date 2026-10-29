import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pricingService } from '@/server/modules/quote/pricing';
import * as quoteService from '@/server/modules/quote/service';
import { buildLeadAnswers } from '@/lib/pricing/payout';

const deviceField = (name: string) => z.string().trim().min(1, `${name} is required`).max(120);
const optionalText = (max: number) => z.string().trim().max(max).optional();

const CreateLeadSchema = z.object({
  name: optionalText(120),
  phone: z.string().trim().min(1, 'phone is required').max(20),
  brand: deviceField('brand'),
  model: deviceField('model'),
  storage: deviceField('storage'),
  quotedPrice: z.number().finite().optional(),
  quoteToken: z.string().max(2048).optional(),
  couponApplied: z.boolean().optional(),
  pickupDate: optionalText(40),
  pickupTime: optionalText(40),
  address: optionalText(500),
  pincode: optionalText(12),
  city: optionalText(80),
  answers: z.unknown().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const result = CreateLeadSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.issues[0].message }, { status: 400 });
    }

    const { quoteToken, quotedPrice, couponApplied, answers, ...lead } = result.data;

    let finalQuotedPrice = quotedPrice || 0;
    let verifiedAnswers = answers;

    try {
      const verified = await pricingService.verifyLeadPrice({
        brand: lead.brand,
        model: lead.model,
        storage: lead.storage,
        diagnostics: answers,
        quoteToken,
        clientQuotedPrice: quotedPrice,
      });

      if (verified.ok) {
        finalQuotedPrice = verified.price;
        verifiedAnswers = buildLeadAnswers(verified, couponApplied === true);
      }
    } catch (vErr) {
      console.warn('verifyLeadPrice non-fatal fallback:', vErr);
    }

    let created: any = null;
    try {
      created = await quoteService.createLead({
        ...lead,
        quotedPrice: finalQuotedPrice,
        answers: verifiedAnswers,
      });
    } catch (dbErr) {
      console.warn('Prisma createLead fallback to memory store:', dbErr);
    }

    const { saveLead } = await import('@/lib/leadsStore');
    const stored = await saveLead({
      userId: lead.phone,
      name: lead.name || null,
      phone: lead.phone,
      brand: lead.brand,
      model: lead.model,
      storage: lead.storage,
      quotedPrice: finalQuotedPrice,
      pickupDate: lead.pickupDate || null,
      pickupTime: lead.pickupTime || null,
      address: lead.address || null,
      pincode: lead.pincode || null,
      city: lead.city || null,
      status: lead.pickupDate ? 'pending' : 'price checked',
      answers: verifiedAnswers,
    });

    return NextResponse.json({ success: true, data: created || stored, message: 'Lead created successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
