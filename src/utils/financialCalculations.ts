import {
  CurrencyCode,
  FinancialAssumptions,
  FinancialProjectionRecord,
  FinancialSummaryMetrics,
  FundingAnalysis,
  MonthlyProjectionPoint,
  ScenarioComparison,
  ScenarioSummary,
  SUPPORTED_CURRENCIES,
  UnitEconomics,
} from '../types/financialProjection';

export interface CalculationMultipliers {
  customerGrowth?: number;
  churn?: number;
  price?: number;
  fixedCosts?: number;
  marketing?: number;
  operatingCosts?: number;
  variableCosts?: number;
}

/**
 * Format numbers as localized currency
 */
export function formatCurrency(
  value: number,
  currency: CurrencyCode = 'INR',
  compact: boolean = false
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return `${SUPPORTED_CURRENCIES[currency]?.symbol || '₹'}0`;
  }

  const symbol = SUPPORTED_CURRENCIES[currency]?.symbol || '₹';
  const isNegative = value < 0;
  const abs = Math.abs(value);

  if (compact) {
    if (currency === 'INR') {
      if (abs >= 10000000) {
        return `${isNegative ? '-' : ''}${symbol}${(abs / 10000000).toFixed(1)}Cr`;
      }
      if (abs >= 100000) {
        return `${isNegative ? '-' : ''}${symbol}${(abs / 100000).toFixed(1)}L`;
      }
      if (abs >= 1000) {
        return `${isNegative ? '-' : ''}${symbol}${(abs / 1000).toFixed(1)}K`;
      }
      return `${isNegative ? '-' : ''}${symbol}${Math.round(abs)}`;
    } else {
      if (abs >= 1000000000) {
        return `${isNegative ? '-' : ''}${symbol}${(abs / 1000000000).toFixed(1)}B`;
      }
      if (abs >= 1000000) {
        return `${isNegative ? '-' : ''}${symbol}${(abs / 1000000).toFixed(1)}M`;
      }
      if (abs >= 1000) {
        return `${isNegative ? '-' : ''}${symbol}${(abs / 1000).toFixed(1)}K`;
      }
      return `${isNegative ? '-' : ''}${symbol}${Math.round(abs)}`;
    }
  }

  // Standard non-compact formatting
  const formattedNumber = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(Math.round(abs));

  return `${isNegative ? '-' : ''}${symbol}${formattedNumber}`;
}

export function formatPercent(value: number, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculates monthly projections deterministically
 */
export function calculateMonthlyProjections(
  assumptions: FinancialAssumptions,
  periodMonths: 12 | 24 | 36 | 60 = 36,
  multipliers?: CalculationMultipliers
): MonthlyProjectionPoint[] {
  const points: MonthlyProjectionPoint[] = [];

  const growthMult = multipliers?.customerGrowth ?? 1;
  const churnMult = multipliers?.churn ?? 1;
  const priceMult = multipliers?.price ?? 1;
  const fixedMult = multipliers?.fixedCosts ?? 1;
  const mktgMult = multipliers?.marketing ?? 1;
  const opsMult = multipliers?.operatingCosts ?? 1;
  const varMult = multipliers?.variableCosts ?? 1;

  // Initial startup capital & costs
  const startupCosts =
    (assumptions.startup_costs?.initial_development || 0) +
    (assumptions.startup_costs?.initial_marketing || 0) +
    (assumptions.startup_costs?.equipment_setup || 0) +
    (assumptions.startup_costs?.legal_registration || 0) +
    (assumptions.startup_costs?.other_initial || 0);

  const initialCapital =
    (assumptions.funding?.initial_capital || 0) +
    (assumptions.funding?.additional_funding_required || 0);

  let currentCashBalance = initialCapital - startupCosts;
  let previousEndingCustomers = assumptions.customers?.starting_customers || 0;

  for (let m = 1; m <= periodMonths; m++) {
    const isFirstMonth = m === 1;

    // Customer dynamics
    const startingCust = isFirstMonth
      ? assumptions.customers?.starting_customers || 0
      : previousEndingCustomers;

    const baseGrowthRate = (assumptions.customers?.monthly_growth_rate || 0) / 100;
    const effectiveGrowthRate = baseGrowthRate * growthMult;

    const baseNew = assumptions.customers?.monthly_new_customers || 0;
    const effectiveNewBase = Math.round(baseNew * growthMult);

    // New customers = base incoming new + compounded growth from existing base
    const newFromGrowth = Math.round(startingCust * effectiveGrowthRate);
    const newCust = Math.max(0, effectiveNewBase + newFromGrowth);

    const baseChurnRate = (assumptions.customers?.monthly_churn_rate || 0) / 100;
    const effectiveChurnRate = Math.min(0.95, Math.max(0, baseChurnRate * churnMult));
    const churnedCust = Math.round(startingCust * effectiveChurnRate);

    const endingCust = Math.max(0, startingCust + newCust - churnedCust);
    previousEndingCustomers = endingCust;

    // Pricing & Revenue
    const rawPrice = assumptions.pricing?.average_price || 0;
    const unitPrice = Math.max(0, rawPrice * priceMult);
    const billingPeriod = assumptions.pricing?.billing_period || 'Monthly';

    let subscriptionRev = 0;
    if (billingPeriod === 'Annual') {
      subscriptionRev = endingCust * (unitPrice / 12);
    } else if (billingPeriod === 'One-time') {
      subscriptionRev = newCust * unitPrice;
    } else {
      subscriptionRev = endingCust * unitPrice;
    }

    const txPerCust = Math.max(0, assumptions.customers?.transactions_per_customer || 1);
    const totalTransactions = Math.round(endingCust * txPerCust);
    const txPrice = (assumptions.revenue?.revenue_per_transaction || 0) * priceMult;
    const transactionRev = totalTransactions * txPrice;

    const baseAdditionalRev = assumptions.revenue?.additional_monthly_revenue || 0;
    const addRevGrowth = (assumptions.revenue?.monthly_revenue_growth_rate || 0) / 100;
    const additionalRev = baseAdditionalRev * Math.pow(1 + addRevGrowth, m - 1);

    const grossRev = subscriptionRev + transactionRev + additionalRev;

    // Variable Costs
    const costPerCust = (assumptions.variable_costs?.cost_per_customer || 0) * varMult;
    const costPerTx = (assumptions.variable_costs?.cost_per_transaction || 0) * varMult;
    const paymentProcessingPct = (assumptions.variable_costs?.payment_processing_pct || 0) / 100;
    const otherVarPct = (assumptions.variable_costs?.other_variable_pct || 0) / 100;

    const varCostCust = endingCust * costPerCust;
    const varCostTx = totalTransactions * costPerTx;
    const varCostPayment = grossRev * paymentProcessingPct;
    const varCostOther = grossRev * otherVarPct;
    const totalVarCosts = varCostCust + varCostTx + varCostPayment + varCostOther;

    // Gross Profit
    const grossProfit = grossRev - totalVarCosts;
    const grossMarginPct = grossRev > 0 ? (grossProfit / grossRev) * 100 : 0;

    // Fixed Costs
    const salaries = (assumptions.fixed_costs?.salaries || 0) * fixedMult;
    const software = (assumptions.fixed_costs?.software_tools || 0) * fixedMult;
    const office = (assumptions.fixed_costs?.office_infrastructure || 0) * fixedMult;
    const marketing = (assumptions.fixed_costs?.marketing || 0) * fixedMult * mktgMult;
    const operations = (assumptions.fixed_costs?.operations || 0) * fixedMult * opsMult;
    const otherFixed =
      (assumptions.fixed_costs?.other || 0) * fixedMult +
      (assumptions.tax_and_other?.other_recurring || 0);

    const totalFixedCosts = salaries + software + office + marketing + operations + otherFixed;
    const totalExpenses = totalVarCosts + totalFixedCosts;

    // Operating Profit
    const operatingProfit = grossRev - totalExpenses;

    // Tax Expense (applied only if operating profit is positive)
    const taxRate = (assumptions.tax_and_other?.tax_rate_pct || 0) / 100;
    const taxExpense = operatingProfit > 0 ? operatingProfit * taxRate : 0;
    const netProfit = operatingProfit - taxExpense;

    // Net Cash Flow & Balance
    const netCashFlow = netProfit;
    currentCashBalance += netCashFlow;

    const isProfitable = grossRev >= totalExpenses;
    const burnRate = netCashFlow < 0 ? Math.abs(netCashFlow) : 0;

    points.push({
      month: m,
      month_label: `Month ${m}`,
      starting_customers: startingCust,
      new_customers: newCust,
      churned_customers: churnedCust,
      ending_customers: endingCust,
      transactions: totalTransactions,
      subscription_revenue: Math.round(subscriptionRev),
      transaction_revenue: Math.round(transactionRev),
      additional_revenue: Math.round(additionalRev),
      gross_revenue: Math.round(grossRev),
      variable_costs: Math.round(totalVarCosts),
      gross_profit: Math.round(grossProfit),
      gross_margin_pct: Number(grossMarginPct.toFixed(1)),
      salaries_cost: Math.round(salaries),
      marketing_cost: Math.round(marketing),
      operations_cost: Math.round(operations),
      fixed_costs: Math.round(totalFixedCosts),
      total_expenses: Math.round(totalExpenses),
      operating_profit: Math.round(operatingProfit),
      tax_expense: Math.round(taxExpense),
      net_profit: Math.round(netProfit),
      net_cash_flow: Math.round(netCashFlow),
      cash_balance: Math.round(currentCashBalance),
      is_profitable: isProfitable,
      burn_rate: Math.round(burnRate),
    });
  }

  return points;
}

/**
 * Calculates high-level summary metrics from monthly projections
 */
export function calculateSummaryMetrics(
  projections: MonthlyProjectionPoint[],
  assumptions: FinancialAssumptions
): FinancialSummaryMetrics {
  if (!projections.length) {
    return {
      total_revenue_year1: 0,
      total_revenue_projection: 0,
      total_expenses_projection: 0,
      total_profit_projection: 0,
      ending_cash_balance: 0,
      break_even_month: null,
      break_even_revenue: 0,
      break_even_customers: 0,
      peak_monthly_burn: 0,
      average_monthly_burn: 0,
      current_runway_months: 'Critical (<1m)',
      minimum_cash_balance: 0,
      funding_gap: 0,
      suggested_funding_buffer: 0,
      ending_customers: 0,
      ending_mrr: 0,
      ending_arr: 0,
    };
  }

  const y1Months = projections.slice(0, Math.min(12, projections.length));
  const totalRevenueY1 = y1Months.reduce((sum, p) => sum + p.gross_revenue, 0);

  const totalRevenueProjection = projections.reduce((sum, p) => sum + p.gross_revenue, 0);
  const totalExpensesProjection = projections.reduce((sum, p) => sum + p.total_expenses, 0);
  const totalProfitProjection = projections.reduce((sum, p) => sum + p.net_profit, 0);

  const endingPoint = projections[projections.length - 1];
  const endingCashBalance = endingPoint.cash_balance;

  // Break-even month: First month where revenue >= total expenses
  const bePoint = projections.find((p) => p.is_profitable);
  const breakEvenMonth = bePoint ? bePoint.month : null;
  const breakEvenRevenue = bePoint ? bePoint.gross_revenue : 0;
  const breakEvenCustomers = bePoint ? bePoint.ending_customers : 0;

  // Burn rate calculations
  const burningMonths = projections.filter((p) => p.burn_rate > 0);
  const peakMonthlyBurn = burningMonths.length
    ? Math.max(...burningMonths.map((p) => p.burn_rate))
    : 0;
  const averageMonthlyBurn = burningMonths.length
    ? Math.round(burningMonths.reduce((sum, p) => sum + p.burn_rate, 0) / burningMonths.length)
    : 0;

  // Runway
  let currentRunwayMonths: number | 'Profitable' | 'Critical (<1m)';
  const firstMonth = projections[0];
  const firstMonthBurn = firstMonth.burn_rate;

  if (burningMonths.length === 0) {
    currentRunwayMonths = 'Profitable';
  } else {
    // Look for first month where cash balance drops <= 0
    const cashOutMonth = projections.findIndex((p) => p.cash_balance <= 0);
    if (cashOutMonth === 0) {
      currentRunwayMonths = 'Critical (<1m)';
    } else if (cashOutMonth > 0) {
      currentRunwayMonths = cashOutMonth;
    } else {
      // Cash never drops below zero during this projection window
      if (projections[projections.length - 1].is_profitable) {
        currentRunwayMonths = 'Profitable';
      } else {
        const remainingCash = Math.max(0, endingCashBalance);
        const lastBurn = projections[projections.length - 1].burn_rate || averageMonthlyBurn || 1;
        const additionalMonths = Math.round(remainingCash / lastBurn);
        currentRunwayMonths = projections.length + additionalMonths;
      }
    }
  }

  // Minimum cash balance (cash trough)
  const minimumCashBalance = Math.min(...projections.map((p) => p.cash_balance));
  const fundingGap = minimumCashBalance < 0 ? Math.abs(minimumCashBalance) : 0;

  // Suggested funding buffer: 20% on the funding gap + 3 months average fixed costs
  const avgFixed = projections.reduce((s, p) => s + p.fixed_costs, 0) / projections.length;
  const suggestedFundingBuffer = Math.round(fundingGap * 1.2 + (fundingGap > 0 ? avgFixed * 2 : 0));

  const endingMrr = endingPoint.subscription_revenue;
  const endingArr = endingMrr * 12;

  return {
    total_revenue_year1: totalRevenueY1,
    total_revenue_projection: totalRevenueProjection,
    total_expenses_projection: totalExpensesProjection,
    total_profit_projection: totalProfitProjection,
    ending_cash_balance: endingCashBalance,
    break_even_month: breakEvenMonth,
    break_even_revenue: breakEvenRevenue,
    break_even_customers: breakEvenCustomers,
    peak_monthly_burn: peakMonthlyBurn,
    average_monthly_burn: averageMonthlyBurn,
    current_runway_months: currentRunwayMonths,
    minimum_cash_balance: minimumCashBalance,
    funding_gap: fundingGap,
    suggested_funding_buffer: suggestedFundingBuffer,
    ending_customers: endingPoint.ending_customers,
    ending_mrr: endingMrr,
    ending_arr: endingArr,
  };
}

/**
 * Calculates Unit Economics (CAC, LTV, LTV:CAC, ARPU, Gross Margin %, Payback Period)
 */
export function calculateUnitEconomics(
  assumptions: FinancialAssumptions,
  projections: MonthlyProjectionPoint[]
): UnitEconomics {
  if (!projections.length) {
    return {
      cac: null,
      ltv: null,
      ltv_cac_ratio: null,
      arpu: 0,
      gross_margin_pct: 0,
      payback_period_months: null,
      is_calculable: false,
    };
  }

  // Monthly marketing spend & new customers in early months
  const sampleMonths = projections.slice(0, Math.min(6, projections.length));
  const totalMarketing = sampleMonths.reduce((s, p) => s + p.marketing_cost, 0);
  const totalNewCust = sampleMonths.reduce((s, p) => s + p.new_customers, 0);

  const cac = totalNewCust > 0 ? Math.round(totalMarketing / totalNewCust) : null;

  // ARPU
  const avgEndingCust = sampleMonths.reduce((s, p) => s + p.ending_customers, 0) / sampleMonths.length;
  const avgRev = sampleMonths.reduce((s, p) => s + p.gross_revenue, 0) / sampleMonths.length;
  const arpu = avgEndingCust > 0 ? Math.round(avgRev / avgEndingCust) : assumptions.pricing?.average_price || 0;

  // Gross margin
  const avgGrossMargin =
    sampleMonths.reduce((s, p) => s + p.gross_margin_pct, 0) / sampleMonths.length;
  const grossMarginPct = Number(avgGrossMargin.toFixed(1));

  // Monthly churn rate
  const monthlyChurnRate = (assumptions.customers?.monthly_churn_rate || 0) / 100;

  // LTV = ARPU * Gross Margin / Monthly Churn
  let ltv: number | null = null;
  if (monthlyChurnRate > 0 && arpu > 0) {
    ltv = Math.round((arpu * (grossMarginPct / 100)) / monthlyChurnRate);
  }

  // LTV:CAC Ratio
  let ltvCacRatio: number | null = null;
  if (ltv !== null && cac !== null && cac > 0) {
    ltvCacRatio = Number((ltv / cac).toFixed(1));
  }

  // Payback period = CAC / (ARPU * Gross Margin)
  let paybackPeriodMonths: number | null = null;
  const monthlyContributionMargin = arpu * (grossMarginPct / 100);
  if (cac !== null && monthlyContributionMargin > 0) {
    paybackPeriodMonths = Number((cac / monthlyContributionMargin).toFixed(1));
  }

  const isCalculable = cac !== null && arpu > 0;

  return {
    cac,
    ltv,
    ltv_cac_ratio: ltvCacRatio,
    arpu,
    gross_margin_pct: grossMarginPct,
    payback_period_months: paybackPeriodMonths,
    is_calculable: isCalculable,
  };
}

/**
 * Calculates three realistic scenarios (Conservative, Base, Optimistic)
 */
export function calculateScenarios(
  assumptions: FinancialAssumptions,
  periodMonths: 12 | 24 | 36 | 60 = 36
): ScenarioComparison {
  // BASE
  const baseProjections = calculateMonthlyProjections(assumptions, periodMonths);
  const baseSummary = calculateSummaryMetrics(baseProjections, assumptions);

  // OPTIMISTIC: +30% growth, -25% churn, +15% price, -10% fixed costs
  const optMultipliers: CalculationMultipliers = {
    customerGrowth: 1.3,
    churn: 0.75,
    price: 1.15,
    fixedCosts: 0.9,
    marketing: 1.1,
  };
  const optProjections = calculateMonthlyProjections(assumptions, periodMonths, optMultipliers);
  const optSummary = calculateSummaryMetrics(optProjections, assumptions);

  // CONSERVATIVE: -30% growth, +35% churn, -10% price, +15% fixed costs
  const conMultipliers: CalculationMultipliers = {
    customerGrowth: 0.7,
    churn: 1.35,
    price: 0.9,
    fixedCosts: 1.15,
    marketing: 0.85,
  };
  const conProjections = calculateMonthlyProjections(assumptions, periodMonths, conMultipliers);
  const conSummary = calculateSummaryMetrics(conProjections, assumptions);

  return {
    conservative: {
      name: 'Conservative',
      description: 'Slower adoption (-30% growth), higher customer churn (+35%), conservative pricing (-10%), and cost overruns (+15%).',
      total_revenue: conSummary.total_revenue_projection,
      ending_customers: conSummary.ending_customers,
      total_expenses: conSummary.total_expenses_projection,
      operating_profit: conSummary.total_profit_projection,
      break_even_month: conSummary.break_even_month,
      ending_cash_balance: conSummary.ending_cash_balance,
      multipliers: {
        customer_growth: 0.7,
        churn: 1.35,
        price: 0.9,
        fixed_cost: 1.15,
      },
    },
    base: {
      name: 'Base',
      description: 'Founder-defined model matching current target projections and planned pricing strategy.',
      total_revenue: baseSummary.total_revenue_projection,
      ending_customers: baseSummary.ending_customers,
      total_expenses: baseSummary.total_expenses_projection,
      operating_profit: baseSummary.total_profit_projection,
      break_even_month: baseSummary.break_even_month,
      ending_cash_balance: baseSummary.ending_cash_balance,
      multipliers: {
        customer_growth: 1.0,
        churn: 1.0,
        price: 1.0,
        fixed_cost: 1.0,
      },
    },
    optimistic: {
      name: 'Optimistic',
      description: 'Strong product-market fit (+30% growth), high retention (-25% churn), premium pricing (+15%), and lean operational scale.',
      total_revenue: optSummary.total_revenue_projection,
      ending_customers: optSummary.ending_customers,
      total_expenses: optSummary.total_expenses_projection,
      operating_profit: optSummary.total_profit_projection,
      break_even_month: optSummary.break_even_month,
      ending_cash_balance: optSummary.ending_cash_balance,
      multipliers: {
        customer_growth: 1.3,
        churn: 0.75,
        price: 1.15,
        fixed_cost: 0.9,
      },
    },
  };
}

/**
 * Calculates Funding Analysis & Cash Troughs
 */
export function calculateFundingAnalysis(
  projections: MonthlyProjectionPoint[],
  assumptions: FinancialAssumptions
): FundingAnalysis {
  const startupCosts =
    (assumptions.startup_costs?.initial_development || 0) +
    (assumptions.startup_costs?.initial_marketing || 0) +
    (assumptions.startup_costs?.equipment_setup || 0) +
    (assumptions.startup_costs?.legal_registration || 0) +
    (assumptions.startup_costs?.other_initial || 0);

  const initialCapital = assumptions.funding?.initial_capital || 0;
  const netStarting = initialCapital - startupCosts;

  let lowestCash = netStarting;
  let lowestMonth = 0;

  projections.forEach((p) => {
    if (p.cash_balance < lowestCash) {
      lowestCash = p.cash_balance;
      lowestMonth = p.month;
    }
  });

  const fundingGap = lowestCash < 0 ? Math.abs(lowestCash) : 0;
  // Buffer: 20% on funding gap, or 2 months of operational expenses if gap is 0
  const avgMonthlyExpenses =
    projections.reduce((s, p) => s + p.total_expenses, 0) / (projections.length || 1);
  const suggestedBuffer = Math.round(
    fundingGap > 0 ? fundingGap * 0.25 : avgMonthlyExpenses * 1.5
  );

  const totalCapitalRecommendation = fundingGap + suggestedBuffer;

  return {
    initial_capital_available: initialCapital,
    startup_setup_costs: startupCosts,
    net_starting_capital: netStarting,
    minimum_cash_trough: lowestCash,
    month_of_lowest_cash: lowestMonth,
    operating_cash_requirement: fundingGap,
    estimated_funding_gap: fundingGap,
    suggested_buffer: suggestedBuffer,
    total_capital_recommendation: totalCapitalRecommendation,
  };
}

/**
 * Builds the complete FinancialProjectionRecord from assumptions and calculation models
 */
export function buildFullProjectionRecord(
  analysisId: string,
  userId: string,
  assumptions: FinancialAssumptions,
  periodMonths: 12 | 24 | 36 | 60 = 36,
  currency: CurrencyCode = 'INR',
  id?: string
): FinancialProjectionRecord {
  const monthlyProjection = calculateMonthlyProjections(assumptions, periodMonths);
  const summaryMetrics = calculateSummaryMetrics(monthlyProjection, assumptions);
  const scenarios = calculateScenarios(assumptions, periodMonths);
  const unitEconomics = calculateUnitEconomics(assumptions, monthlyProjection);
  const fundingAnalysis = calculateFundingAnalysis(monthlyProjection, assumptions);

  const now = new Date().toISOString();

  return {
    id: id || crypto.randomUUID(),
    analysis_id: analysisId,
    user_id: userId,
    projection_period: periodMonths,
    currency,
    assumptions,
    monthly_projection: monthlyProjection,
    summary_metrics: summaryMetrics,
    scenarios,
    unit_economics: unitEconomics,
    funding_analysis: fundingAnalysis,
    created_at: now,
    updated_at: now,
  };
}
