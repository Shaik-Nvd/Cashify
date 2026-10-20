import { Response } from 'express';
import * as adminService from './service';
import logger from '../../lib/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { resolveReference, computeFhoneifyGetUpto } from '../../../lib/pricing/engine';

export function getAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const data = adminService.getAnalytics();
    return res.json({ success: true, data });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in getAnalytics controller');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export function getListings(req: AuthenticatedRequest, res: Response) {
  try {
    const data = adminService.getListings();
    return res.json({ success: true, data });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in getListings controller');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export function getOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const data = adminService.getOrders();
    return res.json({ success: true, data });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in getOrders controller');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export function getFraudListings(req: AuthenticatedRequest, res: Response) {
  try {
    const data = adminService.getFraudListings();
    return res.json({ success: true, data });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in getFraudListings controller');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export function approveListing(req: AuthenticatedRequest, res: Response) {
  try {
    const listing = adminService.approveListing(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }
    return res.json({ success: true, data: listing, message: 'Listing approved' });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in approveListing controller');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export function rejectListing(req: AuthenticatedRequest, res: Response) {
  try {
    const listing = adminService.rejectListing(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }
    return res.json({ success: true, data: listing, message: 'Listing rejected' });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in rejectListing controller');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const data = adminService.getUsers();
    return res.json({ success: true, data });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in getUsers controller');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function getLeads(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await adminService.getLeads();
    return res.json({ success: true, data });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in getLeads controller');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function updateLeadStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }
    const lead = await adminService.updateLeadStatus(id, status);
    return res.json({ success: true, data: lead, message: 'Lead status updated' });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in updateLeadStatus controller');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function deleteLead(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    await adminService.deleteLead(id);
    return res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in deleteLead controller');
    return res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
}

export async function deleteLeadsBatch(req: AuthenticatedRequest, res: Response) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids array is required' });
    }
    const result = await adminService.deleteLeadsBatch(ids);
    return res.json({ success: true, count: result.count, message: `${result.count} leads deleted successfully` });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in deleteLeadsBatch controller');
    return res.status(500).json({ success: false, error: 'Failed to delete leads' });
  }
}

import { chromium } from 'playwright';

let browserInstance: any = null;
async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await chromium.launch();
  }
  return browserInstance;
}

export async function generateLeadPdf(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const lead = await adminService.getLeadById(id);
    
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const answers: any = lead.answers || {};

    const deviceDisplayName = lead.model.toLowerCase().startsWith(lead.brand.toLowerCase())
      ? lead.model
      : `${lead.brand} ${lead.model}`;

    // 1. Resolve Fhoneify Get Upto
    let getUptoFormatted = 'N/A';
    try {
      const ref = resolveReference({
        device: {
          model: lead.model,
          storage: lead.storage,
          basePrice: 0,
        },
      });
      if (ref && ref.cashifyGetUptoReference) {
        const upto = computeFhoneifyGetUpto(ref.cashifyGetUptoReference);
        getUptoFormatted = `₹${upto.toLocaleString('en-IN')}`;
      }
    } catch {
      if (lead.quotedPrice) {
        getUptoFormatted = `₹${Math.round(lead.quotedPrice * 1.15).toLocaleString('en-IN')}`;
      }
    }

    // 2. Map Functional/Hardware Problems
    const hardwareMap: Record<string, string> = {
      face: 'Face Sensor Not Working',
      face_sensor: 'Face Sensor Not Working',
      battery_service: 'Battery in Service (Health is less than 80%)',
      battery_health: 'Battery Health 80-85%',
      back_camera: 'Back Camera not working',
      front_camera: 'Front Camera not working',
      charging: 'Charging Jack / Port not working',
      speaker: 'Speaker not working',
      audio_receiver: 'Receiver / Earpiece not working',
      receiver: 'Receiver / Earpiece not working',
      microphone: 'Microphone (Mic) not working',
      mic: 'Microphone (Mic) not working',
      proximity: 'Proximity Sensor not working',
      proximity_sensor: 'Proximity Sensor not working',
      wifi: 'Wi-Fi not working',
      bluetooth: 'Bluetooth not working',
      volume: 'Volume buttons not working',
      power: 'Power button not working',
      silent: 'Vibration / Silent switch not working',
      vibrator: 'Vibration / Silent switch not working',
      fingerprint: 'Fingerprint Scanner not working',
      camera_glass: 'Camera Glass broken',
      s_pen: 'S-Pen missing / not working',
      hinge: 'Hinge defect',
    };

    const hardwareItems: string[] = (answers.hardware || []).map((h: string) => {
      const key = String(h || '').toLowerCase().trim();
      return hardwareMap[key] || h;
    });

    // 3. Screen / Body Defects (Only selected items)
    const defectLines: string[] = [];
    const screenCondition = answers.screenCondition ? String(answers.screenCondition).trim() : '';
    const defectsList = answers.defects || [];
    const hasScreenScratch = defectsList.includes('broken_scratch') || defectsList.includes('screen_scratch') || (screenCondition && screenCondition.toLowerCase() !== 'none');

    if (screenCondition && screenCondition.toLowerCase() !== 'none' && screenCondition.toLowerCase() !== 'n/a') {
      defectLines.push(`Broken/scratch on device screen : ${screenCondition}`);
    } else if (hasScreenScratch) {
      defectLines.push(`Broken/scratch on device screen : Broken/scratch on device screen`);
    }

    if (answers.screenSpots && String(answers.screenSpots).toLowerCase() !== 'none' && String(answers.screenSpots).toLowerCase() !== 'n/a') {
      defectLines.push(`Screen Spots : ${answers.screenSpots}`);
    }
    if (answers.screenLines && String(answers.screenLines).toLowerCase() !== 'none' && String(answers.screenLines).toLowerCase() !== 'n/a') {
      defectLines.push(`Screen Lines : ${answers.screenLines}`);
    }
    if (answers.screenDiscoloration && String(answers.screenDiscoloration).toLowerCase() !== 'none' && String(answers.screenDiscoloration).toLowerCase() !== 'n/a') {
      defectLines.push(`Screen Discoloration : ${answers.screenDiscoloration}`);
    }
    if (answers.bodyScratches && String(answers.bodyScratches).toLowerCase() !== 'none' && String(answers.bodyScratches).toLowerCase() !== 'n/a') {
      defectLines.push(`Body Scratches : ${answers.bodyScratches}`);
    }
    if (answers.bodyDents && String(answers.bodyDents).toLowerCase() !== 'none' && String(answers.bodyDents).toLowerCase() !== 'n/a') {
      defectLines.push(`Body Dents : ${answers.bodyDents}`);
    }
    if (answers.bodyPanel && String(answers.bodyPanel).toLowerCase() !== 'none' && String(answers.bodyPanel).toLowerCase() !== 'n/a') {
      defectLines.push(`Body Panel : ${answers.bodyPanel}`);
    }
    if (answers.bodyBent && String(answers.bodyBent).toLowerCase() !== 'none' && String(answers.bodyBent).toLowerCase() !== 'n/a') {
      defectLines.push(`Body Bent / Loose : ${answers.bodyBent}`);
    }

    // 4. Accessories
    const hasBox = answers.box === true || (answers.accessories || []).includes('box');
    const hasCharger = answers.charger === true || (answers.accessories || []).includes('charger');
    const hasBill = answers.validBill === true || (answers.accessories || []).includes('bill');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Fhoneify Inspection Report - ${deviceDisplayName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 9mm 12mm;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            line-height: 1.4;
            font-size: 13px;
          }

          .report-wrap {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          /* Top Header */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 10px;
            border-bottom: 1.5px solid #e2e8f0;
          }
          .brand-title {
            font-size: 24px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #0f172a;
          }
          .brand-title span { color: #d97706; }
          .doc-badge {
            display: inline-block;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            color: #475569;
            padding: 3px 8px;
            border-radius: 4px;
            margin-top: 3px;
          }

          .customer-pill-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 14px;
            font-size: 12px;
            text-align: right;
            color: #475569;
            line-height: 1.45;
          }
          .customer-pill-box strong { color: #0f172a; }

          /* Meta Row */
          .meta-strip {
            display: flex;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 11px;
            color: #64748b;
          }
          .meta-strip strong { color: #334155; }

          /* Get Upto Banner */
          .upto-banner {
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
            border: 1px solid #fde68a;
            border-left: 5px solid #d97706;
            border-radius: 8px;
            padding: 12px 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .banner-info .sub-tag {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            color: #b45309;
          }
          .banner-info .model-name {
            font-size: 18px;
            font-weight: 800;
            color: #1e293b;
            margin-top: 2px;
          }
          .banner-price {
            text-align: right;
          }
          .banner-price .label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #92400e;
          }
          .banner-price .amount {
            font-size: 26px;
            font-weight: 900;
            color: #d97706;
            line-height: 1.1;
          }

          /* Section Cards */
          .section-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #ffffff;
            overflow: hidden;
            page-break-inside: avoid;
          }
          .section-header {
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 6px 14px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #475569;
          }
          .section-body {
            padding: 8px 14px;
          }

          /* Q&A Rows */
          .qa-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0;
            border-bottom: 1px dashed #f1f5f9;
          }
          .qa-row:last-child { border-bottom: none; }
          .qa-title {
            font-size: 12.5px;
            font-weight: 600;
            color: #1e293b;
          }
          .pill {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.3px;
          }
          .pill-yes { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
          .pill-no { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
          .pill-none { background: #f8fafc; color: #64748b; border: 1px solid #cbd5e1; }

          /* Defects tags */
          .defect-tag {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: #fef2f2;
            color: #991b1b;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 11.5px;
            font-weight: 700;
            margin-right: 6px;
            margin-bottom: 4px;
          }

          /* Final Valuation Box */
          .final-box {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 1px solid #bbf7d0;
            border-left: 5px solid #16a34a;
            border-radius: 8px;
            padding: 12px 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 2px;
            page-break-inside: avoid;
          }
          .final-left .final-badge {
            display: inline-block;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
            padding: 2px 8px;
            border-radius: 4px;
            margin-bottom: 2px;
          }
          .final-left .final-model {
            font-size: 17px;
            font-weight: 800;
            color: #0f172a;
          }
          .final-price-wrap {
            text-align: right;
          }
          .final-price-wrap .final-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #166534;
          }
          .final-price-wrap .final-num {
            font-size: 30px;
            font-weight: 900;
            color: #15803d;
            line-height: 1.1;
          }
        </style>
      </head>
      <body>
        <div class="report-wrap">
          <!-- Header -->
          <div class="header">
            <div>
              <div class="brand-title">FHONE<span>IFY</span></div>
              <div class="doc-badge">Official Lead Inspection Report</div>
            </div>
            <div class="customer-pill-box">
              <div><strong>Customer:</strong> ${lead.name || 'Unknown'}</div>
              <div><strong>Phone:</strong> ${lead.phone}</div>
              <div><strong>Pickup:</strong> ${lead.pickupDate || 'Pending'} ${lead.pickupTime ? 'at ' + lead.pickupTime : ''}</div>
            </div>
          </div>

          <!-- Meta -->
          <div class="meta-strip">
            <div><strong>Address:</strong> ${[lead.address, lead.city].filter(Boolean).join(', ') || 'N/A'}${lead.pincode ? ' - ' + lead.pincode : ''}</div>
            <div><strong>Lead ID:</strong> #${lead.id.slice(0, 8)} &nbsp;|&nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>

          <!-- Get Upto -->
          <div class="upto-banner">
            <div class="banner-info">
              <div class="sub-tag">Device Quotation Evaluation</div>
              <div class="model-name">Sell Old ${deviceDisplayName} (${lead.storage})</div>
            </div>
            <div class="banner-price">
              <div class="label">Fhoneify's Get Upto</div>
              <div class="amount">${getUptoFormatted}</div>
            </div>
          </div>

          <!-- Card 1: Core Condition Checks -->
          <div class="section-card">
            <div class="section-header">Basic Device Functionality Checks</div>
            <div class="section-body">
              <div class="qa-row">
                <span class="qa-title">Are you able to make and receive calls?</span>
                <span class="pill ${answers.calls === false ? 'pill-no' : 'pill-yes'}">${answers.calls === false ? '✕ NO' : '✓ YES'}</span>
              </div>
              <div class="qa-row">
                <span class="qa-title">Is your device's touch screen working properly?</span>
                <span class="pill ${answers.touch === false ? 'pill-no' : 'pill-yes'}">${answers.touch === false ? '✕ NO' : '✓ YES'}</span>
              </div>
              <div class="qa-row">
                <span class="qa-title">Is your phone's screen original?</span>
                <span class="pill ${answers.originalScreen === false ? 'pill-no' : 'pill-yes'}">${answers.originalScreen === false ? '✕ NO' : '✓ YES'}</span>
              </div>
            </div>
          </div>

          <!-- Card 2: Defects & Hardware -->
          <div class="section-card">
            <div class="section-header">Physical Defects & Functional Conditions</div>
            <div class="section-body">
              <div class="qa-row">
                <span class="qa-title">Screen / Body Physical Defects</span>
                ${defectLines.length > 0 ? `
                  <div style="display: flex; flex-wrap: wrap; justify-content: flex-end;">
                    ${defectLines.map(d => `<span class="defect-tag">⚠ ${d}</span>`).join('')}
                  </div>
                ` : `
                  <span class="pill pill-none">NONE REPORTED</span>
                `}
              </div>
              <div class="qa-row" style="align-items: flex-start; padding-top: 6px;">
                <span class="qa-title" style="margin-top: 3px;">Reported Hardware Issues</span>
                <div style="display: flex; flex-wrap: wrap; justify-content: flex-end; max-width: 60%;">
                  ${hardwareItems.length > 0 ? `
                    ${hardwareItems.map((item, idx) => `<span class="defect-tag">⚠ ${idx + 1}) ${item}</span>`).join('')}
                  ` : `
                    <span class="pill pill-yes">✓ ALL FUNCTIONAL</span>
                  `}
                </div>
              </div>
            </div>
          </div>

          <!-- Card 3: Accessories -->
          <div class="section-card">
            <div class="section-header">Original Accessories & Purchase Invoice</div>
            <div class="section-body">
              <div class="qa-row">
                <span class="qa-title">Original Box with same IMEI</span>
                <span class="pill ${hasBox ? 'pill-yes' : 'pill-no'}">${hasBox ? '✓ YES' : '✕ NO'}</span>
              </div>
              <div class="qa-row">
                <span class="qa-title">Original Charger of Device</span>
                <span class="pill ${hasCharger ? 'pill-yes' : 'pill-no'}">${hasCharger ? '✓ YES' : '✕ NO'}</span>
              </div>
              ${answers.validBill !== undefined && answers.validBill !== null ? `
              <div class="qa-row">
                <span class="qa-title">Valid Bill / Invoice Available</span>
                <span class="pill ${hasBill ? 'pill-yes' : 'pill-no'}">${hasBill ? '✓ YES' : '✕ NO'}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Final Evaluated Payout -->
          <div class="final-box">
            <div class="final-left">
              <div class="final-badge">Verified Valuation Offer</div>
              <div class="final-model">${deviceDisplayName} (${lead.storage})</div>
            </div>
            <div class="final-price-wrap">
              <div class="final-title">Fhoneify's Estimated Value</div>
              <div class="final-num">₹${Math.round(lead.quotedPrice).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
    `;

    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await page.close(); // Close only the page to prevent memory leaks

    const safeName = (lead.name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeName}_${lead.phone}_Report.pdf`;
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');
    res.send(pdfBuffer);
    
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in generateLeadPdf controller');
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}
