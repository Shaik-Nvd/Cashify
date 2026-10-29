import { NextRequest, NextResponse } from 'next/server';
import { getLeadById } from '@/lib/leadsStore';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const lead = await getLeadById(leadId);

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 (pt)
    const { width, height } = page.getSize();

    // Color definitions
    const cGold = rgb(0.83, 0.69, 0.22);
    const cDark = rgb(0.07, 0.09, 0.15);
    const cTextDark = rgb(0.12, 0.14, 0.17);
    const cGray = rgb(0.42, 0.45, 0.50);
    const cLightGray = rgb(0.96, 0.97, 0.98);
    const cBorder = rgb(0.88, 0.90, 0.93);
    const cGreen = rgb(0.06, 0.72, 0.51);
    const cAmber = rgb(0.92, 0.59, 0.04);
    const cWhite = rgb(1, 1, 1);

    // 1. Top Header Banner
    page.drawRectangle({
      x: 0,
      y: height - 85,
      width,
      height: 85,
      color: cDark,
    });

    page.drawText('SS TELECOM', {
      x: 40,
      y: height - 38,
      size: 22,
      font: fontBold,
      color: cGold,
    });

    page.drawText('PREMIUM REFURBISHED & CERTIFIED BUYBACK REPORT', {
      x: 40,
      y: height - 54,
      size: 8.5,
      font,
      color: cWhite,
    });

    page.drawText(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, {
      x: 40,
      y: height - 68,
      size: 8,
      font,
      color: rgb(0.65, 0.70, 0.75),
    });

    // Right Badge on Header
    page.drawRectangle({
      x: width - 180,
      y: height - 70,
      width: 140,
      height: 48,
      color: rgb(0.12, 0.16, 0.22),
      borderColor: cGold,
      borderWidth: 1,
    });

    page.drawText('OFFICIAL VALUATION', {
      x: width - 170,
      y: height - 40,
      size: 8.5,
      font: fontBold,
      color: cGold,
    });

    page.drawText(`Rs. ${lead.quotedPrice.toLocaleString('en-IN')}`, {
      x: width - 170,
      y: height - 58,
      size: 13,
      font: fontBold,
      color: cGreen,
    });

    // Helper to draw a section container
    const drawCard = (x: number, y: number, w: number, h: number, title: string) => {
      // Background and border
      page.drawRectangle({
        x,
        y: y - h,
        width: w,
        height: h,
        color: cWhite,
        borderColor: cBorder,
        borderWidth: 1,
      });
      // Header strip
      page.drawRectangle({
        x,
        y: y - 26,
        width: w,
        height: 26,
        color: cLightGray,
      });
      page.drawText(title, {
        x: x + 14,
        y: y - 18,
        size: 9.5,
        font: fontBold,
        color: cTextDark,
      });
    };

    // 2. Customer & Lead Details Card
    let currentY = height - 105;
    drawCard(40, currentY, 515.28, 90, '1. LEAD & CUSTOMER DETAILS');

    page.drawText('Lead ID:', { x: 55, y: currentY - 45, size: 9, font: fontBold, color: cGray });
    page.drawText(lead.id, { x: 155, y: currentY - 45, size: 9, font, color: cTextDark });

    page.drawText('Customer Name:', { x: 55, y: currentY - 62, size: 9, font: fontBold, color: cGray });
    page.drawText(lead.name || 'Not provided', { x: 155, y: currentY - 62, size: 9, font, color: cTextDark });

    page.drawText('Phone Number:', { x: 55, y: currentY - 79, size: 9, font: fontBold, color: cGray });
    page.drawText(lead.phone, { x: 155, y: currentY - 79, size: 9, font, color: cTextDark });

    page.drawText('Date Received:', { x: 310, y: currentY - 45, size: 9, font: fontBold, color: cGray });
    page.drawText(new Date(lead.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }), { x: 410, y: currentY - 45, size: 9, font, color: cTextDark });

    page.drawText('Pipeline Status:', { x: 310, y: currentY - 62, size: 9, font: fontBold, color: cGray });
    page.drawText((lead.status || 'pending').toUpperCase(), {
      x: 410,
      y: currentY - 62,
      size: 9,
      font: fontBold,
      color: lead.status === 'converted' ? cGreen : cAmber,
    });

    const payout = lead.answers?.pricing?.customerPayout?.payout || lead.quotedPrice;
    page.drawText('Customer Saw:', { x: 310, y: currentY - 79, size: 9, font: fontBold, color: cGray });
    page.drawText(`Rs. ${payout.toLocaleString('en-IN')}`, { x: 410, y: currentY - 79, size: 9, font, color: cTextDark });

    // 3. Device & Valuation Card
    currentY -= 105;
    drawCard(40, currentY, 515.28, 75, '2. DEVICE SPECIFICATIONS & VALUATION');

    page.drawText('Brand:', { x: 55, y: currentY - 45, size: 9, font: fontBold, color: cGray });
    page.drawText(lead.brand, { x: 155, y: currentY - 45, size: 9, font, color: cTextDark });

    page.drawText('Model:', { x: 55, y: currentY - 62, size: 9, font: fontBold, color: cGray });
    page.drawText(lead.model, { x: 155, y: currentY - 62, size: 9, font, color: cTextDark });

    page.drawText('Storage / RAM:', { x: 310, y: currentY - 45, size: 9, font: fontBold, color: cGray });
    page.drawText(lead.storage, { x: 410, y: currentY - 45, size: 9, font, color: cTextDark });

    page.drawText('Quoted Price:', { x: 310, y: currentY - 62, size: 9, font: fontBold, color: cGray });
    page.drawText(`Rs. ${lead.quotedPrice.toLocaleString('en-IN')}`, { x: 410, y: currentY - 62, size: 9.5, font: fontBold, color: cAmber });

    // 4. Diagnostics & Inspection Matrix Card
    currentY -= 90;
    const ans = lead.answers || {};
    drawCard(40, currentY, 515.28, 200, '3. DEVICE CONDITION & DIAGNOSTICS MATRIX');

    const renderGridRow = (rowY: number, l1: string, v1: string, l2: string, v2: string) => {
      page.drawText(l1, { x: 55, y: rowY, size: 8.5, font: fontBold, color: cGray });
      page.drawText(v1, { x: 175, y: rowY, size: 8.5, font, color: cTextDark });
      page.drawText(l2, { x: 310, y: rowY, size: 8.5, font: fontBold, color: cGray });
      page.drawText(v2, { x: 420, y: rowY, size: 8.5, font, color: cTextDark });
    };

    let matrixY = currentY - 44;
    renderGridRow(matrixY, 'Calls Functional:', ans.calls ? 'Yes' : (ans.calls === false ? 'No' : 'N/A'), 'Touch Working:', ans.touch ? 'Yes' : (ans.touch === false ? 'No' : 'N/A'));
    matrixY -= 20;
    renderGridRow(matrixY, 'Original Screen:', ans.originalScreen ? 'Yes' : (ans.originalScreen === false ? 'Replaced' : 'N/A'), 'Screen Condition:', ans.screenCondition || 'Flawless');
    matrixY -= 20;
    renderGridRow(matrixY, 'Screen Spots / Lines:', ans.screenSpots || ans.screenLines || 'None', 'Screen Discoloration:', ans.screenDiscoloration || 'None');
    matrixY -= 20;
    renderGridRow(matrixY, 'Body Scratches:', ans.bodyScratches || 'No scratches', 'Body Dents:', ans.bodyDents || 'No dents');
    matrixY -= 20;
    renderGridRow(matrixY, 'Body Panel / Bent:', ans.bodyPanel || ans.bodyBent || 'Intact', 'Device Age:', ans.mobileAge ? String(ans.mobileAge) : 'Under 11 months');
    matrixY -= 20;
    renderGridRow(matrixY, 'Under Brand Warranty:', ans.warranty ? 'Yes' : 'No', 'Original Bill Present:', ans.validBill ? 'Yes' : 'No');
    matrixY -= 20;

    const hardwareIssues = Array.isArray(ans.hardware) && ans.hardware.length > 0 ? ans.hardware.join(', ') : 'None';
    const accessories = Array.isArray(ans.accessories) && ans.accessories.length > 0 ? ans.accessories.join(', ') : 'None';
    renderGridRow(matrixY, 'Hardware Issues:', hardwareIssues, 'Accessories Available:', accessories);

    // 5. Pickup Logistics Card
    currentY -= 215;
    drawCard(40, currentY, 515.28, 85, '4. PICKUP LOGISTICS & STORE ADDRESS');

    if (lead.pickupDate) {
      page.drawText('Preferred Date:', { x: 55, y: currentY - 44, size: 8.5, font: fontBold, color: cGray });
      page.drawText(lead.pickupDate, { x: 155, y: currentY - 44, size: 8.5, font, color: cTextDark });

      page.drawText('Time Slot:', { x: 310, y: currentY - 44, size: 8.5, font: fontBold, color: cGray });
      page.drawText(lead.pickupTime || 'Standard Slot', { x: 410, y: currentY - 44, size: 8.5, font, color: cTextDark });

      page.drawText('Pickup Address:', { x: 55, y: currentY - 64, size: 8.5, font: fontBold, color: cGray });
      const fullAddress = [lead.address, lead.city, lead.pincode].filter(Boolean).join(', ') || 'Pending confirmation';
      page.drawText(fullAddress.slice(0, 75), { x: 155, y: currentY - 64, size: 8.5, font, color: cTextDark });
    } else {
      page.drawText('Customer evaluated online. Doorstep or in-store appointment has not been booked yet.', {
        x: 55,
        y: currentY - 46,
        size: 9,
        font: fontOblique,
        color: cGray,
      });
      page.drawText('Store Address: 10th Cross, Bhadrappa Layout, Maruti Nagar, Devinagar, Bengaluru | Phone: +91 9066117787', {
        x: 55,
        y: currentY - 65,
        size: 8.5,
        font,
        color: cTextDark,
      });
    }

    // 6. Disclaimer & Bottom Branding
    page.drawLine({
      start: { x: 40, y: 70 },
      end: { x: width - 40, y: 70 },
      thickness: 0.5,
      color: cBorder,
    });

    page.drawText('Note: This report is generated by SS Telecom automated valuation engine based on customer submitted answers.', {
      x: 40,
      y: 55,
      size: 7.5,
      font,
      color: cGray,
    });
    page.drawText('Physical verification by SS Telecom inspection technician at doorstep or store will confirm the final payout.', {
      x: 40,
      y: 44,
      size: 7.5,
      font,
      color: cGray,
    });
    page.drawText('SS TELECOM  *  Refurbished & Certified  *  www.sstelecom.com', {
      x: 180,
      y: 28,
      size: 8,
      font: fontBold,
      color: cGold,
    });

    const pdfBytes = await pdfDoc.save();

    const safeName = (lead.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeName}_${lead.phone}_Report.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache',
      },
    });
  } catch (err: any) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
