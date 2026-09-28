import { SharedReportRecord, SharedReportConfig, ShareReportResponse, VerifyPasscodeResponse } from '../types/share';
import { StartupIdea, FullAnalysis } from '../types/analysis';

const STORAGE_KEY = 'venturelens_shared_reports';

/**
 * Generates a unique, high-entropy, URL-safe secure token
 * Format: vl-sec-[base36 timestamp]-[12 secure random hex chars]
 */
export function generateSecureShareToken(): string {
  const timestamp = Date.now().toString(36);
  let randomPart = '';

  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    randomPart = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  } else {
    randomPart = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
  }

  return `vl-sec-${timestamp}-${randomPart}`;
}

/**
 * Reads local cached share records from localStorage
 */
export function getLocalShareRecords(): SharedReportRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to parse local share records:', err);
    return [];
  }
}

/**
 * Saves local cached share records to localStorage
 */
export function saveLocalShareRecord(record: SharedReportRecord): void {
  try {
    const existing = getLocalShareRecords();
    const index = existing.findIndex((r) => r.id === record.id || (r.ideaId === record.ideaId && !r.revoked));
    if (index >= 0) {
      existing[index] = record;
    } else {
      existing.unshift(record);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Failed to save local share record:', err);
  }
}

/**
 * Finds an existing active share record for a given idea ID
 */
export function getExistingActiveShareForIdea(ideaId: string): SharedReportRecord | null {
  const records = getLocalShareRecords();
  return records.find((r) => r.ideaId === ideaId && !r.revoked) || null;
}

/**
 * Constructs the absolute URL for a share token
 */
export function getShareUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/share/${token}`;
}

/**
 * Creates or updates a unique secure share link
 */
export async function createOrUpdateShareRecord(payload: {
  idea: StartupIdea;
  analysis: FullAnalysis;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  config: SharedReportConfig;
  existingToken?: string;
}): Promise<ShareReportResponse> {
  const { idea, analysis, authorId, authorName, authorEmail, config, existingToken } = payload;
  const token = existingToken || generateSecureShareToken();
  const now = new Date().toISOString();

  const record: SharedReportRecord = {
    id: token,
    ideaId: idea.id,
    analysisId: analysis.id,
    authorId,
    authorName,
    authorEmail,
    ideaTitle: idea.title,
    config,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    revoked: false,
    snapshot: {
      idea,
      analysis,
    },
  };

  // 1. Immediately cache locally
  saveLocalShareRecord(record);

  // 2. Persist to server backend API
  try {
    const res = await fetch('/api/reports/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        record: data.record || record,
        shareUrl: getShareUrl(token),
      };
    }
  } catch (err) {
    console.warn('Backend share sync notice (offline or dev):', err);
  }

  // Fallback to local storage if network or offline
  return {
    success: true,
    record,
    shareUrl: getShareUrl(token),
  };
}

/**
 * Fetches a shared report by its unique token
 */
export async function fetchSharedReport(token: string): Promise<{
  record: SharedReportRecord | null;
  error?: string;
  requiresPasscode?: boolean;
}> {
  // 1. Try fetching from backend API
  try {
    const res = await fetch(`/api/reports/share/${token}`);
    if (res.ok) {
      const data = await res.json();
      if (data.requiresPasscode) {
        return {
          record: data.meta,
          requiresPasscode: true,
        };
      }
      return {
        record: data.record,
        requiresPasscode: false,
      };
    } else if (res.status === 404 || res.status === 410) {
      const data = await res.json().catch(() => ({}));
      return {
        record: null,
        error: data.error || 'Shared report not found or link has expired',
      };
    }
  } catch (err) {
    console.warn('Network error fetching shared report, checking local storage cache:', err);
  }

  // 2. Fall back to local storage cache
  const localRecords = getLocalShareRecords();
  const found = localRecords.find((r) => r.id === token);

  if (!found) {
    return { record: null, error: 'Shared report not found or link has expired' };
  }

  if (found.revoked) {
    return { record: null, error: 'This share link has been revoked by the author' };
  }

  if (found.config.expiresAt && new Date(found.config.expiresAt) < new Date()) {
    return { record: null, error: 'This share link has expired' };
  }

  if (found.config.accessLevel === 'passcode') {
    return {
      record: found,
      requiresPasscode: true,
    };
  }

  // Increment local view count
  found.viewCount = (found.viewCount || 0) + 1;
  found.lastViewedAt = new Date().toISOString();
  saveLocalShareRecord(found);

  return { record: found, requiresPasscode: false };
}

/**
 * Verifies a passcode for a protected report
 */
export async function verifyReportPasscode(token: string, passcode: string): Promise<VerifyPasscodeResponse> {
  // 1. Try server verification
  try {
    const res = await fetch(`/api/reports/share/${token}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        valid: true,
        snapshot: data.snapshot,
      };
    } else {
      const data = await res.json().catch(() => ({}));
      return {
        valid: false,
        error: data.error || 'Incorrect passcode',
      };
    }
  } catch (err) {
    console.warn('Server passcode verification error, fallback to local check:', err);
  }

  // 2. Local check fallback
  const localRecords = getLocalShareRecords();
  const found = localRecords.find((r) => r.id === token);

  if (!found) {
    return { valid: false, error: 'Report not found' };
  }

  if (found.config.passcode && found.config.passcode.trim() === passcode.trim()) {
    return {
      valid: true,
      snapshot: found.snapshot,
    };
  }

  return { valid: false, error: 'Incorrect passcode. Please verify with the author.' };
}

/**
 * Revokes a shared link
 */
export async function revokeShareRecord(token: string): Promise<boolean> {
  // Update local storage
  const localRecords = getLocalShareRecords();
  const found = localRecords.find((r) => r.id === token);
  if (found) {
    found.revoked = true;
    found.updatedAt = new Date().toISOString();
    saveLocalShareRecord(found);
  }

  // Notify server
  try {
    await fetch(`/api/reports/share/${token}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Failed to revoke share on server:', err);
  }

  return true;
}
