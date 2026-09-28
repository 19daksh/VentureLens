export type ExecutionPace = 'lean_bootstrapped' | 'venture_scale' | 'enterprise_b2b';
export type TeamCapacity = 'solo_founder' | 'small_team' | 'funded_team';
export type MilestoneCategory = 'validation' | 'product' | 'growth' | 'monetization' | 'operations';
export type MilestonePriority = 'critical' | 'high' | 'medium';

export interface TacticalActionItem {
  id: string;
  title: string;
  description: string;
  category: MilestoneCategory;
  priority: MilestonePriority;
  estimatedDays: number;
  completed: boolean;
  deliverable: string;
  recommendedTools?: string[];
}

export interface PrimaryKpi {
  metric: string;
  target: string;
  rationale: string;
}

export interface MonthlyMilestone {
  month: number; // 1 to 6
  phaseTitle: string; // e.g. "Month 1: Problem-Solution Fit & Concierge Validation"
  theme: string; // e.g. "Validate customer urgency through 35 deep-dive interviews and prototype pre-orders"
  priority: MilestonePriority;
  keyObjectives: string[];
  primaryKpis: PrimaryKpi[];
  successGate: string; // Specific quantitative criteria to validate before advancing
  actionItems: TacticalActionItem[];
  potentialPitfalls: string[]; // Specific risks & roadblocks for this stage
  suggestedStack: string[]; // Recommended tools (e.g. Supabase, PostHog, Stripe)
  estimatedBudgetUsd?: string;
}

export interface GrowthRoadmapData {
  summary: string;
  northStarMetric: {
    name: string;
    sixMonthTarget: string;
    definition: string;
  };
  executivePlaybook: {
    strategicFocus: string;
    primaryGrowthLoop: string;
    criticalAssumptionsToTest: string[];
    capitalEfficiencyGuideline: string;
  };
  months: MonthlyMilestone[]; // Array of 6 months
  suggestedPivotsOrTriggers: {
    condition: string;
    recommendedPivot: string;
  }[];
}

export interface GrowthRoadmapRecord {
  id: string;
  idea_id: string;
  user_id?: string;
  pace: ExecutionPace;
  team_capacity: TeamCapacity;
  roadmap_data: GrowthRoadmapData;
  completed_action_ids: string[];
  created_at: string;
  updated_at: string;
}
