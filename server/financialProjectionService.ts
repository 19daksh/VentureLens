import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import {
  AiFinancialInsights,
  FinancialAssumptions,
  FinancialProjectionRecord,
  FinancialSummaryMetrics,
  FundingAnalysis,
  ScenarioComparison,
  UnitEconomics,
} from '../src/types/financialProjection.ts';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY environment variable is missing on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getSupabaseServerClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * Generates AI strategic analysis and commentary on calculated financial projections
 */
export async function generateAiFinancialInsights(params: {
  ideaTitle: string;
  industry: string;
  businessModel: string;
  currency: string;
  periodMonths: number;
  assumptions: FinancialAssumptions;
  summaryMetrics: FinancialSummaryMetrics;
  unitEconomics: UnitEconomics;
  fundingAnalysis: FundingAnalysis;
  scenarios: ScenarioComparison;
}): Promise<AiFinancialInsights> {
  const ai = getGeminiClient();

  const prompt = `You are a seasoned venture capital financial analyst and CFO advisor for early-stage startups.
Analyze the following deterministic financial model calculation for this startup and generate executive AI Financial Insights.

STARTUP PROFILE:
- Title: ${params.ideaTitle}
- Industry: ${params.industry}
- Business Model: ${params.businessModel}
- Projection Window: ${params.periodMonths} Months
- Currency: ${params.currency}

CALCULATED FINANCIAL RESULTS:
- Total Projected Revenue (${params.periodMonths}m): ${params.currency} ${params.summaryMetrics.total_revenue_projection.toLocaleString()}
- Total Projected Expenses: ${params.currency} ${params.summaryMetrics.total_expenses_projection.toLocaleString()}
- Total Projected Net Profit/Loss: ${params.currency} ${params.summaryMetrics.total_profit_projection.toLocaleString()}
- Break-Even Month: ${params.summaryMetrics.break_even_month ? `Month ${params.summaryMetrics.break_even_month} (${params.currency} ${params.summaryMetrics.break_even_revenue.toLocaleString()} revenue)` : 'Not achieved within projection window'}
- Monthly Burn Rate: Peak ${params.currency} ${params.summaryMetrics.peak_monthly_burn.toLocaleString()} / Average ${params.currency} ${params.summaryMetrics.average_monthly_burn.toLocaleString()}
- Estimated Runway: ${params.summaryMetrics.current_runway_months} months
- Minimum Cash Balance (Trough): ${params.currency} ${params.summaryMetrics.minimum_cash_balance.toLocaleString()}
- Estimated Capital Deficit / Funding Gap: ${params.currency} ${params.summaryMetrics.funding_gap.toLocaleString()}
- Suggested Total Capital Requirement: ${params.currency} ${params.fundingAnalysis.total_capital_recommendation.toLocaleString()}
- Ending Customers (${params.periodMonths}m): ${params.summaryMetrics.ending_customers.toLocaleString()}

UNIT ECONOMICS:
- Customer Acquisition Cost (CAC): ${params.unitEconomics.cac ? `${params.currency} ${params.unitEconomics.cac}` : 'Insufficient data'}
- Customer Lifetime Value (LTV): ${params.unitEconomics.ltv ? `${params.currency} ${params.unitEconomics.ltv}` : 'Insufficient data'}
- LTV : CAC Ratio: ${params.unitEconomics.ltv_cac_ratio ? `${params.unitEconomics.ltv_cac_ratio}x` : 'N/A'}
- Average Revenue Per User (ARPU): ${params.currency} ${params.unitEconomics.arpu} / month
- Gross Margin: ${params.unitEconomics.gross_margin_pct}%
- Payback Period: ${params.unitEconomics.payback_period_months ? `${params.unitEconomics.payback_period_months} months` : 'N/A'}

SCENARIOS:
- Conservative Revenue: ${params.currency} ${params.scenarios.conservative.total_revenue.toLocaleString()} (Break-even: ${params.scenarios.conservative.break_even_month ? `M${params.scenarios.conservative.break_even_month}` : 'Never'})
- Base Revenue: ${params.currency} ${params.scenarios.base.total_revenue.toLocaleString()} (Break-even: ${params.scenarios.base.break_even_month ? `M${params.scenarios.base.break_even_month}` : 'Never'})
- Optimistic Revenue: ${params.currency} ${params.scenarios.optimistic.total_revenue.toLocaleString()} (Break-even: ${params.scenarios.optimistic.break_even_month ? `M${params.scenarios.optimistic.break_even_month}` : 'Never'})

IMPORTANT RULES:
1. Ground your observations strictly in the provided calculated numbers. Do not invent contradictory numbers.
2. Clearly distinguish between "Estimated Projection / Scenario-based estimate" and guarantees. Never guarantee success.
3. Be candid and constructive. Highlight capital vulnerabilities (e.g. cash trough, long CAC payback, or high fixed burn) alongside strengths.
4. Output valid JSON adhering to this exact schema:
{
  "financial_summary": "A 2-3 sentence executive synthesis evaluating the financial viability, capital efficiency, and profitability curve.",
  "key_drivers": [
    "Primary revenue/cost lever 1 with quantified implication",
    "Primary revenue/cost lever 2",
    "Primary revenue/cost lever 3"
  ],
  "financial_risks": [
    "Specific financial risk 1 (e.g. burn rate vs runway or churn sensitivity)",
    "Specific financial risk 2",
    "Specific financial risk 3"
  ],
  "improvement_opportunities": [
    "Actionable optimization 1 (e.g. annual upfront billing to improve cash flow)",
    "Actionable optimization 2",
    "Actionable optimization 3"
  ],
  "strategic_takeaway": "One high-impact conclusion for the founder regarding their capital strategy."
}`;

  let response: any = null;
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  for (const model of models) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      if (response?.text) break;
    } catch (e) {
      console.warn(`[Financial Insights] Model ${model} failed, trying fallback:`, e);
    }
  }

  const rawText = response.text || '{}';
  const parsed = JSON.parse(rawText);

  return {
    financial_summary:
      parsed.financial_summary ||
      'The financial model indicates a steady path toward sustainability, dependent on maintaining customer acquisition efficiency and managing operational overhead.',
    key_drivers: Array.isArray(parsed.key_drivers)
      ? parsed.key_drivers
      : ['Customer acquisition volume', 'Gross margin retention', 'Fixed operational costs'],
    financial_risks: Array.isArray(parsed.financial_risks)
      ? parsed.financial_risks
      : ['Sensitivity to customer churn', 'Working capital requirements in initial months'],
    improvement_opportunities: Array.isArray(parsed.improvement_opportunities)
      ? parsed.improvement_opportunities
      : ['Introduce annual payment incentives', 'Optimize marketing acquisition channels'],
    strategic_takeaway:
      parsed.strategic_takeaway ||
      'Focus on validating unit economics early before scaling fixed operational overhead.',
    generated_at: new Date().toISOString(),
  };
}

/**
 * Uses Gemini to suggest intelligent, domain-appropriate financial assumptions
 */
export async function suggestFinancialAssumptionsWithGemini(params: {
  title: string;
  description: string;
  industry: string;
  targetAudience: string;
  businessModel?: string;
  currency: string;
}): Promise<{ assumptions: Partial<FinancialAssumptions>; rationale: string }> {
  const ai = getGeminiClient();

  const prompt = `You are a startup financial modeling specialist.
Suggest realistic, defensible initial financial assumptions for the following early-stage startup:

Startup Title: ${params.title}
Description: ${params.description}
Industry: ${params.industry}
Target Audience: ${params.targetAudience}
Recommended Business Model: ${params.businessModel || 'Marketplace / Subscription'}
Currency: ${params.currency}

Provide realistic baseline numbers for an early-stage venture (Seed / Pre-revenue to early traction stage).
If currency is INR, scale appropriately to Indian market realities (e.g. ₹500 - ₹2,000 monthly subscription, ₹1,00,000 - ₹2,50,000 monthly team burn, ₹10,00,000 seed capital).
If currency is USD/EUR/GBP, scale to Western software benchmarks.

Output ONLY valid JSON matching this exact structure:
{
  "assumptions": {
    "business_model": "SaaS" | "Marketplace" | "Subscription" | "E-commerce" | "Service" | "Freemium",
    "pricing": {
      "average_price": number,
      "billing_period": "Monthly" | "Annual" | "One-time"
    },
    "customers": {
      "starting_customers": number,
      "monthly_new_customers": number,
      "monthly_growth_rate": number,
      "monthly_churn_rate": number,
      "transactions_per_customer": number
    },
    "revenue": {
      "revenue_per_transaction": number,
      "additional_monthly_revenue": number,
      "monthly_revenue_growth_rate": number
    },
    "fixed_costs": {
      "salaries": number,
      "software_tools": number,
      "office_infrastructure": number,
      "marketing": number,
      "operations": number,
      "other": number
    },
    "variable_costs": {
      "cost_per_customer": number,
      "cost_per_transaction": number,
      "payment_processing_pct": number,
      "other_variable_pct": number
    },
    "startup_costs": {
      "initial_development": number,
      "initial_marketing": number,
      "equipment_setup": number,
      "legal_registration": number,
      "other_initial": number
    },
    "funding": {
      "initial_capital": number,
      "additional_funding_required": number
    },
    "tax_and_other": {
      "tax_rate_pct": number,
      "other_recurring": number
    }
  },
  "rationale": "2-3 sentences explaining why these assumptions are tailored to this specific startup model."
}`;

  let response: any = null;
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  for (const model of models) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      if (response?.text) break;
    } catch (e) {
      console.warn(`[Suggest Assumptions] Model ${model} failed, trying fallback:`, e);
    }
  }

  const parsed = JSON.parse(response.text || '{}');
  return {
    assumptions: parsed.assumptions || {},
    rationale: parsed.rationale || 'Tailored assumptions based on early-stage industry benchmarks.',
  };
}

/**
 * Saves financial projection to Supabase database if configured
 */
export async function saveFinancialProjectionToSupabase(
  record: FinancialProjectionRecord
): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('financial_projections').upsert(
      {
        id: record.id,
        analysis_id: record.analysis_id,
        user_id: record.user_id,
        projection_period: record.projection_period,
        currency: record.currency,
        assumptions: record.assumptions,
        monthly_projection: record.monthly_projection,
        scenarios: record.scenarios,
        unit_economics: record.unit_economics,
        funding_analysis: record.funding_analysis,
        ai_insights: record.ai_insights || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'analysis_id' }
    );

    if (error) {
      console.warn('Supabase financial_projections upsert notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase financial_projections error:', err);
    return false;
  }
}

/**
 * Fetches financial projection from Supabase database by analysis ID
 */
export async function getFinancialProjectionFromSupabase(
  analysisId: string
): Promise<FinancialProjectionRecord | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('financial_projections')
      .select('*')
      .eq('analysis_id', analysisId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      analysis_id: data.analysis_id,
      user_id: data.user_id,
      projection_period: data.projection_period,
      currency: data.currency,
      assumptions: data.assumptions,
      monthly_projection: data.monthly_projection,
      summary_metrics: data.summary_metrics || ({} as any),
      scenarios: data.scenarios,
      unit_economics: data.unit_economics,
      funding_analysis: data.funding_analysis,
      ai_insights: data.ai_insights,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch {
    return null;
  }
}
