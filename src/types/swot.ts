export type SwotQuadrant = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';

export interface SwotItem {
  id: string;
  quadrant: SwotQuadrant;
  title: string;
  description: string;
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  actionable_strategy: string;
  impact_score: number; // 1-10
}

export interface TowsStrategy {
  id: string;
  type: 'SO' | 'ST' | 'WO' | 'WT';
  title: string;
  description: string;
  strength_or_weakness_ids?: string[];
  opportunity_or_threat_ids?: string[];
  tactical_steps: string[];
}

export interface SwotAnalysisData {
  id?: string;
  idea_id?: string;
  title: string;
  description: string;
  industry?: string;
  target_audience?: string;
  strategic_verdict: string;
  swot_health_score: number; // 0-100
  primary_advantage: string;
  primary_vulnerability: string;
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
  tows_strategies: TowsStrategy[];
  generated_at: string;
  lens?: string;
}

export interface SwotRequestPayload {
  title?: string;
  description: string;
  industry?: string;
  target_audience?: string;
  additional_info?: string;
  idea_id?: string;
  lens?: 'balanced' | 'aggressive_growth' | 'bootstrapped' | 'defensive_moat';
}
