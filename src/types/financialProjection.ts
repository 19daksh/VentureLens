export type BusinessModelType =
  | 'SaaS'
  | 'Marketplace'
  | 'Subscription'
  | 'E-commerce'
  | 'Service'
  | 'Freemium'
  | 'Advertising'
  | 'Transaction-based'
  | 'Other';

export type BillingPeriod = 'Monthly' | 'Annual' | 'One-time';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
  USD: { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  EUR: { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  GBP: { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
};

export interface PricingAssumptions {
  average_price: number;
  billing_period: BillingPeriod;
  annual_discount_pct?: number;
}

export interface CustomerAssumptions {
  starting_customers: number;
  monthly_new_customers: number;
  monthly_growth_rate: number; // percentage (e.g. 8 for 8%)
  monthly_churn_rate: number; // percentage (e.g. 3 for 3%)
  transactions_per_customer: number;
}

export interface RevenueAssumptions {
  revenue_per_transaction: number;
  additional_monthly_revenue: number;
  monthly_revenue_growth_rate: number; // percentage
}

export interface FixedCostAssumptions {
  salaries: number;
  software_tools: number;
  office_infrastructure: number;
  marketing: number;
  operations: number;
  other: number;
}

export interface VariableCostAssumptions {
  cost_per_customer: number;
  cost_per_transaction: number;
  payment_processing_pct: number; // percentage (e.g. 2.9)
  other_variable_pct: number; // percentage
}

export interface StartupCostAssumptions {
  initial_development: number;
  initial_marketing: number;
  equipment_setup: number;
  legal_registration: number;
  other_initial: number;
}

export interface FundingAssumptions {
  initial_capital: number;
  additional_funding_required: number;
}

export interface TaxAndOtherAssumptions {
  tax_rate_pct: number; // percentage (e.g. 25)
  other_recurring: number;
}

export interface FinancialAssumptions {
  business_model: BusinessModelType;
  pricing: PricingAssumptions;
  customers: CustomerAssumptions;
  revenue: RevenueAssumptions;
  fixed_costs: FixedCostAssumptions;
  variable_costs: VariableCostAssumptions;
  startup_costs: StartupCostAssumptions;
  funding: FundingAssumptions;
  tax_and_other: TaxAndOtherAssumptions;
}

export interface MonthlyProjectionPoint {
  month: number;
  month_label: string; // e.g. "Month 1", "M1"
  starting_customers: number;
  new_customers: number;
  churned_customers: number;
  ending_customers: number;
  transactions: number;
  subscription_revenue: number;
  transaction_revenue: number;
  additional_revenue: number;
  gross_revenue: number;
  variable_costs: number;
  gross_profit: number;
  gross_margin_pct: number;
  salaries_cost: number;
  marketing_cost: number;
  operations_cost: number;
  fixed_costs: number;
  total_expenses: number;
  operating_profit: number; // EBITDA / Operating Income
  tax_expense: number;
  net_profit: number;
  net_cash_flow: number;
  cash_balance: number;
  is_profitable: boolean;
  burn_rate: number;
}

export interface FinancialSummaryMetrics {
  total_revenue_year1: number;
  total_revenue_projection: number;
  total_expenses_projection: number;
  total_profit_projection: number;
  ending_cash_balance: number;
  break_even_month: number | null; // null if not reached within period
  break_even_revenue: number;
  break_even_customers: number;
  peak_monthly_burn: number;
  average_monthly_burn: number;
  current_runway_months: number | 'Profitable' | 'Critical (<1m)';
  minimum_cash_balance: number;
  funding_gap: number;
  suggested_funding_buffer: number;
  ending_customers: number;
  ending_mrr: number;
  ending_arr: number;
}

export interface UnitEconomics {
  cac: number | null; // Customer Acquisition Cost
  ltv: number | null; // Lifetime Value
  ltv_cac_ratio: number | null;
  arpu: number; // Average Revenue Per User
  gross_margin_pct: number;
  payback_period_months: number | null;
  is_calculable: boolean;
}

export interface ScenarioSummary {
  name: 'Conservative' | 'Base' | 'Optimistic';
  description: string;
  total_revenue: number;
  ending_customers: number;
  total_expenses: number;
  operating_profit: number;
  break_even_month: number | null;
  ending_cash_balance: number;
  multipliers: {
    customer_growth: number;
    churn: number;
    price: number;
    fixed_cost: number;
  };
}

export interface ScenarioComparison {
  conservative: ScenarioSummary;
  base: ScenarioSummary;
  optimistic: ScenarioSummary;
}

export interface FundingAnalysis {
  initial_capital_available: number;
  startup_setup_costs: number;
  net_starting_capital: number;
  minimum_cash_trough: number;
  month_of_lowest_cash: number;
  operating_cash_requirement: number;
  estimated_funding_gap: number;
  suggested_buffer: number;
  total_capital_recommendation: number;
}

export interface AiFinancialInsights {
  financial_summary: string;
  key_drivers: string[];
  financial_risks: string[];
  improvement_opportunities: string[];
  strategic_takeaway?: string;
  generated_at: string;
}

export interface FinancialProjectionRecord {
  id: string;
  analysis_id: string;
  user_id: string;
  projection_period: 12 | 24 | 36 | 60;
  currency: CurrencyCode;
  assumptions: FinancialAssumptions;
  monthly_projection: MonthlyProjectionPoint[];
  summary_metrics: FinancialSummaryMetrics;
  scenarios: ScenarioComparison;
  unit_economics: UnitEconomics;
  funding_analysis: FundingAnalysis;
  ai_insights?: AiFinancialInsights;
  created_at: string;
  updated_at: string;
}
