import { put, list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export interface LeadRecord {
  id: string;
  userId?: string | null;
  name?: string | null;
  phone: string;
  brand: string;
  model: string;
  storage: string;
  quotedPrice: number;
  pickupDate?: string | null;
  pickupTime?: string | null;
  address?: string | null;
  pincode?: string | null;
  city?: string | null;
  status: string;
  answers?: any;
  createdAt: string;
  updatedAt?: string;
}

export interface AnalyticsStats {
  totalVisitors: number;
  pageViews: number;
  uniqueSessions: string[];
  lastUpdated: string;
}

const LOCAL_LEADS_FILE = path.join(process.cwd(), '.leads-cache.json');
const LOCAL_ANALYTICS_FILE = path.join(process.cwd(), '.analytics-cache.json');

// In-memory fallback
declare global {
  var __leads_store__: LeadRecord[] | undefined;
  var __analytics_store__: AnalyticsStats | undefined;
}

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// ─── LEADS PERSISTENCE ────────────────────────────────────────────────────────

export async function getLeadsList(): Promise<LeadRecord[]> {
  // Always query cloud Blob in serverless environment to ensure fresh multi-instance sync
  if (BLOB_TOKEN) {
    try {
      const { blobs } = await list({ prefix: 'data/leads.json', token: BLOB_TOKEN });
      if (blobs.length > 0) {
        // Private blob URLs require the Bearer token in the request header!
        const res = await fetch(blobs[0].url, { 
          headers: { 'Authorization': `Bearer ${BLOB_TOKEN}` },
          cache: 'no-store' 
        });
        if (res.ok) {
          const data: LeadRecord[] = await res.json();
          global.__leads_store__ = data;
          return data;
        }
      }
    } catch (err) {
      console.warn('Vercel Blob leads read error:', err);
    }
  }

  if (global.__leads_store__ && global.__leads_store__.length > 0) {
    return global.__leads_store__;
  }

  // Local filesystem fallback
  try {
    if (fs.existsSync(LOCAL_LEADS_FILE)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_LEADS_FILE, 'utf8'));
      if (Array.isArray(data)) {
        global.__leads_store__ = data;
        return data;
      }
    }
  } catch {}

  global.__leads_store__ = global.__leads_store__ || [];
  return global.__leads_store__;
}

export async function saveLead(leadData: Omit<LeadRecord, 'id' | 'createdAt' | 'status'> & { status?: string }): Promise<LeadRecord> {
  const current = await getLeadsList();
  const newLead: LeadRecord = {
    id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    status: leadData.status || 'price checked',
    createdAt: new Date().toISOString(),
    ...leadData,
  };

  const updated = [newLead, ...current.filter(l => l.id !== newLead.id)];
  global.__leads_store__ = updated;

  // Persist to Vercel Blob Cloud
  if (BLOB_TOKEN) {
    try {
      await put('data/leads.json', JSON.stringify(updated, null, 2), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        token: BLOB_TOKEN,
      });
    } catch (err) {
      console.warn('Vercel Blob leads write warning:', err);
    }
  }

  // Persist locally
  try {
    fs.writeFileSync(LOCAL_LEADS_FILE, JSON.stringify(updated, null, 2), 'utf8');
  } catch {}

  return newLead;
}

export async function updateLeadStatus(id: string, status: string): Promise<LeadRecord | null> {
  const current = await getLeadsList();
  const idx = current.findIndex(l => l.id === id);
  if (idx === -1) return null;

  current[idx].status = status;
  current[idx].updatedAt = new Date().toISOString();
  global.__leads_store__ = current;

  if (BLOB_TOKEN) {
    try {
      await put('data/leads.json', JSON.stringify(current, null, 2), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        token: BLOB_TOKEN,
      });
    } catch (err) {}
  }

  try {
    fs.writeFileSync(LOCAL_LEADS_FILE, JSON.stringify(current, null, 2), 'utf8');
  } catch {}

  return current[idx];
}

export async function getLeadById(id: string): Promise<LeadRecord | null> {
  const leads = await getLeadsList();
  return leads.find(l => l.id === id) || null;
}

// ─── VISITOR ANALYTICS PERSISTENCE ──────────────────────────────────────────

export async function getAnalytics(): Promise<AnalyticsStats> {
  if (BLOB_TOKEN) {
    try {
      const { blobs } = await list({ prefix: 'data/analytics.json', token: BLOB_TOKEN });
      if (blobs.length > 0) {
        const res = await fetch(blobs[0].url, { 
          headers: { 'Authorization': `Bearer ${BLOB_TOKEN}` },
          cache: 'no-store' 
        });
        if (res.ok) {
          const data: AnalyticsStats = await res.json();
          global.__analytics_store__ = data;
          return data;
        }
      }
    } catch (err) {
      console.warn('Vercel Blob analytics read warning:', err);
    }
  }

  if (global.__analytics_store__) {
    return global.__analytics_store__;
  }

  try {
    if (fs.existsSync(LOCAL_ANALYTICS_FILE)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_ANALYTICS_FILE, 'utf8'));
      global.__analytics_store__ = data;
      return data;
    }
  } catch {}

  const initial: AnalyticsStats = {
    totalVisitors: 0,
    pageViews: 0,
    uniqueSessions: [],
    lastUpdated: new Date().toISOString(),
  };
  global.__analytics_store__ = initial;
  return initial;
}

export async function recordVisitor(sessionId: string): Promise<AnalyticsStats> {
  const stats = await getAnalytics();
  stats.pageViews += 1;

  if (!stats.uniqueSessions.includes(sessionId)) {
    if (stats.uniqueSessions.length > 2000) stats.uniqueSessions.shift();
    stats.uniqueSessions.push(sessionId);
    stats.totalVisitors += 1;
  }
  stats.lastUpdated = new Date().toISOString();

  global.__analytics_store__ = stats;

  if (BLOB_TOKEN) {
    try {
      await put('data/analytics.json', JSON.stringify(stats, null, 2), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        token: BLOB_TOKEN,
      });
    } catch (err) {}
  }

  try {
    fs.writeFileSync(LOCAL_ANALYTICS_FILE, JSON.stringify(stats, null, 2), 'utf8');
  } catch {}

  return stats;
}
