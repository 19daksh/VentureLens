import {
  BusinessModelType,
  FinancialAssumptions,
} from '../types/financialProjection';
import { StartupIdea } from '../types/analysis';

/**
 * Derives a BusinessModelType enum from arbitrary business model text
 */
export function detectBusinessModelType(rawModel?: string): BusinessModelType {
  if (!rawModel) return 'SaaS';
  const text = rawModel.toLowerCase();

  if (text.includes('marketplace')) return 'Marketplace';
  if (text.includes('saas') || text.includes('software as a service')) return 'SaaS';
  if (text.includes('subscription')) return 'Subscription';
  if (text.includes('e-commerce') || text.includes('ecommerce') || text.includes('dtc')) return 'E-commerce';
  if (text.includes('service') || text.includes('agency') || text.includes('consulting')) return 'Service';
  if (text.includes('freemium')) return 'Freemium';
  if (text.includes('advertising') || text.includes('ad-supported')) return 'Advertising';
  if (text.includes('transaction') || text.includes('take rate') || text.includes('commission')) return 'Transaction-based';

  return 'SaaS';
}

/**
 * Generates sensible default assumptions based on the startup's analysis and market context
 */
export function generateDefaultAssumptions(idea?: StartupIdea | null): FinancialAssumptions {
  const rawModel = idea?.analysis?.business_model?.recommended_business_model;
  const detectedModel = detectBusinessModelType(rawModel);

  const title = (idea?.title || '').toLowerCase();
  const desc = (idea?.description || '').toLowerCase();
  const industry = (idea?.industry || '').toLowerCase();

  // Check if it's the college student/internship platform or student focused
  const isStudentPlatform =
    title.includes('internship') ||
    desc.includes('college') ||
    desc.includes('student') ||
    industry.includes('edtech');

  // Baseline defaults
  if (isStudentPlatform) {
    return {
      business_model: 'Marketplace',
      pricing: {
        average_price: 500, // ₹500/mo subscription or placement fee
        billing_period: 'Monthly',
      },
      customers: {
        starting_customers: 100,
        monthly_new_customers: 25,
        monthly_growth_rate: 8, // 8% monthly growth
        monthly_churn_rate: 3, // 3% monthly churn
        transactions_per_customer: 1,
      },
      revenue: {
        revenue_per_transaction: 250, // Marketplace match fee
        additional_monthly_revenue: 10000, // Campus job board placement / recruitment ads
        monthly_revenue_growth_rate: 5,
      },
      fixed_costs: {
        salaries: 100000, // Developer + Campus Community Lead
        software_tools: 15000, // Cloud hosting, Gemini API, DB
        office_infrastructure: 10000, // Co-working / remote stipend
        marketing: 15000, // Campus ambassadors, student discord marketing
        operations: 10000, // Background checks & verification
        other: 0,
      },
      variable_costs: {
        cost_per_customer: 100, // Server AI tokens, candidate verifications
        cost_per_transaction: 25,
        payment_processing_pct: 2.5,
        other_variable_pct: 1.5,
      },
      startup_costs: {
        initial_development: 150000,
        initial_marketing: 50000,
        equipment_setup: 30000,
        legal_registration: 20000,
        other_initial: 10000,
      },
      funding: {
        initial_capital: 1000000, // ₹10 Lakhs seed capital
        additional_funding_required: 0,
      },
      tax_and_other: {
        tax_rate_pct: 25,
        other_recurring: 0,
      },
    };
  }

  // Model-specific defaults for generic startups
  switch (detectedModel) {
    case 'Marketplace':
      return {
        business_model: 'Marketplace',
        pricing: {
          average_price: 1500,
          billing_period: 'Monthly',
        },
        customers: {
          starting_customers: 50,
          monthly_new_customers: 15,
          monthly_growth_rate: 10,
          monthly_churn_rate: 4,
          transactions_per_customer: 2,
        },
        revenue: {
          revenue_per_transaction: 400,
          additional_monthly_revenue: 5000,
          monthly_revenue_growth_rate: 4,
        },
        fixed_costs: {
          salaries: 150000,
          software_tools: 20000,
          office_infrastructure: 15000,
          marketing: 25000,
          operations: 15000,
          other: 5000,
        },
        variable_costs: {
          cost_per_customer: 80,
          cost_per_transaction: 40,
          payment_processing_pct: 2.5,
          other_variable_pct: 2,
        },
        startup_costs: {
          initial_development: 200000,
          initial_marketing: 75000,
          equipment_setup: 30000,
          legal_registration: 25000,
          other_initial: 10000,
        },
        funding: {
          initial_capital: 1200000,
          additional_funding_required: 0,
        },
        tax_and_other: {
          tax_rate_pct: 25,
          other_recurring: 0,
        },
      };

    case 'E-commerce':
      return {
        business_model: 'E-commerce',
        pricing: {
          average_price: 2200,
          billing_period: 'One-time',
        },
        customers: {
          starting_customers: 80,
          monthly_new_customers: 40,
          monthly_growth_rate: 7,
          monthly_churn_rate: 8,
          transactions_per_customer: 1.2,
        },
        revenue: {
          revenue_per_transaction: 2200,
          additional_monthly_revenue: 0,
          monthly_revenue_growth_rate: 5,
        },
        fixed_costs: {
          salaries: 120000,
          software_tools: 15000,
          office_infrastructure: 20000,
          marketing: 35000,
          operations: 20000,
          other: 5000,
        },
        variable_costs: {
          cost_per_customer: 600, // COGS / packaging
          cost_per_transaction: 150, // Shipping
          payment_processing_pct: 2.9,
          other_variable_pct: 3,
        },
        startup_costs: {
          initial_development: 100000,
          initial_marketing: 100000,
          equipment_setup: 50000,
          legal_registration: 20000,
          other_initial: 30000,
        },
        funding: {
          initial_capital: 1000000,
          additional_funding_required: 0,
        },
        tax_and_other: {
          tax_rate_pct: 25,
          other_recurring: 0,
        },
      };

    case 'Service':
      return {
        business_model: 'Service',
        pricing: {
          average_price: 25000,
          billing_period: 'Monthly',
        },
        customers: {
          starting_customers: 5,
          monthly_new_customers: 2,
          monthly_growth_rate: 6,
          monthly_churn_rate: 2,
          transactions_per_customer: 1,
        },
        revenue: {
          revenue_per_transaction: 0,
          additional_monthly_revenue: 15000,
          monthly_revenue_growth_rate: 3,
        },
        fixed_costs: {
          salaries: 120000,
          software_tools: 15000,
          office_infrastructure: 15000,
          marketing: 20000,
          operations: 10000,
          other: 5000,
        },
        variable_costs: {
          cost_per_customer: 3000,
          cost_per_transaction: 0,
          payment_processing_pct: 2.0,
          other_variable_pct: 2,
        },
        startup_costs: {
          initial_development: 50000,
          initial_marketing: 40000,
          equipment_setup: 30000,
          legal_registration: 20000,
          other_initial: 10000,
        },
        funding: {
          initial_capital: 800000,
          additional_funding_required: 0,
        },
        tax_and_other: {
          tax_rate_pct: 25,
          other_recurring: 0,
        },
      };

    case 'SaaS':
    default:
      return {
        business_model: 'SaaS',
        pricing: {
          average_price: 999, // ₹999/mo standard SaaS
          billing_period: 'Monthly',
        },
        customers: {
          starting_customers: 40,
          monthly_new_customers: 15,
          monthly_growth_rate: 9,
          monthly_churn_rate: 3.5,
          transactions_per_customer: 1,
        },
        revenue: {
          revenue_per_transaction: 0,
          additional_monthly_revenue: 5000,
          monthly_revenue_growth_rate: 5,
        },
        fixed_costs: {
          salaries: 150000,
          software_tools: 25000,
          office_infrastructure: 10000,
          marketing: 30000,
          operations: 10000,
          other: 5000,
        },
        variable_costs: {
          cost_per_customer: 60,
          cost_per_transaction: 0,
          payment_processing_pct: 2.8,
          other_variable_pct: 1.5,
        },
        startup_costs: {
          initial_development: 180000,
          initial_marketing: 60000,
          equipment_setup: 30000,
          legal_registration: 20000,
          other_initial: 10000,
        },
        funding: {
          initial_capital: 1000000,
          additional_funding_required: 0,
        },
        tax_and_other: {
          tax_rate_pct: 25,
          other_recurring: 0,
        },
      };
  }
}
