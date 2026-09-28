import { StartupIdea, FullAnalysis, RiskItem } from '../types/analysis';

export interface HealthWeights {
  market: number; // e.g. 40
  feasibility: number; // e.g. 35
  risk: number; // e.g. 25
}

export const DEFAULT_HEALTH_WEIGHTS: HealthWeights = {
  market: 40,
  feasibility: 35,
  risk: 25,
};

export const HEALTH_WEIGHT_PRESETS: { name: string; description: string; weights: HealthWeights }[] = [
  {
    name: 'Balanced Due Diligence',
    description: 'Equally balanced market growth, technical execution, and risk mitigation',
    weights: { market: 40, feasibility: 35, risk: 25 },
  },
  {
    name: 'VC / Hypergrowth',
    description: 'Heavily weights market opportunity, TAM expansion, and category demand',
    weights: { market: 55, feasibility: 25, risk: 20 },
  },
  {
    name: 'Bootstrapper / Solo Founder',
    description: 'Focuses on fast technical feasibility, low complexity, and swift execution',
    weights: { market: 30, feasibility: 50, risk: 20 },
  },
  {
    name: 'Risk-Defensive / Enterprise',
    description: 'Prioritizes downside protection, regulatory compliance, and risk containment',
    weights: { market: 25, feasibility: 35, risk: 40 },
  },
];

export interface PillarBreakdown {
  score: number; // 0 - 100
  weight: number; // percentage (e.g. 40)
  weightedContribution: number; // score * (weight / 100)
  status: 'excellent' | 'good' | 'moderate' | 'critical';
  label: string;
  subMetrics: {
    label: string;
    value: string | number;
    detail?: string;
  }[];
  keyInsights: string[];
}

export interface IdeaHealthScoreResult {
  overallHealthScore: number; // 0 - 100
  tier: {
    label: string;
    color: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    badgeClass: string;
    description: string;
  };
  marketPotential: PillarBreakdown;
  feasibility: PillarBreakdown;
  riskProfile: PillarBreakdown;
  weights: HealthWeights;
  healthCatalysts: string[];
  vulnerabilities: {
    issue: string;
    potentialScoreGain: number;
    recommendedMitigation: string;
  }[];
}

/**
 * Calculates Market Potential score (0-100) from analysis data
 */
export function calculateMarketPotential(analysis?: FullAnalysis): PillarBreakdown {
  if (!analysis) {
    return {
      score: 70,
      weight: DEFAULT_HEALTH_WEIGHTS.market,
      weightedContribution: 28,
      status: 'good',
      label: 'Market Potential',
      subMetrics: [
        { label: 'Market Opportunity', value: '70/100' },
        { label: 'Demand Fit', value: 'Moderate' },
      ],
      keyInsights: ['Awaiting detailed market data'],
    };
  }

  const oppScore = analysis.market_analysis?.market_opportunity_score ?? analysis.market_score ?? 70;
  const demandScore = analysis.market_analysis?.demand_score ?? oppScore;
  const problemScore = analysis.problem_score ?? 70;
  const revenueScore = analysis.revenue_score ?? oppScore;

  // Composite market potential
  const rawScore = Math.round(oppScore * 0.4 + demandScore * 0.25 + problemScore * 0.2 + revenueScore * 0.15);
  const score = Math.max(10, Math.min(99, rawScore));

  let status: PillarBreakdown['status'] = 'good';
  if (score >= 82) status = 'excellent';
  else if (score >= 68) status = 'good';
  else if (score >= 50) status = 'moderate';
  else status = 'critical';

  const subMetrics = [
    {
      label: 'Opportunity Index',
      value: `${oppScore}/100`,
      detail: analysis.market_analysis?.growth_potential || 'Market growth dynamics',
    },
    {
      label: 'Demand Urgency',
      value: `${demandScore}/100`,
      detail: analysis.problem_validation?.frequency ? `Pain Frequency: ${analysis.problem_validation.frequency}` : 'Customer problem resonance',
    },
    {
      label: 'TAM Reach',
      value: analysis.market_analysis?.tam ? analysis.market_analysis.tam.split('(')[0].trim() : 'Validated TAM',
      detail: analysis.market_analysis?.sam ? `SAM: ${analysis.market_analysis.sam.split('(')[0].trim()}` : undefined,
    },
  ];

  const keyInsights: string[] = [];
  if (analysis.market_analysis?.growth_potential) {
    keyInsights.push(analysis.market_analysis.growth_potential);
  }
  if (analysis.market_analysis?.market_trends && analysis.market_analysis.market_trends.length > 0) {
    keyInsights.push(analysis.market_analysis.market_trends[0]);
  }
  if (keyInsights.length === 0) {
    keyInsights.push('Strong market demand indicators with expandable addressable customer segments.');
  }

  return {
    score,
    weight: DEFAULT_HEALTH_WEIGHTS.market,
    weightedContribution: Math.round(score * (DEFAULT_HEALTH_WEIGHTS.market / 100) * 10) / 10,
    status,
    label: 'Market Potential',
    subMetrics,
    keyInsights,
  };
}

/**
 * Calculates Feasibility score (0-100) from analysis data
 */
export function calculateFeasibility(analysis?: FullAnalysis): PillarBreakdown {
  if (!analysis) {
    return {
      score: 75,
      weight: DEFAULT_HEALTH_WEIGHTS.feasibility,
      weightedContribution: 26.25,
      status: 'good',
      label: 'Feasibility & Execution',
      subMetrics: [
        { label: 'Technical Viability', value: '75/100' },
        { label: 'Complexity', value: 'Medium' },
      ],
      keyInsights: ['Standard development complexity'],
    };
  }

  const techScore = analysis.technical_feasibility?.technical_feasibility_score ?? analysis.technical_score ?? 75;
  const complexity = analysis.technical_feasibility?.complexity?.toLowerCase() || 'medium';

  // Complexity modifier
  let complexityAdjustment = 0;
  if (complexity.includes('low')) complexityAdjustment = 6;
  else if (complexity.includes('high') || complexity.includes('very high')) complexityAdjustment = -5;

  const rawScore = Math.round(techScore + complexityAdjustment);
  const score = Math.max(15, Math.min(98, rawScore));

  let status: PillarBreakdown['status'] = 'good';
  if (score >= 80) status = 'excellent';
  else if (score >= 65) status = 'good';
  else if (score >= 48) status = 'moderate';
  else status = 'critical';

  const subMetrics = [
    {
      label: 'Tech Viability',
      value: `${techScore}/100`,
      detail: analysis.technical_feasibility?.recommended_technology_direction
        ? analysis.technical_feasibility.recommended_technology_direction.slice(0, 38) + '...'
        : 'Core architecture feasibility',
    },
    {
      label: 'Build Complexity',
      value: analysis.technical_feasibility?.complexity || 'Moderate',
      detail: analysis.mvp_roadmap?.phases ? `${analysis.mvp_roadmap.phases.length} Execution Phases` : 'Sprint velocity',
    },
    {
      label: 'MVP Velocity',
      value: analysis.mvp_roadmap?.phases?.[0]?.duration || '4-8 Weeks',
      detail: 'Estimated time to first testable deployment',
    },
  ];

  const keyInsights: string[] = [];
  if (analysis.technical_feasibility?.scalability_considerations) {
    keyInsights.push(analysis.technical_feasibility.scalability_considerations.slice(0, 110) + '...');
  } else if (analysis.technical_feasibility?.major_technical_requirements?.length) {
    keyInsights.push(`Architecture requirement: ${analysis.technical_feasibility.major_technical_requirements[0]}`);
  } else {
    keyInsights.push('No severe architectural barriers identified for MVP validation.');
  }

  return {
    score,
    weight: DEFAULT_HEALTH_WEIGHTS.feasibility,
    weightedContribution: Math.round(score * (DEFAULT_HEALTH_WEIGHTS.feasibility / 100) * 10) / 10,
    status,
    label: 'Feasibility & Execution',
    subMetrics,
    keyInsights,
  };
}

/**
 * Calculates Risk Profile & Resilience score (0-100)
 * Note: HIGHER score = HIGHER health / LOWER net risk / HIGHER resilience!
 */
export function calculateRiskProfile(analysis?: FullAnalysis): PillarBreakdown {
  if (!analysis) {
    return {
      score: 72,
      weight: DEFAULT_HEALTH_WEIGHTS.risk,
      weightedContribution: 18,
      status: 'good',
      label: 'Risk & Downside Resilience',
      subMetrics: [
        { label: 'Risk Health', value: '72/100' },
        { label: 'Active Risks', value: '2' },
      ],
      keyInsights: ['Moderate risk landscape'],
    };
  }

  const risks: RiskItem[] = analysis.risks || [];
  let baseScore = 96;

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let mitigatedCount = 0;

  risks.forEach(r => {
    const sev = r.severity?.toLowerCase() || 'medium';
    const hasMitigation = Boolean(r.mitigation && r.mitigation.trim().length > 10);
    if (hasMitigation) mitigatedCount++;

    if (sev === 'critical') {
      criticalCount++;
      baseScore -= hasMitigation ? 14 : 22;
    } else if (sev === 'high') {
      highCount++;
      baseScore -= hasMitigation ? 8 : 14;
    } else if (sev === 'medium') {
      mediumCount++;
      baseScore -= hasMitigation ? 3 : 6;
    } else {
      baseScore -= 2;
    }
  });

  // If no explicit risks array, estimate from competition and verdict
  if (risks.length === 0) {
    baseScore = 75;
  }

  const score = Math.max(18, Math.min(97, Math.round(baseScore)));

  let status: PillarBreakdown['status'] = 'good';
  if (score >= 80) status = 'excellent';
  else if (score >= 65) status = 'good';
  else if (score >= 50) status = 'moderate';
  else status = 'critical';

  const totalRisks = risks.length || 3;
  const mitigationRate = totalRisks > 0 ? Math.round((mitigatedCount / totalRisks) * 100) : 75;

  const subMetrics = [
    {
      label: 'Mitigation Rate',
      value: `${mitigationRate}%`,
      detail: `${mitigatedCount} of ${totalRisks} mapped risks mitigated`,
    },
    {
      label: 'Critical / High Flags',
      value: `${criticalCount + highCount}`,
      detail: criticalCount > 0 ? `${criticalCount} critical blocker items` : 'Zero unmitigated critical risks',
    },
    {
      label: 'Downside Exposure',
      value: score >= 75 ? 'Low' : score >= 55 ? 'Moderate' : 'Elevated',
      detail: 'Inherent operational & market friction',
    },
  ];

  const keyInsights: string[] = [];
  const topRisk = risks.find(r => r.severity === 'Critical') || risks.find(r => r.severity === 'High') || risks[0];
  if (topRisk) {
    keyInsights.push(`Primary friction: ${topRisk.category} - ${topRisk.description.slice(0, 90)}...`);
  } else {
    keyInsights.push('Risk profile is within manageable thresholds with documented mitigations.');
  }

  return {
    score,
    weight: DEFAULT_HEALTH_WEIGHTS.risk,
    weightedContribution: Math.round(score * (DEFAULT_HEALTH_WEIGHTS.risk / 100) * 10) / 10,
    status,
    label: 'Risk & Downside Resilience',
    subMetrics,
    keyInsights,
  };
}

/**
 * Computes the complete weighted Idea Health Score result
 */
export function computeIdeaHealthScore(
  ideaOrAnalysis?: StartupIdea | FullAnalysis | null,
  customWeights?: HealthWeights
): IdeaHealthScoreResult {
  const analysis: FullAnalysis | undefined =
    ideaOrAnalysis && 'analysis' in ideaOrAnalysis
      ? (ideaOrAnalysis as StartupIdea).analysis
      : (ideaOrAnalysis as FullAnalysis | undefined);

  const weights = customWeights || DEFAULT_HEALTH_WEIGHTS;
  const totalWeight = weights.market + weights.feasibility + weights.risk;
  const normalizedTotal = totalWeight > 0 ? totalWeight : 100;

  const marketPillar = calculateMarketPotential(analysis);
  marketPillar.weight = weights.market;
  marketPillar.weightedContribution = Math.round(marketPillar.score * (weights.market / normalizedTotal) * 10) / 10;

  const feasibilityPillar = calculateFeasibility(analysis);
  feasibilityPillar.weight = weights.feasibility;
  feasibilityPillar.weightedContribution = Math.round(feasibilityPillar.score * (weights.feasibility / normalizedTotal) * 10) / 10;

  const riskPillar = calculateRiskProfile(analysis);
  riskPillar.weight = weights.risk;
  riskPillar.weightedContribution = Math.round(riskPillar.score * (weights.risk / normalizedTotal) * 10) / 10;

  // Calculate weighted composite
  const rawHealth = (
    marketPillar.score * weights.market +
    feasibilityPillar.score * weights.feasibility +
    riskPillar.score * weights.risk
  ) / normalizedTotal;

  const overallHealthScore = Math.max(1, Math.min(100, Math.round(rawHealth)));

  // Determine Tier and Visual Tokens
  let tier: IdeaHealthScoreResult['tier'];
  if (overallHealthScore >= 82) {
    tier = {
      label: 'Prime Viability',
      color: '#10b981', // emerald-500
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
      borderClass: 'border-emerald-200 dark:border-emerald-800',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200',
      description: 'Exceptional startup health. Robust market demand, technically sound MVP scope, and clear risk mitigation.',
    };
  } else if (overallHealthScore >= 68) {
    tier = {
      label: 'High Conviction',
      color: '#6366f1', // indigo-500
      bgClass: 'bg-indigo-50 dark:bg-indigo-950/60',
      borderClass: 'border-indigo-200 dark:border-indigo-800',
      textClass: 'text-indigo-700 dark:text-indigo-300',
      badgeClass: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200',
      description: 'Promising commercial viability with actionable execution paths. Target the identified risk flags before scaling.',
    };
  } else if (overallHealthScore >= 50) {
    tier = {
      label: 'Moderate Viability',
      color: '#f59e0b', // amber-500
      bgClass: 'bg-amber-50 dark:bg-amber-950/60',
      borderClass: 'border-amber-200 dark:border-amber-800',
      textClass: 'text-amber-700 dark:text-amber-300',
      badgeClass: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200',
      description: 'Idea has potential but exhibits noticeable headwinds in market sizing, tech complexity, or unmitigated risks.',
    };
  } else {
    tier = {
      label: 'High Vulnerability',
      color: '#f43f5e', // rose-500
      bgClass: 'bg-rose-50 dark:bg-rose-950/60',
      borderClass: 'border-rose-200 dark:border-rose-800',
      textClass: 'text-rose-700 dark:text-rose-300',
      badgeClass: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200',
      description: 'Critical vulnerabilities detected. Significant pivot or major de-risking required before allocating engineering capital.',
    };
  }

  // Health Catalysts
  const healthCatalysts: string[] = [];
  if (marketPillar.score >= 75) {
    healthCatalysts.push(`Market Opportunity (${marketPillar.score}/100) provides strong tailwinds.`);
  }
  if (feasibilityPillar.score >= 75) {
    healthCatalysts.push(`Technical architecture has high viability (${feasibilityPillar.score}/100) for rapid MVP deployment.`);
  }
  if (riskPillar.score >= 75) {
    healthCatalysts.push(`Downside exposure is well-hedged (${riskPillar.score}/100) with concrete mitigation plans.`);
  }
  if (healthCatalysts.length === 0) {
    healthCatalysts.push('Well-defined niche customer problem with clear initial addressable user personas.');
  }

  // Vulnerabilities and simulated score gains
  const vulnerabilities: IdeaHealthScoreResult['vulnerabilities'] = [];
  const risks: RiskItem[] = analysis?.risks || [];
  const topRisks = risks.filter(r => r.severity === 'Critical' || r.severity === 'High');

  if (topRisks.length > 0) {
    topRisks.slice(0, 2).forEach((r, idx) => {
      vulnerabilities.push({
        issue: `${r.category} Risk: ${r.description.slice(0, 80)}...`,
        potentialScoreGain: idx === 0 ? 5 : 3,
        recommendedMitigation: r.mitigation || 'Implement a structured pilot agreement or fallback integration.',
      });
    });
  } else if (marketPillar.score < 70) {
    vulnerabilities.push({
      issue: 'Market Demand Breadth: SAM concentration limits immediate scale.',
      potentialScoreGain: 6,
      recommendedMitigation: 'Expand target persona definitions to adjacent verticals (e.g. SMB fleets, regional contractors).',
    });
  } else if (feasibilityPillar.score < 70) {
    vulnerabilities.push({
      issue: 'Technical Scope: Initial MVP complexity requires multiple third-party dependencies.',
      potentialScoreGain: 5,
      recommendedMitigation: 'Trim phase 1 feature scope down to single core value proposition.',
    });
  } else {
    vulnerabilities.push({
      issue: 'Sales Cycle Friction: Enterprise buyers often require 60-90 day pilot approvals.',
      potentialScoreGain: 4,
      recommendedMitigation: 'Deploy self-serve instant diagnostic reports to compress buyer time-to-value.',
    });
  }

  return {
    overallHealthScore,
    tier,
    marketPotential: marketPillar,
    feasibility: feasibilityPillar,
    riskProfile: riskPillar,
    weights,
    healthCatalysts,
    vulnerabilities,
  };
}
