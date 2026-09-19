import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  PieChart,
  Sliders,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Download,
  RotateCcw,
  Save,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Wallet,
  Clock,
  Briefcase,
  Users,
  Target,
  Percent,
  Coins,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { StartupIdea } from '../../types/analysis';
import {
  AiFinancialInsights,
  BusinessModelType,
  CurrencyCode,
  FinancialAssumptions,
  FinancialProjectionRecord,
  SUPPORTED_CURRENCIES,
} from '../../types/financialProjection';
import {
  buildFullProjectionRecord,
  calculateMonthlyProjections,
  calculateScenarios,
  calculateSummaryMetrics,
  calculateUnitEconomics,
  calculateFundingAnalysis,
  formatCurrency,
  formatPercent,
  CalculationMultipliers,
} from '../../utils/financialCalculations';
import { generateDefaultAssumptions } from '../../utils/defaultFinancialAssumptions';
import { useAuth } from '../../context/AuthContext';
import { useAnalysis } from '../../context/AnalysisContext';

interface FinancialProjectionTabProps {
  idea: StartupIdea;
}

export const FinancialProjectionTab: React.FC<FinancialProjectionTabProps> = ({ idea }) => {
  const { session, user } = useAuth();
  const { saveFinancialProjectionForIdea } = useAnalysis();

  // Existing saved record or default
  const existingRecord = idea.financial_projection || idea.analysis?.financial_projection || null;

  // Configuration state
  const [currency, setCurrency] = useState<CurrencyCode>(existingRecord?.currency || 'INR');
  const [periodMonths, setPeriodMonths] = useState<12 | 24 | 36 | 60>(
    existingRecord?.projection_period || 36
  );

  // Active Assumptions state initialized from saved record or smart industry defaults
  const [assumptions, setAssumptions] = useState<FinancialAssumptions>(() => {
    if (existingRecord?.assumptions) {
      return existingRecord.assumptions;
    }
    return generateDefaultAssumptions(idea);
  });

  // What-If Real-Time Sensitivity Modifiers (Percentage / Multipliers)
  const [whatIfPriceDelta, setWhatIfPriceDelta] = useState<number>(0); // e.g. +20%
  const [whatIfGrowthDelta, setWhatIfGrowthDelta] = useState<number>(0); // e.g. +15%
  const [whatIfChurnDelta, setWhatIfChurnDelta] = useState<number>(0); // e.g. -10%
  const [whatIfMarketingMult, setWhatIfMarketingMult] = useState<number>(1); // e.g. 1.2x
  const [whatIfFixedCostMult, setWhatIfFixedCostMult] = useState<number>(1); // e.g. 1.0x

  // AI Insights state
  const [aiInsights, setAiInsights] = useState<AiFinancialInsights | null>(
    existingRecord?.ai_insights || null
  );
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isSuggestingAssumptions, setIsSuggestingAssumptions] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');

  // UI view toggles
  const [activeChartTab, setActiveChartTab] = useState<'pnl' | 'cash' | 'customers' | 'costs'>('pnl');
  const [expandedSection, setExpandedSection] = useState<string>('pricing_customers');
  const [showTable, setShowTable] = useState<boolean>(false);

  // Derive What-If Calculation Multipliers
  const multipliers: CalculationMultipliers = useMemo(() => {
    return {
      price: 1 + whatIfPriceDelta / 100,
      customerGrowth: 1 + whatIfGrowthDelta / 100,
      churn: Math.max(0.1, 1 + whatIfChurnDelta / 100),
      marketing: whatIfMarketingMult,
      fixedCosts: whatIfFixedCostMult,
    };
  }, [whatIfPriceDelta, whatIfGrowthDelta, whatIfChurnDelta, whatIfMarketingMult, whatIfFixedCostMult]);

  const hasWhatIfOverrides =
    whatIfPriceDelta !== 0 ||
    whatIfGrowthDelta !== 0 ||
    whatIfChurnDelta !== 0 ||
    whatIfMarketingMult !== 1 ||
    whatIfFixedCostMult !== 1;

  // Deterministic calculation of monthly points
  const monthlyProjections = useMemo(() => {
    return calculateMonthlyProjections(assumptions, periodMonths, multipliers);
  }, [assumptions, periodMonths, multipliers]);

  // Derived high-level summary metrics
  const summaryMetrics = useMemo(() => {
    return calculateSummaryMetrics(monthlyProjections, assumptions);
  }, [monthlyProjections, assumptions]);

  // Unit Economics
  const unitEconomics = useMemo(() => {
    return calculateUnitEconomics(assumptions, monthlyProjections);
  }, [assumptions, monthlyProjections]);

  // Scenario Comparisons (Conservative, Base, Optimistic)
  const scenarios = useMemo(() => {
    return calculateScenarios(assumptions, periodMonths);
  }, [assumptions, periodMonths]);

  // Funding and Cash Trough Analysis
  const fundingAnalysis = useMemo(() => {
    return calculateFundingAnalysis(monthlyProjections, assumptions);
  }, [monthlyProjections, assumptions]);

  // Reset what-if sliders
  const resetWhatIf = () => {
    setWhatIfPriceDelta(0);
    setWhatIfGrowthDelta(0);
    setWhatIfChurnDelta(0);
    setWhatIfMarketingMult(1);
    setWhatIfFixedCostMult(1);
  };

  // Reset to default assumptions based on the startup's profile
  const handleResetDefaults = () => {
    if (window.confirm('Reset all financial model assumptions to recommended defaults?')) {
      const defaults = generateDefaultAssumptions(idea);
      setAssumptions(defaults);
      resetWhatIf();
    }
  };

  // Save current projection model to Supabase & local storage
  const handleSaveProjection = async () => {
    setSaveStatus('saving');
    setSaveMessage('Saving projection model...');

    try {
      const record: FinancialProjectionRecord = buildFullProjectionRecord(
        idea.analysis?.id || idea.id,
        user?.id || 'demo-user',
        assumptions,
        periodMonths,
        currency,
        existingRecord?.id
      );

      if (aiInsights) {
        record.ai_insights = aiInsights;
      }

      // Save to React Context and localDb
      saveFinancialProjectionForIdea(idea.id, record);

      // Attempt server-side API sync
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else if (user?.id === '00000000-0000-4000-8000-000000000001') {
        headers['Authorization'] = 'Bearer demo-token';
      }

      const res = await fetch('/api/financial-projection', {
        method: 'POST',
        headers,
        body: JSON.stringify(record),
      });

      if (res.ok) {
        setSaveStatus('saved');
        setSaveMessage('Model saved successfully!');
      } else {
        setSaveStatus('saved');
        setSaveMessage('Saved locally in browser.');
      }

      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (err: any) {
      console.warn('Save notice:', err);
      setSaveStatus('saved');
      setSaveMessage('Saved locally.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Trigger AI Financial Insights generation
  const handleGenerateAiInsights = async () => {
    setIsGeneratingAi(true);
    try {
      const payload = {
        ideaTitle: idea.title,
        industry: idea.industry,
        businessModel: assumptions.business_model,
        currency,
        periodMonths,
        assumptions,
        summaryMetrics,
        unitEconomics,
        fundingAnalysis,
        scenarios,
      };

      const res = await fetch('/api/financial-projection/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAiInsights(data.data);
      } else {
        throw new Error(data.error || 'Failed to generate insights');
      }
    } catch (err: any) {
      console.error('Error generating AI financial insights:', err);
      // Fallback deterministic synthesis
      setAiInsights({
        financial_summary: `Based on a ${periodMonths}-month projection with starting price of ${formatCurrency(assumptions.pricing.average_price, currency)}, the venture is projected to achieve ${formatCurrency(summaryMetrics.total_revenue_projection, currency)} in cumulative revenue with a break-even milestone estimated at ${summaryMetrics.break_even_month ? `Month ${summaryMetrics.break_even_month}` : 'after Month ' + periodMonths}.`,
        key_drivers: [
          `Monthly customer growth rate of ${assumptions.customers.monthly_growth_rate}% compounding with ${assumptions.customers.monthly_new_customers} base monthly additions`,
          `Unit contribution margin of ${unitEconomics.gross_margin_pct}% covering fixed monthly team and overhead burn`,
          `Customer retention curve with an estimated ${assumptions.customers.monthly_churn_rate}% monthly churn`,
        ],
        financial_risks: [
          summaryMetrics.minimum_cash_balance < 0
            ? `Cash trough reaches ${formatCurrency(summaryMetrics.minimum_cash_balance, currency)}, creating an operating capital deficit of ${formatCurrency(summaryMetrics.funding_gap, currency)}.`
            : `Maintaining customer acquisition costs within target given competitive marketing dynamics.`,
          `Sensitivity to customer churn: even a small increase in cancellation rates lengthens the break-even horizon.`,
        ],
        improvement_opportunities: [
          `Incentivize annual upfront subscriptions with a 15-20% discount to accelerate cash collections and improve working capital.`,
          `Optimize initial customer acquisition channels to shorten the payback window to under 6 months.`,
          `Explore additional monetizable transaction fees or add-on enterprise tiers to increase ARPU.`,
        ],
        strategic_takeaway: `Maintain disciplined fixed cost control during initial quarters until product-market fit and repeat retention rates are quantitatively validated.`,
        generated_at: new Date().toISOString(),
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Suggest assumptions via Gemini
  const handleSuggestAssumptionsWithAi = async () => {
    setIsSuggestingAssumptions(true);
    try {
      const res = await fetch('/api/financial-projection/suggest-assumptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: idea.title,
          description: idea.description,
          industry: idea.industry,
          targetAudience: idea.target_audience,
          businessModel: idea.analysis?.business_model?.recommended_business_model,
          currency,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.assumptions) {
        setAssumptions(prev => ({
          ...prev,
          ...json.data.assumptions,
          pricing: { ...prev.pricing, ...(json.data.assumptions.pricing || {}) },
          customers: { ...prev.customers, ...(json.data.assumptions.customers || {}) },
          revenue: { ...prev.revenue, ...(json.data.assumptions.revenue || {}) },
          fixed_costs: { ...prev.fixed_costs, ...(json.data.assumptions.fixed_costs || {}) },
          variable_costs: { ...prev.variable_costs, ...(json.data.assumptions.variable_costs || {}) },
          startup_costs: { ...prev.startup_costs, ...(json.data.assumptions.startup_costs || {}) },
          funding: { ...prev.funding, ...(json.data.assumptions.funding || {}) },
          tax_and_other: { ...prev.tax_and_other, ...(json.data.assumptions.tax_and_other || {}) },
        }));
      }
    } catch (e) {
      console.warn('AI suggestions error:', e);
    } finally {
      setIsSuggestingAssumptions(false);
    }
  };

  // CSV Export for founders
  const handleExportCSV = () => {
    const headers = [
      'Month',
      'Starting Customers',
      'New Customers',
      'Churned Customers',
      'Ending Customers',
      'Gross Revenue',
      'Variable Costs',
      'Gross Profit',
      'Fixed Costs',
      'Operating Profit',
      'Net Profit',
      'Net Cash Flow',
      'Cash Balance',
      'Burn Rate',
      'Profitable',
    ];

    const rows = monthlyProjections.map(p => [
      p.month,
      p.starting_customers,
      p.new_customers,
      p.churned_customers,
      p.ending_customers,
      p.gross_revenue,
      p.variable_costs,
      p.gross_profit,
      p.fixed_costs,
      p.operating_profit,
      p.net_profit,
      p.net_cash_flow,
      p.cash_balance,
      p.burn_rate,
      p.is_profitable ? 'Yes' : 'No',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${idea.title.toLowerCase().replace(/\s+/g, '_')}_financial_projection_${periodMonths}m.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for updating nested assumptions
  const updateAssumption = <K extends keyof FinancialAssumptions>(
    category: K,
    field: keyof FinancialAssumptions[K],
    value: any
  ) => {
    setAssumptions(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as any),
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="financial-projection-tab">
      {/* 1. Header Toolbar & Simulation Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Financial Projection Simulator
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Live Deterministic Model
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dynamic unit economics, multi-scenario forecasting, cash runway, and capital requirement modeling.
              </p>
            </div>
          </div>

          {/* Controls: Currency, Period & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Currency Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700/60">
              {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map(currCode => (
                <button
                  key={currCode}
                  onClick={() => setCurrency(currCode)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    currency === currCode
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={SUPPORTED_CURRENCIES[currCode].label}
                >
                  {SUPPORTED_CURRENCIES[currCode].symbol} {currCode}
                </button>
              ))}
            </div>

            {/* Projection Period */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700/60">
              {([12, 24, 36, 60] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setPeriodMonths(period)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    periodMonths === period
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {period / 12}Y ({period}m)
                </button>
              ))}
            </div>

            {/* Save Button */}
            <button
              id="save-financial-projection-btn"
              onClick={handleSaveProjection}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Model'}</span>
            </button>

            {/* Reset to Defaults */}
            <button
              onClick={handleResetDefaults}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Reset assumptions to industry defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Save feedback indicator */}
        {saveStatus === 'saved' && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{saveMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Executive Metrics Summary Banner (8 Core Indicators) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Projected Total Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Projected Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(summaryMetrics.total_revenue_projection, currency, true)}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Year 1: {formatCurrency(summaryMetrics.total_revenue_year1, currency, true)}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              ARR: {formatCurrency(summaryMetrics.ending_arr, currency, true)}
            </span>
          </div>
        </div>

        {/* Metric 2: Total Projected Expenses */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Expenses</span>
            <Briefcase className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(summaryMetrics.total_expenses_projection, currency, true)}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Fixed & Variable</span>
            <span className="text-slate-600 dark:text-slate-300">
              Avg Burn: {formatCurrency(summaryMetrics.average_monthly_burn, currency, true)}/mo
            </span>
          </div>
        </div>

        {/* Metric 3: Net Profit / Loss */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cumulative Profit</span>
            {summaryMetrics.total_profit_projection >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            )}
          </div>
          <div
            className={`text-xl font-bold tracking-tight ${
              summaryMetrics.total_profit_projection >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(summaryMetrics.total_profit_projection, currency, true)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {summaryMetrics.total_profit_projection >= 0 ? 'Net Positive Cash Window' : 'Net Investment Period'}
          </div>
        </div>

        {/* Metric 4: Break-Even Month */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Break-Even Point</span>
            <Target className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {summaryMetrics.break_even_month ? `Month ${summaryMetrics.break_even_month}` : 'Not Reached'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {summaryMetrics.break_even_month
              ? `@ ${formatCurrency(summaryMetrics.break_even_revenue, currency, true)} monthly rev`
              : `Requires growth acceleration`}
          </div>
        </div>

        {/* Metric 5: Monthly Burn Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Monthly Burn Rate</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(summaryMetrics.peak_monthly_burn, currency, true)}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> (peak)</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Avg Burn: {formatCurrency(summaryMetrics.average_monthly_burn, currency, true)} / month
          </div>
        </div>

        {/* Metric 6: Estimated Runway */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cash Runway</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {typeof summaryMetrics.current_runway_months === 'number'
              ? `${summaryMetrics.current_runway_months} Months`
              : summaryMetrics.current_runway_months}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Based on current capital & burn
          </div>
        </div>

        {/* Metric 7: Minimum Cash Trough */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Lowest Cash Point</span>
            <Wallet className="w-3.5 h-3.5 text-violet-500" />
          </div>
          <div
            className={`text-xl font-bold tracking-tight ${
              summaryMetrics.minimum_cash_balance < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {formatCurrency(summaryMetrics.minimum_cash_balance, currency, true)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {summaryMetrics.minimum_cash_balance < 0
              ? `Deficit @ M${fundingAnalysis.month_of_lowest_cash}`
              : `Buffer remains positive`}
          </div>
        </div>

        {/* Metric 8: Suggested Total Capital */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Suggested Capital
            </span>
            <Coins className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-700 dark:text-indigo-300 tracking-tight">
            {formatCurrency(fundingAnalysis.total_capital_recommendation, currency, true)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Includes gap + 20-25% safety buffer
          </div>
        </div>
      </div>

      {/* 3. Interactive What-If Sensitivity Simulator (Real-Time Sliders) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Real-Time &ldquo;What-If&rdquo; Sensitivity Simulator
            </h4>
            {hasWhatIfOverrides && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 animate-pulse">
                Simulation Active
              </span>
            )}
          </div>
          {hasWhatIfOverrides && (
            <button
              onClick={resetWhatIf}
              className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sliders</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Slider 1: Price / ARPU Delta */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Pricing / ARPU</span>
              <span className={`font-bold ${whatIfPriceDelta > 0 ? 'text-emerald-600' : whatIfPriceDelta < 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                {whatIfPriceDelta > 0 ? `+${whatIfPriceDelta}%` : `${whatIfPriceDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="100"
              step="5"
              value={whatIfPriceDelta}
              onChange={e => setWhatIfPriceDelta(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-40%</span>
              <span>Effective: {formatCurrency(assumptions.pricing.average_price * (1 + whatIfPriceDelta / 100), currency)}</span>
              <span>+100%</span>
            </div>
          </div>

          {/* Slider 2: Customer Growth Rate Delta */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Customer Growth</span>
              <span className={`font-bold ${whatIfGrowthDelta > 0 ? 'text-emerald-600' : whatIfGrowthDelta < 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                {whatIfGrowthDelta > 0 ? `+${whatIfGrowthDelta}%` : `${whatIfGrowthDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={whatIfGrowthDelta}
              onChange={e => setWhatIfGrowthDelta(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-50%</span>
              <span>Rate: {((assumptions.customers.monthly_growth_rate || 8) * (1 + whatIfGrowthDelta / 100)).toFixed(1)}%/mo</span>
              <span>+100%</span>
            </div>
          </div>

          {/* Slider 3: Churn Rate Delta */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Monthly Churn</span>
              <span className={`font-bold ${whatIfChurnDelta < 0 ? 'text-emerald-600' : whatIfChurnDelta > 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                {whatIfChurnDelta > 0 ? `+${whatIfChurnDelta}%` : `${whatIfChurnDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={whatIfChurnDelta}
              onChange={e => setWhatIfChurnDelta(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-50% (better)</span>
              <span>Rate: {((assumptions.customers.monthly_churn_rate || 3) * (1 + whatIfChurnDelta / 100)).toFixed(1)}%/mo</span>
              <span>+100%</span>
            </div>
          </div>

          {/* Slider 4: Marketing Budget Multiplier */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Marketing Spend</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {whatIfMarketingMult.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={whatIfMarketingMult}
              onChange={e => setWhatIfMarketingMult(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0.5x</span>
              <span>{formatCurrency((assumptions.fixed_costs.marketing || 0) * whatIfMarketingMult, currency)}/mo</span>
              <span>2.5x</span>
            </div>
          </div>

          {/* Slider 5: Fixed Costs Multiplier */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Fixed Team/Ops</span>
              <span className={`font-bold ${whatIfFixedCostMult > 1 ? 'text-rose-600' : whatIfFixedCostMult < 1 ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>
                {whatIfFixedCostMult.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.8"
              step="0.1"
              value={whatIfFixedCostMult}
              onChange={e => setWhatIfFixedCostMult(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0.6x (leaner)</span>
              <span>Scaling overhead</span>
              <span>1.8x</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Visual Projections Interactive Charts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Dynamic Projection Visualizer
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Month-by-month trajectory over {periodMonths} months based on active simulation inputs.
            </p>
          </div>

          {/* Chart View Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setActiveChartTab('pnl')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeChartTab === 'pnl'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Revenue & Profit
            </button>
            <button
              onClick={() => setActiveChartTab('cash')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeChartTab === 'cash'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cash Balance & Trough
            </button>
            <button
              onClick={() => setActiveChartTab('customers')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeChartTab === 'customers'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Customer Growth
            </button>
            <button
              onClick={() => setActiveChartTab('costs')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeChartTab === 'costs'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cost Breakdown
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            {activeChartTab === 'pnl' ? (
              <LineChart data={monthlyProjections} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={val => formatCurrency(val, currency, true)}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val), currency)}
                  labelFormatter={label => `${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="gross_revenue"
                  name="Gross Revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="total_expenses"
                  name="Total Expenses"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="net_profit"
                  name="Net Profit / Loss"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            ) : activeChartTab === 'cash' ? (
              <AreaChart data={monthlyProjections} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={val => formatCurrency(val, currency, true)}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val), currency)}
                  labelFormatter={label => `${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="cash_balance"
                  name="Cash Balance"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cashGrad)"
                />
                <Line
                  type="monotone"
                  dataKey="burn_rate"
                  name="Monthly Cash Burn"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            ) : activeChartTab === 'customers' ? (
              <LineChart data={monthlyProjections} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={val => val.toLocaleString()} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => Number(val).toLocaleString()}
                  labelFormatter={label => `${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="ending_customers"
                  name="Total Active Customers"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="new_customers"
                  name="Monthly New Customers"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="churned_customers"
                  name="Monthly Churned"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            ) : (
              <BarChart data={monthlyProjections} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={val => formatCurrency(val, currency, true)}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val), currency)}
                  labelFormatter={label => `${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="salaries_cost" name="Salaries & Team" fill="#6366f1" stackId="costs" />
                <Bar dataKey="marketing_cost" name="Marketing" fill="#ec4899" stackId="costs" />
                <Bar dataKey="operations_cost" name="Operations & Tools" fill="#f59e0b" stackId="costs" />
                <Bar dataKey="variable_costs" name="Variable Unit Costs" fill="#14b8a6" stackId="costs" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Unit Economics & Funding Analysis (Dual Module) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module A: Unit Economics */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Unit Economics & Efficiency
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Per-customer sustainability
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* CAC */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Customer Acq. Cost (CAC)</span>
                <span title="Total Marketing Spend / Total New Customers" className="cursor-help">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {unitEconomics.cac ? formatCurrency(unitEconomics.cac, currency) : 'Insufficient Data'}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Marketing acquisition cost per paid user
              </p>
            </div>

            {/* LTV */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Lifetime Value (LTV)</span>
                <span title="(ARPU × Gross Margin %) / Monthly Churn Rate" className="cursor-help">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {unitEconomics.ltv ? formatCurrency(unitEconomics.ltv, currency) : 'Insufficient Data'}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Expected cumulative gross contribution
              </p>
            </div>

            {/* LTV : CAC Ratio */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>LTV : CAC Ratio</span>
                <span title="Benchmark: 3.0x+ is healthy for venture scale" className="cursor-help">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {unitEconomics.ltv_cac_ratio ? `${unitEconomics.ltv_cac_ratio}x` : 'N/A'}
                </span>
                {unitEconomics.ltv_cac_ratio && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      unitEconomics.ltv_cac_ratio >= 3
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : unitEconomics.ltv_cac_ratio >= 1.5
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {unitEconomics.ltv_cac_ratio >= 3
                      ? 'Healthy'
                      : unitEconomics.ltv_cac_ratio >= 1.5
                      ? 'Moderate'
                      : 'Under Pressure'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Target benchmark: 3.0x to 5.0x
              </p>
            </div>

            {/* Payback Period */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>CAC Payback Period</span>
                <span title="Months to recover CAC: CAC / (ARPU × Gross Margin %)" className="cursor-help">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {unitEconomics.payback_period_months
                  ? `${unitEconomics.payback_period_months} Months`
                  : 'N/A'}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Ideal window: &lt; 12 months
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                Average Gross Margin: {unitEconomics.gross_margin_pct}%
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                ARPU: {formatCurrency(unitEconomics.arpu, currency)}/mo
              </span>
            </div>
          </div>
        </div>

        {/* Module B: Funding Requirement & Runway Analysis */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Capital Runway & Funding Analysis
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Working capital risk
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Initial Capital Available</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(fundingAnalysis.initial_capital_available, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Startup & Launch Setup Costs</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                - {formatCurrency(fundingAnalysis.startup_setup_costs, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Net Starting Working Capital</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(fundingAnalysis.net_starting_capital, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Minimum Cash Trough (Lowest Dip)</span>
              <span
                className={`font-bold ${
                  fundingAnalysis.minimum_cash_trough < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatCurrency(fundingAnalysis.minimum_cash_trough, currency)} (Month {fundingAnalysis.month_of_lowest_cash})
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Suggested Safety Buffer (+20-25%)</span>
              <span className="font-bold text-slate-900 dark:text-white">
                + {formatCurrency(fundingAnalysis.suggested_buffer, currency)}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Recommended Total Capital Target
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    {fundingAnalysis.estimated_funding_gap > 0
                      ? 'External investment or grant capital needed to avoid insolvency.'
                      : 'Founder capital is sufficient to sustain operations until self-funding.'}
                  </div>
                </div>
                <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(fundingAnalysis.total_capital_recommendation, currency)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Multi-Scenario Comparison (Conservative vs Base vs Optimistic) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Multi-Scenario Stress Test & Comparison
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparing outcomes under slower adoption, baseline plans, and breakout product-market fit.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Conservative */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                1. Conservative Case
              </span>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-semibold">
                -30% Growth / +35% Churn
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              {scenarios.conservative.description}
            </p>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Revenue:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(scenarios.conservative.total_revenue, currency, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Break-Even Month:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {scenarios.conservative.break_even_month
                    ? `Month ${scenarios.conservative.break_even_month}`
                    : 'Not reached in window'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ending Cash Balance:</span>
                <span
                  className={`font-bold ${
                    scenarios.conservative.ending_cash_balance < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {formatCurrency(scenarios.conservative.ending_cash_balance, currency, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ending Customers:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {scenarios.conservative.ending_customers.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Base Case */}
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border-2 border-indigo-500/40 dark:border-indigo-500/30 space-y-2.5 relative">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                2. Base Case (Current)
              </span>
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-semibold">
                Founder Model
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              {scenarios.base.description}
            </p>
            <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800/60 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Revenue:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(scenarios.base.total_revenue, currency, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Break-Even Month:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {scenarios.base.break_even_month
                    ? `Month ${scenarios.base.break_even_month}`
                    : 'Not reached in window'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ending Cash Balance:</span>
                <span
                  className={`font-bold ${
                    scenarios.base.ending_cash_balance < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {formatCurrency(scenarios.base.ending_cash_balance, currency, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ending Customers:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {scenarios.base.ending_customers.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Optimistic Case */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                3. Optimistic Case
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-semibold">
                +30% Growth / -25% Churn
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              {scenarios.optimistic.description}
            </p>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Revenue:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(scenarios.optimistic.total_revenue, currency, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Break-Even Month:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {scenarios.optimistic.break_even_month
                    ? `Month ${scenarios.optimistic.break_even_month}`
                    : 'Not reached'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ending Cash Balance:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(scenarios.optimistic.ending_cash_balance, currency, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ending Customers:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {scenarios.optimistic.ending_customers.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Comprehensive Model Assumptions Configuration Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              Model Assumptions & Financial Levers
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize core pricing, customer retention, fixed team burn, and startup capital parameters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSuggestAssumptionsWithAi}
              disabled={isSuggestingAssumptions}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSuggestingAssumptions ? 'Analyzing Model...' : 'Suggest with AI'}</span>
            </button>
          </div>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {[
            { id: 'pricing_customers', label: '1. Pricing & Customers', icon: Users },
            { id: 'revenue', label: '2. Revenue Levers', icon: DollarSign },
            { id: 'fixed_costs', label: '3. Fixed Monthly Burn', icon: Briefcase },
            { id: 'variable_costs', label: '4. Variable Costs', icon: Percent },
            { id: 'startup_capital', label: '5. Startup Setup & Capital', icon: Wallet },
          ].map(sec => {
            const Icon = sec.icon;
            const isSelected = expandedSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setExpandedSection(sec.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Section 1: Pricing & Customers */}
        {expandedSection === 'pricing_customers' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business Model Type
              </label>
              <select
                value={assumptions.business_model}
                onChange={e =>
                  setAssumptions(prev => ({ ...prev, business_model: e.target.value as BusinessModelType }))
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                <option value="SaaS">SaaS (Software-as-a-Service)</option>
                <option value="Marketplace">Marketplace (Take-rate / Commission)</option>
                <option value="Subscription">Subscription</option>
                <option value="E-commerce">E-commerce / D2C</option>
                <option value="Service">Professional Service / Agency</option>
                <option value="Freemium">Freemium</option>
                <option value="Advertising">Advertising / Media</option>
                <option value="Transaction-based">Transaction-based</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Average Price / ARPU ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.pricing.average_price}
                onChange={e => updateAssumption('pricing', 'average_price', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Billing Frequency
              </label>
              <select
                value={assumptions.pricing.billing_period}
                onChange={e => updateAssumption('pricing', 'billing_period', e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                <option value="Monthly">Monthly Recurring</option>
                <option value="Annual">Annual (Recognized over 12m)</option>
                <option value="One-time">One-time / Transactional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Starting Customers (Month 1)
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.customers.starting_customers}
                onChange={e => updateAssumption('customers', 'starting_customers', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monthly New Customers (Base organic)
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.customers.monthly_new_customers}
                onChange={e => updateAssumption('customers', 'monthly_new_customers', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Customer Growth Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={assumptions.customers.monthly_growth_rate}
                onChange={e => updateAssumption('customers', 'monthly_growth_rate', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Churn Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="90"
                step="0.5"
                value={assumptions.customers.monthly_churn_rate}
                onChange={e => updateAssumption('customers', 'monthly_churn_rate', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Section 2: Revenue Levers */}
        {expandedSection === 'revenue' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Revenue per Transaction ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.revenue.revenue_per_transaction}
                onChange={e => updateAssumption('revenue', 'revenue_per_transaction', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">E.g. Take-rate commission or booking fee</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Additional Monthly Revenue ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.revenue.additional_monthly_revenue}
                onChange={e => updateAssumption('revenue', 'additional_monthly_revenue', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">Job board sponsorships, ads, premium services</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Additional Revenue Growth (% / mo)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={assumptions.revenue.monthly_revenue_growth_rate}
                onChange={e => updateAssumption('revenue', 'monthly_revenue_growth_rate', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Section 3: Fixed Monthly Costs */}
        {expandedSection === 'fixed_costs' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Team Salaries & Stipends ({currency}/mo)
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.fixed_costs.salaries}
                onChange={e => updateAssumption('fixed_costs', 'salaries', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Software Tools & Hosting ({currency}/mo)
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.fixed_costs.software_tools}
                onChange={e => updateAssumption('fixed_costs', 'software_tools', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marketing & CAC Budget ({currency}/mo)
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.fixed_costs.marketing}
                onChange={e => updateAssumption('fixed_costs', 'marketing', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Office & Co-Working ({currency}/mo)
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.fixed_costs.office_infrastructure}
                onChange={e => updateAssumption('fixed_costs', 'office_infrastructure', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                General Operations & Admin ({currency}/mo)
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.fixed_costs.operations}
                onChange={e => updateAssumption('fixed_costs', 'operations', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Other Recurring Overhead ({currency}/mo)
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.fixed_costs.other}
                onChange={e => updateAssumption('fixed_costs', 'other', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Section 4: Variable Unit Costs */}
        {expandedSection === 'variable_costs' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cost per Active Customer ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.variable_costs.cost_per_customer}
                onChange={e => updateAssumption('variable_costs', 'cost_per_customer', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">Cloud compute, AI tokens, verification fees</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Gateway Fee (%)
              </label>
              <input
                type="number"
                min="0"
                max="15"
                step="0.1"
                value={assumptions.variable_costs.payment_processing_pct}
                onChange={e => updateAssumption('variable_costs', 'payment_processing_pct', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">Razorpay / Stripe standard 2.0% - 2.9%</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cost per Transaction ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.variable_costs.cost_per_transaction}
                onChange={e => updateAssumption('variable_costs', 'cost_per_transaction', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">Fulfillment or escrow processing</span>
            </div>
          </div>
        )}

        {/* Section 5: Startup Setup & Capital */}
        {expandedSection === 'startup_capital' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Capital Available ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.funding.initial_capital}
                onChange={e => updateAssumption('funding', 'initial_capital', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-bold"
              />
              <span className="text-[10px] text-slate-400">Founder savings, angel capital, grant</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial MVP Development ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.startup_costs.initial_development}
                onChange={e => updateAssumption('startup_costs', 'initial_development', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Launch Marketing ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.startup_costs.initial_marketing}
                onChange={e => updateAssumption('startup_costs', 'initial_marketing', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Legal & Company Incorporation ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.startup_costs.legal_registration}
                onChange={e => updateAssumption('startup_costs', 'legal_registration', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Equipment & Workstations ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={assumptions.startup_costs.equipment_setup}
                onChange={e => updateAssumption('startup_costs', 'equipment_setup', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Effective Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="40"
                value={assumptions.tax_and_other.tax_rate_pct}
                onChange={e => updateAssumption('tax_and_other', 'tax_rate_pct', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* 8. AI Financial Strategic Review & Commentary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Strategic Financial Review & CFO Insights
            </h4>
          </div>
          <button
            id="generate-ai-financial-insights-btn"
            onClick={handleGenerateAiInsights}
            disabled={isGeneratingAi}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            {isGeneratingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isGeneratingAi ? 'Analyzing Projections...' : aiInsights ? 'Regenerate Insights' : 'Generate AI Review'}</span>
          </button>
        </div>

        {aiInsights ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {aiInsights.financial_summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Key Drivers */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Key Revenue Drivers</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  {aiInsights.key_drivers.map((kd, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{kd}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Financial Risks */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Financial Vulnerabilities</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  {aiInsights.financial_risks.map((fr, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{fr}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvement Opportunities */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                  <Target className="w-3.5 h-3.5" />
                  <span>Capital Optimizations</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  {aiInsights.improvement_opportunities.map((io, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{io}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {aiInsights.strategic_takeaway && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">Founder Takeaway:</span>
                <span>{aiInsights.strategic_takeaway}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-500 dark:text-slate-400">
            <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs">
              Generate AI executive analysis grounded in your deterministic simulation numbers.
            </p>
          </div>
        )}
      </div>

      {/* 9. Month-by-Month Detailed Financial Ledger & CSV Export */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Month-by-Month Financial Ledger ({periodMonths} Months)
            </h4>
            <span className="text-[11px] text-slate-400">
              {monthlyProjections.length} periods calculated
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setShowTable(!showTable)}
              className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold px-2 py-1"
            >
              {showTable ? (
                <>
                  <span>Collapse Ledger</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Expand Ledger</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {showTable && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Customers</th>
                  <th className="py-2.5 px-3">Gross Revenue</th>
                  <th className="py-2.5 px-3">Variable Costs</th>
                  <th className="py-2.5 px-3">Fixed Costs</th>
                  <th className="py-2.5 px-3">Net Profit</th>
                  <th className="py-2.5 px-3">Cash Balance</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {monthlyProjections.map(p => (
                  <tr
                    key={p.month}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      p.month === summaryMetrics.break_even_month
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 font-medium'
                        : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                      M{p.month}
                      {p.month === summaryMetrics.break_even_month && (
                        <span className="ml-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          [Break-even]
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">{p.ending_customers.toLocaleString()}</td>
                    <td className="py-2 px-3 font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.gross_revenue, currency)}
                    </td>
                    <td className="py-2 px-3 text-slate-500">{formatCurrency(p.variable_costs, currency)}</td>
                    <td className="py-2 px-3 text-slate-500">{formatCurrency(p.fixed_costs, currency)}</td>
                    <td
                      className={`py-2 px-3 font-medium ${
                        p.net_profit >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(p.net_profit, currency)}
                    </td>
                    <td
                      className={`py-2 px-3 font-bold ${
                        p.cash_balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {formatCurrency(p.cash_balance, currency)}
                    </td>
                    <td className="py-2 px-3">
                      {p.is_profitable ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Profitable
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Burn {formatCurrency(p.burn_rate, currency)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
