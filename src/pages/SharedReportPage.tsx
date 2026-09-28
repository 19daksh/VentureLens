import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ScoreBadge } from '../components/ScoreBadge';
import { RadarScoreChart } from '../components/RadarScoreChart';
import { fetchSharedReport, verifyReportPasscode } from '../services/shareService';
import { SharedReportRecord } from '../types/share';
import {
  Compass,
  Printer,
  Download,
  Check,
  Loader2,
  Lock,
  KeyRound,
  AlertTriangle,
  FileX,
  Shield,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Users,
} from 'lucide-react';

export const SharedReportPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const reportRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<SharedReportRecord | null>(null);
  const [requiresPasscode, setRequiresPasscode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PDF Export states
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid share link.');
      setLoading(false);
      return;
    }

    loadSharedReport(token);
  }, [token]);

  const loadSharedReport = async (shareToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSharedReport(shareToken);
      if (res.error) {
        setError(res.error);
      } else if (res.requiresPasscode) {
        setRequiresPasscode(true);
        setRecord(res.record);
      } else if (res.record) {
        setRecord(res.record);
        setRequiresPasscode(false);
      } else {
        setError('Shared validation memo could not be found.');
      }
    } catch (err: any) {
      setError('Failed to connect to VentureLens AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !passcode.trim()) return;

    setIsVerifying(true);
    setPasscodeError(null);

    try {
      const result = await verifyReportPasscode(token, passcode.trim());
      if (result.valid && result.snapshot && record) {
        setRecord({
          ...record,
          snapshot: result.snapshot,
        });
        setRequiresPasscode(false);
      } else {
        setPasscodeError(result.error || 'Incorrect passcode. Please check with the author.');
      }
    } catch (err) {
      setPasscodeError('Error validating passcode. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!record?.snapshot?.idea || !record?.snapshot?.analysis || isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);

      const reportEl = reportRef.current;
      if (!reportEl) return;

      const canvas = await html2canvas(reportEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          clonedDoc.documentElement.classList.remove('dark');
        },
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const marginX = 8;
      const marginTop = 8;
      const marginBottom = 8;
      const usableWidth = pdfWidth - marginX * 2;
      const usableHeight = pdfHeight - marginTop - marginBottom;

      const pxPerMm = canvas.width / usableWidth;
      const sliceHeightPx = Math.floor(usableHeight * pxPerMm);

      let yOffset = 0;
      let pageNumber = 0;

      while (yOffset < canvas.height) {
        if (pageNumber > 0) {
          pdf.addPage();
        }

        const currentSlicePx = Math.min(sliceHeightPx, canvas.height - yOffset);
        const currentSliceMm = currentSlicePx / pxPerMm;

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = currentSlicePx;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            yOffset,
            canvas.width,
            currentSlicePx,
            0,
            0,
            canvas.width,
            currentSlicePx
          );

          const sliceData = pageCanvas.toDataURL('image/png', 0.95);
          pdf.addImage(sliceData, 'PNG', marginX, marginTop, usableWidth, currentSliceMm, undefined, 'FAST');
        }

        yOffset += currentSlicePx;
        pageNumber++;
      }

      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);
        pdf.text('VentureLens AI • Shared Due Diligence Memo', marginX, pdfHeight - 3.5);
        pdf.text(`Page ${i} of ${totalPages}`, pdfWidth - marginX, pdfHeight - 3.5, { align: 'right' });
      }

      const safeTitle = (record.snapshot.idea.title || 'Startup-Validation-Summary')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      pdf.save(`VentureLens-Shared-Memo-${safeTitle}.pdf`);
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 4000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 animate-pulse">
            <Compass className="w-6 h-6 animate-spin" />
          </div>
        </div>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Decrypting Shared Validation Memo...
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Verifying security token and retrieving diligence records
        </p>
      </div>
    );
  }

  // 2. Error State (Not found, expired, or revoked)
  if (error || !record) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <FileX className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Memo Unavailable or Link Expired
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            {error || 'This shared validation link is invalid, has expired, or was revoked by the founder.'}
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              to="/"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Explore VentureLens AI
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Log In to Your Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Passcode Required State
  if (requiresPasscode) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl text-left">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <Lock className="w-5 h-5" />
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Passcode Protected Memo
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            <strong>{record.authorName || 'The author'}</strong> has protected this startup validation memo for{' '}
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{record.ideaTitle}</span>.
          </p>

          {passcodeError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{passcodeError}</span>
            </div>
          )}

          <form onSubmit={handleUnlockPasscode} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Enter Access Passcode</span>
              </label>
              <input
                type="password"
                required
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter PIN or Passcode..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying || !passcode.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <span>Unlock Validation Memo</span>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-4">
            Don't have the passcode? Contact {record.authorEmail || 'the team member who shared this link'}.
          </p>
        </div>
      </div>
    );
  }

  const { idea, analysis } = record.snapshot;
  const allowPdf = record.config.allowDownloadPdf ?? true;
  const includeFinancials = record.config.includeFinancials ?? true;

  return (
    <div className="bg-slate-100 dark:bg-slate-950 min-h-screen py-8 print:bg-white print:py-0 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 print:px-0">
        {/* Shared Team Banner (hidden in print) */}
        <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Shared Team Validation Memo
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Read Only
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Shared by <strong className="text-slate-700 dark:text-slate-300">{record.authorName || 'Founder'}</strong>
                {record.authorEmail && <span> ({record.authorEmail})</span>} •{' '}
                {new Date(record.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print Memo"
              className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {allowPdf && (
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-80 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exporting PDF...</span>
                  </>
                ) : pdfDownloaded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            )}

            <Link
              to="/new-analysis"
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600" />
              <span className="hidden sm:inline">Validate Your Idea</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </div>

        {/* The Printable Paper Memo */}
        <div
          ref={reportRef}
          id="printable-report-memo"
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm print:bg-white print:border-none print:shadow-none print:p-0 transition-colors"
        >
          {/* Top Banner / Memo Header */}
          <div className="pb-6 border-b-2 border-slate-900 dark:border-slate-700 print:border-slate-900 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-slate-900">
                  VentureLens AI Diligence Memo
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white print:text-slate-900 tracking-tight font-['Space_Grotesk',sans-serif]">
                {idea.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-300 print:text-slate-500 mt-1">
                Sector: <strong className="text-slate-800 dark:text-slate-200 print:text-slate-800">{idea.industry}</strong> • Target Audience: <strong className="text-slate-800 dark:text-slate-200 print:text-slate-800">{idea.target_audience}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Evaluation Date</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 print:text-slate-800">
                {new Date(idea.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <div className="mt-2">
                <ScoreBadge score={analysis.overall_score} size="lg" />
              </div>
            </div>
          </div>

          {/* Verdict Box */}
          <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 print:bg-slate-50 border border-slate-200 dark:border-slate-700 print:border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Formal Recommendation</span>
              <p className="text-base font-extrabold text-slate-900 dark:text-white print:text-slate-900 mt-0.5">{analysis.verdict}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Diligence Confidence</span>
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase">{analysis.confidence_indicator}</p>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2 mb-8">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider">
              1. Executive Summary
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 print:text-slate-700 leading-relaxed font-normal">
              {analysis.executive_summary}
            </p>
          </div>

          {/* Scores & Radar Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 p-6 bg-slate-50 dark:bg-slate-800/60 print:bg-slate-50 rounded-xl border border-slate-200 dark:border-slate-700 print:border-slate-200">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider mb-3">
                2. Dimensional Scoring
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 print:border-slate-200">
                  <span className="text-slate-600 dark:text-slate-300 print:text-slate-600">Problem & Demand Severity:</span>
                  <strong className="text-slate-900 dark:text-white print:text-slate-900">{analysis.problem_score} / 100</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 print:border-slate-200">
                  <span className="text-slate-600 dark:text-slate-300 print:text-slate-600">Market TAM/SAM Opportunity:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 print:text-indigo-600">{analysis.market_score} / 100</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 print:border-slate-200">
                  <span className="text-slate-600 dark:text-slate-300 print:text-slate-600">Moat & Competitive Wedge:</span>
                  <strong className="text-slate-900 dark:text-white print:text-slate-900">{analysis.competition_score} / 100</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 print:border-slate-200">
                  <span className="text-slate-600 dark:text-slate-300 print:text-slate-600">Business Model & Unit Economics:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 print:text-emerald-600">{analysis.revenue_score} / 100</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-300 print:text-slate-600">Technical Feasibility:</span>
                  <strong className="text-slate-900 dark:text-white print:text-slate-900">{analysis.technical_score} / 100</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <RadarScoreChart analysis={analysis} height={200} />
            </div>
          </div>

          {/* Market Sizing */}
          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider">
              3. Market Opportunity (TAM, SAM, SOM)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 print:bg-slate-50 rounded-lg border border-slate-100 dark:border-slate-700 print:border-slate-100 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">TAM</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white print:text-slate-900">{analysis.market_analysis?.tam}</p>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 print:bg-indigo-50 rounded-lg border border-indigo-100 dark:border-indigo-900/60 print:border-indigo-100 text-center">
                <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">SAM</p>
                <p className="text-base font-extrabold text-indigo-700 dark:text-indigo-300 print:text-indigo-700">{analysis.market_analysis?.sam}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 print:bg-emerald-50 rounded-lg border border-emerald-100 dark:border-emerald-900/60 print:border-emerald-100 text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">SOM (1-3 yr)</p>
                <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 print:text-emerald-700">{analysis.market_analysis?.som}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 print:text-slate-600 leading-relaxed pt-1">
              {analysis.market_analysis?.growth_potential}
            </p>
          </div>

          {/* Competitor Intelligence & Moat Analysis */}
          {(idea.competitor_intelligence || analysis.competitor_intelligence) && (() => {
            const ci = idea.competitor_intelligence || analysis.competitor_intelligence;
            const data = ci?.intelligence_data;
            if (!data) return null;
            return (
              <div className="space-y-3 mb-8">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider">
                  4. Grounded Competitor Intelligence & Strategic Moat
                </h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 print:bg-slate-50 rounded-xl border border-slate-200 dark:border-slate-700 print:border-slate-200 space-y-3">
                  {data.ai_insights?.landscape_summary && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 print:text-slate-700 leading-relaxed italic">
                      &ldquo;{data.ai_insights.landscape_summary}&rdquo;
                    </p>
                  )}

                  {((data.competitor_profiles && data.competitor_profiles.length > 0) ||
                    (data.competitors && data.competitors.length > 0)) && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Key Tracked Competitors & Observed Pricing Tiers
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {(data.competitor_profiles || data.competitors)!.slice(0, 4).map((comp) => (
                          <div
                            key={comp.id}
                            className="p-2.5 bg-white dark:bg-slate-900 print:bg-white rounded-lg border border-slate-200 dark:border-slate-700 print:border-slate-200"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white print:text-slate-900">{comp.name}</span>
                              <span className="text-[10px] text-slate-500">{comp.competitor_type}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {comp.pricing?.pricing_summary || 'Pricing not publicly verified'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Business Model */}
          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider">
              5. Business Model Architecture
            </h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 print:bg-slate-50 rounded-xl border border-slate-200 dark:border-slate-700 print:border-slate-200 text-xs text-slate-700 dark:text-slate-300 print:text-slate-700 space-y-1.5">
              <p><strong className="text-slate-900 dark:text-white print:text-slate-900">Monetization Architecture:</strong> {analysis.business_model?.recommended_business_model || (analysis.business_model as any)?.recommended_pricing || 'B2B SaaS / Tiered Subscription'}</p>
              <p><strong className="text-slate-900 dark:text-white print:text-slate-900">Pricing Strategy:</strong> {analysis.business_model?.pricing_strategy || 'Value-Based Pricing'}</p>
              <p><strong className="text-slate-900 dark:text-white print:text-slate-900">Target Segment:</strong> {analysis.business_model?.customer_segment || 'SMBs & Early Adopters'}</p>
            </div>
          </div>

          {/* Financial Projections (Respects Author Privacy Permission) */}
          {includeFinancials ? (
            (idea.financial_projection || analysis.financial_projection) && (() => {
              const fp = idea.financial_projection || analysis.financial_projection;
              const sm = fp?.summary_metrics;
              const ue = fp?.unit_economics;
              const curr = fp?.currency || 'INR';
              const currSymbol = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : '₹';
              return (
                <div className="space-y-3 mb-8">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider">
                    6. Financial Projections & Capital Model ({fp?.projection_period || 36} Months)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 print:bg-slate-50 rounded-lg border border-slate-200 dark:border-slate-700 print:border-slate-200">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Projected Revenue</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white print:text-slate-900 mt-0.5">
                        {currSymbol} {(sm?.total_revenue_projection || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 print:bg-slate-50 rounded-lg border border-slate-200 dark:border-slate-700 print:border-slate-200">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Expenses</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white print:text-slate-900 mt-0.5">
                        {currSymbol} {(sm?.total_expenses_projection || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 print:bg-slate-50 rounded-lg border border-slate-200 dark:border-slate-700 print:border-slate-200">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Break-Even Milestone</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 print:text-emerald-600 mt-0.5">
                        {sm?.break_even_month ? `Month ${sm.break_even_month}` : 'After Horizon'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 print:bg-slate-50 rounded-lg border border-slate-200 dark:border-slate-700 print:border-slate-200">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Suggested Capital</p>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 print:text-indigo-600 mt-0.5">
                        {currSymbol} {(fp?.funding_analysis?.total_capital_recommendation || sm?.funding_gap || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {ue && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 print:bg-slate-50 rounded-lg border border-slate-200 dark:border-slate-700 print:border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                      <span><strong>CAC:</strong> {ue.cac ? `${currSymbol} ${ue.cac}` : 'N/A'}</span>
                      <span><strong>LTV:</strong> {ue.ltv ? `${currSymbol} ${ue.ltv}` : 'N/A'}</span>
                      <span><strong>LTV:CAC:</strong> {ue.ltv_cac_ratio ? `${ue.ltv_cac_ratio}x` : 'N/A'}</span>
                      <span><strong>Gross Margin:</strong> {ue.gross_margin_pct}%</span>
                      <span><strong>Payback:</strong> {ue.payback_period_months ? `${ue.payback_period_months} mo` : 'N/A'}</span>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 mb-8">
              <Shield className="w-4 h-4 mx-auto mb-1 text-slate-400" />
              <span>Detailed unit economics and financial projections withheld by author.</span>
            </div>
          )}

          {/* Pre-Mortem Risks */}
          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider">
              7. Pre-Mortem Risk Assessment
            </h3>
            <div className="space-y-2">
              {analysis.risks?.slice(0, 3).map((r, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/80 print:bg-slate-50 rounded-lg border border-slate-200 dark:border-slate-700 print:border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase text-[10px]">{r.category} Risk</span>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold uppercase text-[10px]">{r.severity} severity</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 print:text-slate-700">{r.description}</p>
                  <p className="text-emerald-700 dark:text-emerald-400 mt-1"><strong>Mitigation:</strong> {r.mitigation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MVP Scope */}
          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider">
              8. Non-Negotiable MVP Scope
            </h3>
            <div className="space-y-1.5">
              {analysis.mvp_roadmap?.must_have_features?.map((f, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 print:text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6-Month Growth Roadmap Milestones */}
          {(idea.growth_roadmap?.roadmap_data || (analysis as any).growth_roadmap?.roadmap_data) && (() => {
            const rdmp = idea.growth_roadmap?.roadmap_data || (analysis as any).growth_roadmap?.roadmap_data;
            if (!rdmp || !rdmp.months) return null;
            return (
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider">
                    9. Prioritized 6-Month Growth Roadmap & Milestones
                  </h3>
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    North Star: {rdmp.northStarMetric?.name} ({rdmp.northStarMetric?.sixMonthTarget})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {rdmp.months.map((m: any) => (
                    <div
                      key={m.month}
                      className="p-3 bg-slate-50 dark:bg-slate-800/80 print:bg-slate-50 rounded-lg border border-slate-200 dark:border-slate-700 print:border-slate-200 text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[10px] uppercase">
                            Month {m.month}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase">{m.priority}</span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white print:text-slate-900">{m.phaseTitle}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-600 mt-1 line-clamp-2">{m.theme}</p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 print:border-slate-200 text-[10px] text-emerald-700 dark:text-emerald-400">
                        <strong>Gate:</strong> {m.successGate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Final Strategic Verdict */}
          <div className="pt-6 border-t-2 border-slate-900 dark:border-slate-700 print:border-slate-900">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider mb-2">
              9. Strategic Synthesis
            </h3>
            <p className="text-xs text-slate-800 dark:text-slate-200 print:text-slate-800 leading-relaxed font-medium">
              {typeof analysis.final_verdict === 'object' ? (analysis.final_verdict as any).verdict : analysis.final_verdict}
            </p>
            {typeof analysis.final_verdict === 'object' && (analysis.final_verdict as any).recommended_next_step && (
              <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-2">
                <strong>Next Milestone:</strong> {(analysis.final_verdict as any).recommended_next_step}
              </p>
            )}
          </div>

          {/* Memo Footer */}
          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 print:border-slate-200 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
            <span>Generated by VentureLens AI • Gemini Venture Diligence Engine</span>
            <span>Confidential Investment Due Diligence</span>
          </div>
        </div>
      </div>
    </div>
  );
};
