import { jsPDF } from 'jspdf';
import { StartupIdea, FullAnalysis } from '../types/analysis';

/**
 * Generates a polished, multi-page vector PDF of the Startup Validation & Diligence Memo.
 */
export async function generateValidationPdf(
  idea: StartupIdea,
  analysis: FullAnalysis
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const marginTop = 18;
  const marginBottom = 20;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  let currentY = marginTop;

  // Helper: check space and add page if needed
  const ensureSpace = (neededHeight: number): void => {
    if (currentY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      currentY = marginTop + 6; // Leave space for running header
    }
  };

  // Helper: section title with subtle accent bar
  const drawSectionTitle = (numberStr: string, titleStr: string): void => {
    ensureSpace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42); // slate-900

    // Small indicator dot / bar
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(marginX, currentY - 0.5, 3, 5, 'F');

    doc.text(`${numberStr}. ${titleStr.toUpperCase()}`, marginX + 5, currentY + 3.5);
    currentY += 8;
  };

  // --- 1. COVER / TOP MEMO HEADER ---
  // Top header card background
  const headerCardHeight = 44;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(marginX, currentY, contentWidth, headerCardHeight, 3, 3, 'FD');

  // Eyebrow
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text('VENTURELENS AI • INVESTMENT DILIGENCE MEMO', marginX + 6, currentY + 7);

  // Startup Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  const titleLines = doc.splitTextToSize(idea.title || 'Untitled Startup Idea', contentWidth - 45);
  doc.text(titleLines.slice(0, 2), marginX + 6, currentY + 15);

  // Sector & Target Audience
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  const metaText = `Sector: ${idea.industry || 'General Tech'}   |   Target: ${idea.target_audience || 'All Customers'}`;
  doc.text(metaText, marginX + 6, currentY + 26);

  const evalDate = new Date(idea.created_at || Date.now()).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Evaluation Date: ${evalDate}`, marginX + 6, currentY + 32);

  // Overall Score Badge on Right
  const badgeX = marginX + contentWidth - 36;
  const badgeY = currentY + 6;
  const score = analysis.overall_score || 0;
  
  // Badge color based on score
  if (score >= 80) {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(16, 185, 129); // emerald-500
  } else if (score >= 60) {
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.setDrawColor(99, 102, 241); // indigo-500
  } else {
    doc.setFillColor(254, 242, 242); // rose-50
    doc.setDrawColor(239, 68, 68); // rose-500
  }
  doc.roundedRect(badgeX, badgeY, 30, 30, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  if (score >= 80) doc.setTextColor(5, 150, 105);
  else if (score >= 60) doc.setTextColor(79, 70, 229);
  else doc.setTextColor(220, 38, 38);
  doc.text(`${score}`, badgeX + 15, badgeY + 12, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('OUT OF 100', badgeX + 15, badgeY + 18, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const grade = score >= 85 ? 'Grade A' : score >= 70 ? 'Grade B' : score >= 50 ? 'Grade C' : 'High Risk';
  doc.text(grade, badgeX + 15, badgeY + 25, { align: 'center' });

  currentY += headerCardHeight + 6;

  // --- 2. FORMAL RECOMMENDATION & VERDICT BOX ---
  ensureSpace(24);
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(marginX, currentY, contentWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('FORMAL DILIGENCE VERDICT', marginX + 6, currentY + 6);
  doc.text('DILIGENCE CONFIDENCE', marginX + contentWidth - 6, currentY + 6, { align: 'right' });

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(analysis.verdict || 'Analysis Completed', marginX + 6, currentY + 13);

  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text((analysis.confidence_indicator || 'High Confidence').toUpperCase(), marginX + contentWidth - 6, currentY + 13, { align: 'right' });

  currentY += 25;

  // --- 3. EXECUTIVE SUMMARY ---
  drawSectionTitle('1', 'Executive Summary');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85); // slate-700
  const summaryLines = doc.splitTextToSize(analysis.executive_summary || 'No executive summary provided.', contentWidth);
  ensureSpace(summaryLines.length * 4.5 + 4);
  doc.text(summaryLines, marginX, currentY);
  currentY += summaryLines.length * 4.5 + 6;

  // --- 4. DIMENSIONAL SCORING ---
  drawSectionTitle('2', 'Dimensional Scoring Analysis');
  const scoreDimensions = [
    { label: 'Problem & Demand Severity', val: analysis.problem_score || 0, color: [79, 70, 229] },
    { label: 'Market TAM/SAM Opportunity', val: analysis.market_score || 0, color: [37, 99, 235] },
    { label: 'Moat & Competitive Wedge', val: analysis.competition_score || 0, color: [147, 51, 234] },
    { label: 'Business Model & Unit Economics', val: analysis.revenue_score || 0, color: [16, 185, 129] },
    { label: 'Technical Feasibility', val: analysis.technical_score || 0, color: [13, 148, 136] },
  ];

  const barBoxHeight = scoreDimensions.length * 7 + 6;
  ensureSpace(barBoxHeight);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, barBoxHeight, 2, 2, 'FD');

  let barY = currentY + 6;
  scoreDimensions.forEach((dim) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(dim.label, marginX + 6, barY + 3);

    // Progress Bar Track
    const trackX = marginX + 78;
    const trackWidth = 72;
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(trackX, barY, trackWidth, 3.5, 1, 1, 'F');

    // Filled Bar
    const fillWidth = Math.max(2, (dim.val / 100) * trackWidth);
    doc.setFillColor(dim.color[0], dim.color[1], dim.color[2]);
    doc.roundedRect(trackX, barY, fillWidth, 3.5, 1, 1, 'F');

    // Number score
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`${dim.val} / 100`, marginX + contentWidth - 6, barY + 3, { align: 'right' });

    barY += 7;
  });

  currentY += barBoxHeight + 6;

  // --- 5. MARKET OPPORTUNITY (TAM, SAM, SOM) ---
  drawSectionTitle('3', 'Market Sizing & Opportunity');
  ensureSpace(28);

  const colWidth = (contentWidth - 6) / 3;
  const marketBoxes = [
    { label: 'TAM (TOTAL ADDRESSABLE)', val: analysis.market_analysis?.tam || '$10B+', bg: [248, 250, 252], border: [226, 232, 240], textCol: [15, 23, 42] },
    { label: 'SAM (SERVICEABLE ADDRESSABLE)', val: analysis.market_analysis?.sam || '$1.5B', bg: [238, 242, 255], border: [199, 210, 254], textCol: [79, 70, 229] },
    { label: 'SOM (1-3 YEAR CAPTURABLE)', val: analysis.market_analysis?.som || '$45M', bg: [236, 253, 245], border: [167, 243, 208], textCol: [5, 150, 105] },
  ];

  marketBoxes.forEach((box, i) => {
    const boxX = marginX + i * (colWidth + 3);
    doc.setFillColor(box.bg[0], box.bg[1], box.bg[2]);
    doc.setDrawColor(box.border[0], box.border[1], box.border[2]);
    doc.roundedRect(boxX, currentY, colWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(box.label, boxX + colWidth / 2, currentY + 5, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(box.textCol[0], box.textCol[1], box.textCol[2]);
    doc.text(box.val, boxX + colWidth / 2, currentY + 12, { align: 'center' });
  });

  currentY += 22;

  if (analysis.market_analysis?.growth_potential) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const growthLines = doc.splitTextToSize(`Growth Analysis: ${analysis.market_analysis.growth_potential}`, contentWidth);
    ensureSpace(growthLines.length * 4);
    doc.text(growthLines, marginX, currentY);
    currentY += growthLines.length * 4 + 5;
  }

  // --- 6. COMPETITIVE LANDSCAPE & STRATEGIC MOAT ---
  const ciRecord = idea.competitor_intelligence || analysis.competitor_intelligence;
  const ciData = ciRecord?.intelligence_data;
  const competitorsList = ciData?.competitors || ciData?.competitor_profiles || analysis.competitor_analysis?.competitors || [];

  if (competitorsList.length > 0 || ciData?.landscape_summary || analysis.competitor_analysis?.competitive_landscape_summary) {
    drawSectionTitle('4', 'Competitive Landscape & Moat Analysis');
    
    const summaryText = ciData?.landscape_summary || ciData?.ai_insights?.landscape_summary || analysis.competitor_analysis?.competitive_landscape_summary;
    if (summaryText) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const landscapeLines = doc.splitTextToSize(`"${summaryText}"`, contentWidth);
      ensureSpace(landscapeLines.length * 4);
      doc.text(landscapeLines, marginX, currentY);
      currentY += landscapeLines.length * 4 + 4;
    }

    if (competitorsList.length > 0) {
      ensureSpace(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('KEY TRACKED COMPETITORS & OBSERVED PRICING', marginX, currentY);
      currentY += 3;

      const topCompetitors = competitorsList.slice(0, 4);
      topCompetitors.forEach((comp: any) => {
        ensureSpace(14);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(marginX, currentY, contentWidth, 11, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(comp.name || 'Competitor', marginX + 4, currentY + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        const compType = comp.competitor_type || 'Direct Competitor';
        doc.text(compType, marginX + 4, currentY + 8.5);

        // Pricing or description on the right
        const pricingSummary = comp.pricing?.pricing_summary || comp.pricing?.model_type || comp.description || 'Pricing not public';
        const truncatedPricing = pricingSummary.length > 60 ? pricingSummary.substring(0, 57) + '...' : pricingSummary;
        doc.text(truncatedPricing, marginX + contentWidth - 4, currentY + 6.5, { align: 'right' });

        currentY += 13;
      });
    }

    // Competitive Gap
    const gap = ciData?.competitive_gaps?.[0];
    if (gap) {
      ensureSpace(12);
      doc.setFillColor(238, 242, 255);
      doc.setDrawColor(199, 210, 254);
      doc.roundedRect(marginX, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(79, 70, 229);
      doc.text(`PRIMARY WHITE-SPACE OPPORTUNITY: ${gap.title}`, marginX + 4, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const gapDesc = doc.splitTextToSize(gap.evidence || (gap as any).description || '', contentWidth - 8);
      doc.text(gapDesc[0] || '', marginX + 4, currentY + 9);

      currentY += 15;
    }
  }

  // --- 7. BUSINESS MODEL & MONETIZATION ---
  drawSectionTitle('5', 'Business Model & Unit Economics');
  ensureSpace(20);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const modelVal = analysis.business_model?.recommended_business_model || (analysis.business_model as any)?.recommended_pricing || 'B2B SaaS / Tiered Subscription';
  const pricingVal = analysis.business_model?.pricing_strategy || 'Value-Based Pricing';
  const targetVal = analysis.business_model?.customer_segment || 'SMBs & Early Adopters';

  doc.text(`Monetization Architecture:  ${modelVal}`, marginX + 5, currentY + 5.5);
  doc.text(`Pricing Strategy:  ${pricingVal}`, marginX + 5, currentY + 10.5);
  doc.text(`Primary Customer Segment:  ${targetVal}`, marginX + 5, currentY + 15.5);

  currentY += 23;

  // --- 8. FINANCIAL PROJECTIONS (IF PRESENT) ---
  const fpRecord = idea.financial_projection || analysis.financial_projection;
  if (fpRecord) {
    drawSectionTitle('6', `Financial Projections & Capital Model (${fpRecord.projection_period || 36} Months)`);
    ensureSpace(28);

    const sm = fpRecord.summary_metrics;
    const ue = fpRecord.unit_economics;
    const curr = fpRecord.currency || 'USD';
    const currSym = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : '₹';

    const finCols = (contentWidth - 6) / 4;
    const finBoxes = [
      { label: 'PROJECTED REVENUE', val: `${currSym} ${(sm?.total_revenue_projection || 0).toLocaleString()}` },
      { label: 'TOTAL EXPENSES', val: `${currSym} ${(sm?.total_expenses_projection || 0).toLocaleString()}` },
      { label: 'BREAK-EVEN MILESTONE', val: sm?.break_even_month ? `Month ${sm.break_even_month}` : 'After Horizon' },
      { label: 'RECOMMENDED CAPITAL', val: `${currSym} ${(fpRecord.funding_analysis?.total_capital_recommendation || sm?.funding_gap || 0).toLocaleString()}` },
    ];

    finBoxes.forEach((box, idx) => {
      const bX = marginX + idx * (finCols + 2);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(bX, currentY, finCols, 16, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(box.label, bX + finCols / 2, currentY + 5, { align: 'center' });

      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(box.val, bX + finCols / 2, currentY + 11.5, { align: 'center' });
    });

    currentY += 19;

    if (ue) {
      ensureSpace(12);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(marginX, currentY, contentWidth, 8, 1, 1, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const ueSummary = `CAC: ${ue.cac ? currSym + ue.cac : 'N/A'}   |   LTV: ${ue.ltv ? currSym + ue.ltv : 'N/A'}   |   LTV:CAC: ${ue.ltv_cac_ratio || 'N/A'}x   |   Gross Margin: ${ue.gross_margin_pct}%   |   Payback: ${ue.payback_period_months || 'N/A'} mo`;
      doc.text(ueSummary, marginX + contentWidth / 2, currentY + 5.5, { align: 'center' });
      currentY += 12;
    }
  }

  // --- 9. PRE-MORTEM RISK ASSESSMENT ---
  const risksList = analysis.risks || [];
  if (risksList.length > 0) {
    drawSectionTitle('7', 'Pre-Mortem Risk Assessment');
    const topRisks = risksList.slice(0, 3);

    topRisks.forEach((risk) => {
      const descLines = doc.splitTextToSize(risk.description || '', contentWidth - 8);
      const mitLines = doc.splitTextToSize(`Mitigation: ${risk.mitigation || 'Proactive validation and testing'}`, contentWidth - 8);
      const cardH = descLines.length * 4 + mitLines.length * 4 + 10;

      ensureSpace(cardH);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, currentY, contentWidth, cardH, 2, 2, 'FD');

      // Severity badge & Category
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${(risk.category || 'General').toUpperCase()} RISK`, marginX + 4, currentY + 5.5);

      const sev = risk.severity || 'Medium';
      doc.setFontSize(7);
      if (sev.toLowerCase() === 'critical' || sev.toLowerCase() === 'high') {
        doc.setTextColor(220, 38, 38);
      } else {
        doc.setTextColor(217, 119, 6);
      }
      doc.text(`${sev.toUpperCase()} SEVERITY`, marginX + contentWidth - 4, currentY + 5.5, { align: 'right' });

      // Description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(descLines, marginX + 4, currentY + 10);

      // Mitigation
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(mitLines, marginX + 4, currentY + 10 + descLines.length * 4);

      currentY += cardH + 3;
    });
    currentY += 3;
  }

  // --- 10. NON-NEGOTIABLE MVP SCOPE ---
  const mustHaves = analysis.mvp_roadmap?.must_have_features || [];
  if (mustHaves.length > 0) {
    drawSectionTitle('8', 'Non-Negotiable MVP Scope (First 6–8 Weeks)');
    const needed = mustHaves.length * 6 + 4;
    ensureSpace(needed);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    mustHaves.slice(0, 6).forEach((feat) => {
      doc.setFillColor(16, 185, 129); // green dot
      doc.circle(marginX + 3, currentY + 2.5, 1, 'F');
      const featLines = doc.splitTextToSize(feat, contentWidth - 10);
      doc.text(featLines, marginX + 7, currentY + 3.5);
      currentY += featLines.length * 4 + 2;
    });
    currentY += 4;
  }

  // --- 11. STRATEGIC SYNTHESIS & NEXT MILESTONES ---
  drawSectionTitle('9', 'Strategic Synthesis & Next Milestones');
  const verdictObj = typeof analysis.final_verdict === 'object' ? analysis.final_verdict : { verdict: analysis.final_verdict, recommended_next_step: '' };
  const verdictText = (verdictObj as any)?.verdict || analysis.verdict || 'Continue structured validation.';
  const nextStep = (verdictObj as any)?.recommended_next_step || '';

  const verdictLines = doc.splitTextToSize(verdictText, contentWidth);
  ensureSpace(verdictLines.length * 4.5 + (nextStep ? 16 : 6));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(verdictLines, marginX, currentY);
  currentY += verdictLines.length * 4.5 + 4;

  if (nextStep) {
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(marginX, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(79, 70, 229);
    doc.text('RECOMMENDED IMMEDIATE NEXT MILESTONE:', marginX + 4, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const nextLines = doc.splitTextToSize(nextStep, contentWidth - 8);
    doc.text(nextLines[0] || '', marginX + 4, currentY + 9);

    currentY += 16;
  }

  // --- 12. RUNNING HEADERS & FOOTERS ACROSS ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Running Header (only on page 2 and later)
    if (p > 1) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('VENTURELENS AI • STARTUP VALIDATION MEMO', marginX, 10);
      doc.text((idea.title || '').substring(0, 40), marginX + contentWidth, 10, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, 12, marginX + contentWidth, 12);
    }

    // Running Footer (on every page)
    const footerY = pageHeight - 10;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 3, marginX + contentWidth, footerY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Confidential Due Diligence • Generated by VentureLens AI Diligence Engine', marginX, footerY + 1);
    doc.text(`Page ${p} of ${totalPages}`, marginX + contentWidth, footerY + 1, { align: 'right' });
  }

  // --- 13. TRIGGER CLEAN BROWSER DOWNLOAD ---
  const safeTitle = (idea.title || 'Startup')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const filename = `VentureLens-Validation-${safeTitle || 'Summary'}.pdf`;

  doc.save(filename);
}
