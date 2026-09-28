import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  Shield,
  Lock,
  Unlock,
  Calendar,
  Eye,
  Trash2,
  RefreshCw,
  Mail,
  QrCode,
  FileText,
  AlertCircle,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { StartupIdea, FullAnalysis } from '../types/analysis';
import { SharedReportRecord, SharedReportConfig, ShareAccessLevel } from '../types/share';
import {
  createOrUpdateShareRecord,
  getExistingActiveShareForIdea,
  revokeShareRecord,
  getShareUrl,
  generateSecureShareToken,
} from '../services/shareService';
import { Z_INDEX } from '../constants/zIndex';
import { useAuth } from '../context/AuthContext';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: StartupIdea;
  analysis: FullAnalysis;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  idea,
  analysis,
}) => {
  const { user, profile } = useAuth();
  const [shareRecord, setShareRecord] = useState<SharedReportRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration options
  const [accessLevel, setAccessLevel] = useState<ShareAccessLevel>('public');
  const [passcode, setPasscode] = useState('');
  const [expiryOption, setExpiryOption] = useState<'never' | '7d' | '30d'>('never');
  const [allowDownloadPdf, setAllowDownloadPdf] = useState(true);
  const [includeFinancials, setIncludeFinancials] = useState(true);

  // Initialize or load existing share link when modal opens
  useEffect(() => {
    if (!isOpen || !idea) return;

    const existing = getExistingActiveShareForIdea(idea.id);
    if (existing) {
      setShareRecord(existing);
      setAccessLevel(existing.config.accessLevel || 'public');
      setPasscode(existing.config.passcode || '');
      setAllowDownloadPdf(existing.config.allowDownloadPdf ?? true);
      setIncludeFinancials(existing.config.includeFinancials ?? true);

      if (!existing.config.expiresAt) {
        setExpiryOption('never');
      } else {
        const diffDays = Math.round(
          (new Date(existing.config.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        setExpiryOption(diffDays <= 7 ? '7d' : '30d');
      }
    } else {
      // Auto-generate fresh initial unique share link
      handleGenerateLink();
    }
  }, [isOpen, idea?.id]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const calculateExpiresAt = (option: 'never' | '7d' | '30d'): string | null => {
    if (option === 'never') return null;
    const days = option === '7d' ? 7 : 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  };

  const handleGenerateLink = async (forceNewToken = false) => {
    if (!idea || !analysis) return;
    setLoading(true);
    setError(null);

    const config: SharedReportConfig = {
      accessLevel,
      passcode: accessLevel === 'passcode' ? passcode.trim() : undefined,
      allowDownloadPdf,
      includeFinancials,
      expiresAt: calculateExpiresAt(expiryOption),
    };

    const token = forceNewToken ? generateSecureShareToken() : shareRecord?.id;

    try {
      const result = await createOrUpdateShareRecord({
        idea,
        analysis,
        authorId: user?.id || 'anonymous',
        authorName: profile?.organization ? `${profile.organization} Team` : user?.email?.split('@')[0] || 'Venture Founder',
        authorEmail: user?.email,
        config,
        existingToken: token,
      });

      if (result.record) {
        setShareRecord(result.record);
      }
    } catch (err: any) {
      console.error('Failed to create share record:', err);
      setError('Unable to generate unique link. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = shareRecord ? getShareUrl(shareRecord.id) : '';

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  const handleCopySummary = () => {
    if (!shareUrl || !idea || !analysis) return;
    const memo = `🚀 VentureLens Startup Validation Memo: ${idea.title}
Verdict: ${analysis.verdict_type} (${analysis.overall_score}/100)
Market: ${idea.industry}
Target Audience: ${idea.target_audience}

Executive Summary:
"${analysis.executive_summary}"

🔗 View Full Interactive Validation Report:
${shareUrl}

Protected & generated by VentureLens AI.`;

    navigator.clipboard.writeText(memo).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 3000);
    });
  };

  const handleRevoke = async () => {
    if (!shareRecord) return;
    if (!window.confirm('Are you sure you want to revoke this link? Anyone with this URL will immediately lose access.')) {
      return;
    }

    setRevoking(true);
    try {
      await revokeShareRecord(shareRecord.id);
      setShareRecord(null);
      onClose();
    } catch (err) {
      console.error('Error revoking share:', err);
    } finally {
      setRevoking(false);
    }
  };

  if (!isOpen) return null;

  const emailSubject = encodeURIComponent(`VentureLens Validation Memo: ${idea.title}`);
  const emailBody = encodeURIComponent(
    `Hi Team,\n\nPlease review our latest startup validation report for ${idea.title}:\n\n` +
      `Overall Score: ${analysis.overall_score}/100 (${analysis.verdict_type})\n` +
      `Executive Summary: ${analysis.executive_summary}\n\n` +
      `View the complete interactive due diligence memo here:\n${shareUrl}\n\n` +
      (accessLevel === 'passcode' && passcode ? `Passcode to unlock: ${passcode}\n\n` : '') +
      `Best regards,\n${user?.email || 'Founder'}`
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className={`fixed inset-0 ${Z_INDEX.MODAL_BACKDROP} bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl shadow-2xl overflow-hidden transition-all my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="share-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Share Validation Memo
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px] sm:max-w-md">
                {idea.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close share dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Secure Unique Link Display */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Unique Secure Link</span>
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active & Live
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={shareUrl || 'Generating secure link...'}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-200 select-all focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <button
                onClick={handleCopyLink}
                disabled={!shareUrl || loading}
                id="copy-share-url-btn"
                className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-500/20'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
              <span>Anyone with this unique 256-bit token URL can view the memo.</span>
            </p>
          </div>

          {/* Quick Distribution Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleCopySummary}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                copiedSummary
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {copiedSummary && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
              <div>
                <p className="text-xs font-bold">Copy Memo Text</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Ready for Slack & Teams</p>
              </div>
            </button>

            <a
              href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-left transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1.5">
                <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-bold">Email to Team</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Opens default mail client</p>
              </div>
            </a>

            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                showQr
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-bold">{showQr ? 'Hide QR Code' : 'Scan QR Code'}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">For phone/meeting share</p>
              </div>
            </button>
          </div>

          {/* QR Code Container */}
          {showQr && shareUrl && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 mb-2">
                {/* SVG Visual Representation for QR */}
                <svg viewBox="0 0 120 120" className="w-32 h-32" fill="currentColor">
                  <rect width="120" height="120" fill="white" />
                  {/* Outer corner markers */}
                  <rect x="10" y="10" width="30" height="30" rx="4" fill="#1e1b4b" />
                  <rect x="16" y="16" width="18" height="18" rx="2" fill="white" />
                  <rect x="20" y="20" width="10" height="10" fill="#4338ca" />

                  <rect x="80" y="10" width="30" height="30" rx="4" fill="#1e1b4b" />
                  <rect x="86" y="16" width="18" height="18" rx="2" fill="white" />
                  <rect x="90" y="20" width="10" height="10" fill="#4338ca" />

                  <rect x="10" y="80" width="30" height="30" rx="4" fill="#1e1b4b" />
                  <rect x="16" y="86" width="18" height="18" rx="2" fill="white" />
                  <rect x="20" y="90" width="10" height="10" fill="#4338ca" />

                  {/* High tech data dots pattern */}
                  <circle cx="55" cy="25" r="3" fill="#4338ca" />
                  <circle cx="65" cy="25" r="3" fill="#1e1b4b" />
                  <circle cx="55" cy="35" r="3" fill="#1e1b4b" />
                  <circle cx="65" cy="45" r="3" fill="#6366f1" />

                  <rect x="45" y="50" width="30" height="20" rx="4" fill="#4f46e5" />
                  <text x="60" y="64" fontSize="9" fill="white" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">
                    VL-SEC
                  </text>

                  <circle cx="25" cy="55" r="3" fill="#4338ca" />
                  <circle cx="35" cy="65" r="3" fill="#6366f1" />
                  <circle cx="85" cy="55" r="3" fill="#1e1b4b" />
                  <circle cx="95" cy="65" r="3" fill="#4338ca" />

                  <circle cx="55" cy="85" r="3" fill="#1e1b4b" />
                  <circle cx="65" cy="95" r="3" fill="#4338ca" />
                  <circle cx="85" cy="85" r="3" fill="#4338ca" />
                  <circle cx="95" cy="95" r="3" fill="#6366f1" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Scan to open memo on mobile
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-xs">
                {shareUrl}
              </p>
            </div>
          )}

          {/* Access Control & Security Settings Accordion */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Security & Permissions Settings</span>
                {accessLevel === 'passcode' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-extrabold">
                    PIN Protected
                  </span>
                )}
              </div>
              <span className="text-slate-400 text-xs">{showSettings ? '▲ Hide' : '▼ Customize'}</span>
            </button>

            {showSettings && (
              <div className="p-4 bg-white dark:bg-slate-900 space-y-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                {/* Access Level */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Access Protection
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAccessLevel('public')}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        accessLevel === 'public'
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Link Only</span>
                      </div>
                      <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                        Anyone with the secret link
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccessLevel('passcode')}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        accessLevel === 'passcode'
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Passcode Protected</span>
                      </div>
                      <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                        Requires a secret PIN
                      </p>
                    </button>
                  </div>

                  {accessLevel === 'passcode' && (
                    <div className="mt-3">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Secret Access Passcode / PIN
                      </label>
                      <input
                        type="text"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="e.g. SEED2026 or 4819"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        Recipients must enter this passcode before the validation results are revealed.
                      </p>
                    </div>
                  )}
                </div>

                {/* Expiration Options */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Link Expiration</span>
                  </label>
                  <div className="flex gap-2">
                    {(['never', '7d', '30d'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setExpiryOption(opt)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                          expiryOption === opt
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {opt === 'never' ? 'Never' : opt === '7d' ? '7 Days' : '30 Days'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privacy & Permissions Toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300">
                      Include Financial & Revenue Projections
                    </span>
                    <input
                      type="checkbox"
                      checked={includeFinancials}
                      onChange={(e) => setIncludeFinancials(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300">
                      Allow recipients to download PDF report
                    </span>
                    <input
                      type="checkbox"
                      checked={allowDownloadPdf}
                      onChange={(e) => setAllowDownloadPdf(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                  </label>
                </div>

                {/* Save Settings Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateLink(false)}
                    disabled={loading}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    {loading ? 'Updating Permissions...' : 'Update & Save Link Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Activity & Management Footer */}
          {shareRecord && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>{shareRecord.viewCount || 0} views</span>
                </span>
                <span>•</span>
                <span>Created {new Date(shareRecord.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateLink(true)}
                  disabled={loading}
                  title="Generate a completely new token for this report"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Regenerate Link</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="text-red-500 hover:text-red-600 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{revoking ? 'Revoking...' : 'Revoke Link'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
