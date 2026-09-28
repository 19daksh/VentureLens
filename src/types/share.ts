import { StartupIdea, FullAnalysis } from './analysis';

export type ShareAccessLevel = 'public' | 'passcode';

export interface SharedReportConfig {
  accessLevel: ShareAccessLevel;
  passcode?: string;
  allowDownloadPdf: boolean;
  includeFinancials: boolean;
  expiresAt: string | null; // ISO date string or null for never
}

export interface SharedReportRecord {
  id: string; // Unique URL-safe token (e.g. vl-sec-...)
  ideaId: string;
  analysisId: string;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  ideaTitle: string;
  config: SharedReportConfig;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  lastViewedAt?: string;
  revoked: boolean;
  snapshot: {
    idea: StartupIdea;
    analysis: FullAnalysis;
  };
}

export interface ShareReportResponse {
  success: boolean;
  record?: SharedReportRecord;
  shareUrl?: string;
  error?: string;
}

export interface VerifyPasscodeResponse {
  valid: boolean;
  snapshot?: {
    idea: StartupIdea;
    analysis: FullAnalysis;
  };
  error?: string;
}
