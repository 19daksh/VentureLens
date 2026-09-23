import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useAnalysis } from '../context/AnalysisContext';
import { BackButton } from '../components/BackButton';
import { ScoreBadge } from '../components/ScoreBadge';
import { RadarScoreChart } from '../components/RadarScoreChart';
import { generateValidationPdf } from '../utils/generatePdfReport';
import {
  Compass,
  ArrowLeft,
  Printer,
  Download,
  Check,
  Loader2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getIdeaById, loading } = useAnalysis();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const idea = id ? getIdeaById(id) : null;
  const analysis = idea?.analysis;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!idea || !analysis || isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);
      setPdfError(null);

      const reportEl = reportRef.current;
      if (!reportEl) {
        throw new Error('Report element ref not available');
      }

      // Capture the full rendered analysis report element with html2canvas
      const canvas = await html2canvas(reportEl, {
        scale: 2, // 2x high resolution for retina/print crispness
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          // In the cloned render tree, remove dark mode so the captured PDF has clean white paper presentation
          clonedDoc.documentElement.classList.remove('dark');
        },
      });

      // Construct a multi-page A4 PDF with jsPDF
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
      const usableWidth = pdfWidth - marginX * 2; // 194mm
      const usableHeight = pdfHeight - marginTop - marginBottom; // 281mm

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
          pdf.addImage(
            sliceData,
            'PNG',
            marginX,
            marginTop,
            usableWidth,
            currentSliceMm,
            undefined,
            'FAST'
          );
        }

        yOffset += currentSlicePx;
        pageNumber++;
      }

      // Add running headers & footers to all pages in jsPDF
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184); // slate-400
        pdf.text(
          'VentureLens AI • Startup Due Diligence Memo',
          marginX,
          pdfHeight - 3.5
        );
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pdfWidth - marginX,
          pdfHeight - 3.5,
          { align: 'right' }
        );
      }

      const safeTitle = (idea.title || 'Startup-Validation-Summary')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      pdf.save(`VentureLens-Validation-${safeTitle || 'Summary'}.pdf`);

      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 4000);
    } catch (err: any) {
      console.error('Error capturing report with html2canvas and jsPDF, attempting vector fallback:', err);
      try {
        await generateValidationPdf(idea, analysis);
        setPdfDownloaded(true);
        setTimeout(() => setPdfDownloaded(false), 4000);
      } catch (fallbackErr: any) {
        setPdfError('Failed to generate PDF. You can also use the Print button.');
        setTimeout(() => setPdfError(null), 5000);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading && (!idea || !analysis)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3" />
        <p className="text-xs text-slate-500">Loading investor memo...</p>
      </div>
    );
  }

  if (!idea || !analysis) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center">
        <FileText className="w-10 h-10 text-slate-300 mb-2" />
        <h2 className="text-lg font-bold text-slate-900">Report Not Available</h2>
        <p className="text-xs text-slate-500 mt-1">
          Please complete validation before viewing the investor memo.
        </p>
        <Link
          to="/dashboard"
          className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-950 min-h-screen py-8 print:bg-white print:py-0 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 print:px-0">
        {/* Actions bar (hidden in print) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <BackButton to={`/analysis/${id}`} label="Back to Analysis" />

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="report-print-btn"
              title="Open browser print dialog"
              className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              id="report-download-pdf-btn"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-80 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Capturing & Exporting PDF...</span>
                </>
              ) : pdfDownloaded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Downloaded PDF!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download as PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {pdfError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 print:hidden">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{pdfError}</span>
          </div>
        )}

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

          {/* Grounded Competitor Intelligence & Moat Analysis */}
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
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{comp.pricing?.pricing_summary || 'Pricing not publicly verified'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.competitive_gaps && data.competitive_gaps.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 print:border-slate-200 text-xs">
                      <span className="font-bold text-indigo-700 dark:text-indigo-400 print:text-indigo-700 block mb-1">
                        Primary White-Space Opportunity:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 print:text-slate-700">
                        <strong>{data.competitive_gaps[0].title}:</strong> {data.competitive_gaps[0].evidence}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Unit Economics */}
          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider">
              4. Business Model & Unit Economics
            </h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 print:bg-slate-50 rounded-xl border border-slate-200 dark:border-slate-700 print:border-slate-200 text-xs text-slate-700 dark:text-slate-300 print:text-slate-700 space-y-1.5">
              <p><strong className="text-slate-900 dark:text-white print:text-slate-900">Monetization Architecture:</strong> {analysis.business_model?.recommended_business_model || (analysis.business_model as any)?.recommended_pricing || 'B2B SaaS / Tiered Subscription'}</p>
              <p><strong className="text-slate-900 dark:text-white print:text-slate-900">Pricing Strategy:</strong> {analysis.business_model?.pricing_strategy || 'Value-Based Pricing'}</p>
              <p><strong className="text-slate-900 dark:text-white print:text-slate-900">Target Segment:</strong> {analysis.business_model?.customer_segment || 'SMBs & Early Adopters'}</p>
            </div>
          </div>

          {/* Financial Projections & Capital Modeling */}
          {(idea.financial_projection || analysis.financial_projection) && (() => {
            const fp = idea.financial_projection || analysis.financial_projection;
            const sm = fp?.summary_metrics;
            const ue = fp?.unit_economics;
            const curr = fp?.currency || 'INR';
            const currSymbol = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : '₹';
            return (
              <div className="space-y-3 mb-8">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider">
                  5. Financial Projections & Capital Model ({fp?.projection_period || 36} Months)
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

                {fp?.ai_insights?.financial_summary && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 print:text-slate-600 leading-relaxed italic">
                    &ldquo;{fp.ai_insights.financial_summary}&rdquo;
                  </p>
                )}
              </div>
            );
          })()}

          {/* Pre-Mortem Risks */}
          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider">
              6. Pre-Mortem Risk Assessment
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

          {/* MVP Must-Haves */}
          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider">
              6. Non-Negotiable MVP Scope (First 6–8 Weeks)
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

          {/* Final Strategic Verdict */}
          <div className="pt-6 border-t-2 border-slate-900 dark:border-slate-700 print:border-slate-900">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 uppercase tracking-wider mb-2">
              7. Strategic Synthesis
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

        {/* Bottom actions bar (hidden in print) */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            to={`/analysis/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Interactive Analysis</span>
          </Link>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            id="report-download-pdf-bottom-btn"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-80 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Capturing & Exporting PDF...</span>
              </>
            ) : pdfDownloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Downloaded PDF!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download as PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
