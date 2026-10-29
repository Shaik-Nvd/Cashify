import { NextRequest, NextResponse } from 'next/server';
import { updateLeadStatus } from '@/lib/leadsStore';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const { status } = json;
    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    try {
      const { default: prisma } = await import('@/server/lib/prisma');
      await prisma.lead.update({
        where: { id: params.id },
        data: { status }
      });
    } catch {
      // Prisma offline fallback
    }

    const updated = await updateLeadStatus(params.id, status);
    return NextResponse.json({ success: true, data: updated, message: 'Lead status updated' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update lead status' }, { status: 500 });
  }
}
