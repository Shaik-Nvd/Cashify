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
        <title>Fhoneify Inspection Report - ${lead.brand} ${lead.model}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 32px 36px;
            line-height: 1.6;
          }
          
          .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .brand-logo {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
          }
          .brand-logo span { color: #d97706; }
          .report-badge {
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
            background: #f1f5f9;
            color: #475569;
            padding: 4px 10px;
            border-radius: 6px;
            display: inline-block;
            margin-top: 4px;
          }
          .customer-meta {
            text-align: right;
            font-size: 13px;
            color: #475569;
            line-height: 1.5;
          }
          .customer-meta strong { color: #0f172a; }

          .lead-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px 18px;
            margin-bottom: 24px;
            font-size: 13px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 16px;
          }
          .lead-card div strong { color: #334155; }

          .get-upto-box {
            background: #fffbeb;
            border: 1.5px solid #fef3c7;
            border-left: 4px solid #d97706;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 24px;
          }
          .device-name {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 6px;
          }
          .price-subtitle {
            font-size: 13px;
            font-weight: 600;
            color: #b45309;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .upto-price {
            font-size: 26px;
            font-weight: 800;
            color: #d97706;
          }

          .question-group {
            margin-bottom: 20px;
          }
          .q-title {
            font-size: 14px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 4px;
          }
          .q-answer {
            font-size: 15px;
            font-weight: 600;
            color: #0f172a;
          }
          .q-answer.yes { color: #059669; }
          .q-answer.no { color: #dc2626; }

          .numbered-list {
            margin-top: 6px;
          }
          .numbered-item {
            font-size: 14px;
            font-weight: 600;
            color: #b91c1c;
            background: #fef2f2;
            border: 1px solid #fee2e2;
            padding: 6px 12px;
            border-radius: 6px;
            margin-bottom: 6px;
            display: block;
          }

          .accessory-table {
            margin-top: 6px;
          }
          .accessory-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 420px;
            padding: 6px 0;
            border-bottom: 1px dashed #e2e8f0;
            font-size: 14px;
          }
          .acc-name { color: #334155; font-weight: 600; }
          .acc-val { font-weight: 700; padding: 2px 8px; border-radius: 4px; }
          .acc-val.yes { background: #ecfdf5; color: #047857; }
          .acc-val.no { background: #fef2f2; color: #b91c1c; }

          .final-box {
            background: #f0fdf4;
            border: 1.5px solid #dcfce7;
            border-left: 4px solid #16a34a;
            border-radius: 8px;
            padding: 18px 20px;
            margin-top: 28px;
          }
          .final-label {
            font-size: 13px;
            font-weight: 700;
            color: #15803d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .final-price {
            font-size: 28px;
            font-weight: 800;
            color: #16a34a;
          }
        </style>
      </head>
      <body>
        <div class="admin-header">
          <div>
            <div class="brand-logo">FHONE<span>IFY</span></div>
            <div class="report-badge">Lead Inspection Report</div>
          </div>
          <div class="customer-meta">
            <div><strong>Customer:</strong> ${lead.name || 'Unknown'}</div>
            <div><strong>Phone:</strong> ${lead.phone}</div>
            <div><strong>Pickup:</strong> ${lead.pickupDate || 'Pending'} ${lead.pickupTime ? 'at ' + lead.pickupTime : ''}</div>
          </div>
        </div>

        ${lead.address || lead.city ? `
        <div class="lead-card">
          <div><strong>Address:</strong> ${lead.address || 'N/A'}</div>
          <div><strong>City & PIN:</strong> ${[lead.city, lead.pincode].filter(Boolean).join(', ') || 'N/A'}</div>
          <div><strong>Lead ID:</strong> #${lead.id.slice(0, 8)}</div>
          <div><strong>Generated:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>
        ` : ''}

        <div class="get-upto-box">
          <div class="device-name">Sell Old ${deviceDisplayName} (${lead.storage})</div>
          <div class="price-subtitle">Fhoneify's Get Upto :</div>
          <div class="upto-price">${getUptoFormatted}</div>
        </div>

        <div class="question-group">
          <div class="q-title">Are you able to make and receive calls?</div>
          <div class="q-answer ${answers.calls === false ? 'no' : 'yes'}">${answers.calls === false ? 'No' : 'Yes'}</div>
        </div>

        <div class="question-group">
          <div class="q-title">Is your device's touch screen working properly?</div>
          <div class="q-answer ${answers.touch === false ? 'no' : 'yes'}">${answers.touch === false ? 'No' : 'Yes'}</div>
        </div>

        <div class="question-group">
          <div class="q-title">Is your phone's screen original?</div>
          <div class="q-answer ${answers.originalScreen === false ? 'no' : 'yes'}">${answers.originalScreen === false ? 'No' : 'Yes'}</div>
        </div>

        <div class="question-group">
          <div class="q-title">Select screen/body defects that are applicable!</div>
          ${defectLines.length > 0 ? `
            <div class="numbered-list">
              ${defectLines.map(d => `<div class="numbered-item">${d}</div>`).join('')}
            </div>
          ` : `
            <div class="q-answer">Broken/scratch on device screen : NONE</div>
          `}
        </div>

        <div class="question-group">
          <div class="q-title">Functional or Physical Problems :</div>
          ${hardwareItems.length > 0 ? `
            <div class="numbered-list">
              ${hardwareItems.map((item, idx) => `<div class="numbered-item">${idx + 1}) ${item}</div>`).join('')}
            </div>
          ` : `
            <div class="q-answer yes">NONE</div>
          `}
        </div>

        <div class="question-group">
          <div class="q-title">Do you have the following?</div>
          <div class="accessory-table">
            <div class="accessory-row">
              <span class="acc-name">Original Box with same IMEI :</span>
              <span class="acc-val ${hasBox ? 'yes' : 'no'}">${hasBox ? 'YES' : 'NO'}</span>
            </div>
            <div class="accessory-row">
              <span class="acc-name">Original Charger of Device :</span>
              <span class="acc-val ${hasCharger ? 'yes' : 'no'}">${hasCharger ? 'YES' : 'NO'}</span>
            </div>
            ${answers.validBill !== undefined && answers.validBill !== null ? `
            <div class="accessory-row">
              <span class="acc-name">Valid Bill Invoice :</span>
              <span class="acc-val ${hasBill ? 'yes' : 'no'}">${hasBill ? 'YES' : 'NO'}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="final-box">
          <div class="device-name">${deviceDisplayName} (${lead.storage})</div>
          <div class="final-label">Fhoneify's Estimated value :</div>
          <div class="final-price">₹${Math.round(lead.quotedPrice).toLocaleString('en-IN')}</div>
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
