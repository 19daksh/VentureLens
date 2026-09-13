export interface StartupIdea {
  id: string;
  user_id: string;
  title: string;
  description: string;
  industry: string;
  target_audience: string;
  additional_info?: string;
  status: 'draft' | 'analyzing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  analysis?: FullAnalysis;
}

export interface Competitor {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  target_customer: string;
  differentiation_opportunity: string;
}

export interface RiskItem {
  category: 'Market' | 'Execution' | 'Regulatory' | 'Financial' | 'Technical' | 'Competitive' | string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  probability: 'High' | 'Medium' | 'Low';
  impact: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

export interface MvpPhase {
  phase: string;
  duration: string;
  features: string[];
  goal: string;
  priority: 'Critical' | 'High' | 'Medium';
}

export interface Recommendation {
  action: string;
  priority: 'Immediate' | 'High' | 'Medium' | 'Low';
  category: 'Validation' | 'Product' | 'Go-To-Market' | 'Monetization' | 'Technical' | 'Team' | string;
  reason: string;
}

export interface MarketAnalysisData {
  market_opportunity_score: number;
  tam: string;
  sam: string;
  som: string;
  demand_score: number;
  growth_potential: string;
  market_trends: string[];
  key_insights: string;
}

export interface ProblemValidationData {
  problem_strength_score: number;
  problem_severity: 'Critical' | 'High' | 'Moderate' | 'Low' | string;
  frequency: 'Daily' | 'Weekly' | 'Occasional' | 'Rare' | string;
  existing_alternatives: string[];
  customer_pain_points: string[];
  validation_insights: string;
}

export interface CompetitorAnalysisData {
  competition_score: number;
  competitive_landscape_summary: string;
  differentiation_strategy: string;
  competitors: Competitor[];
}

export interface BusinessModelData {
  recommended_business_model: string;
  customer_segment: string;
  pricing_strategy: string;
  revenue_streams: string[];
  monetization_strategy: string;
  unit_economics_considerations: string;
  revenue_potential_score: number;
}

export interface TechnicalFeasibilityData {
  technical_feasibility_score: number;
  recommended_technology_direction: string;
  major_technical_requirements: string[];
  complexity: 'Low' | 'Medium' | 'High' | 'Very High' | string;
  scalability_considerations: string;
  technical_risks: string[];
}

export interface MvpRoadmapData {
  phases: MvpPhase[];
  must_have_features: string[];
  nice_to_have_features: string[];
  future_features: string[];
}

export interface GoToMarketData {
  initial_target_customer: string;
  acquisition_channels: string[];
  launch_strategy: string;
  positioning: string;
  early_validation_strategy: string;
}

export interface FinalVerdictData {
  overall_score: number;
  verdict: string;
  verdict_type: 'Build' | 'Improve' | 'Pivot';
  confidence_indicator: string;
  strongest_aspects: string[];
  weakest_aspects: string[];
  biggest_risk: string;
  recommended_next_step: string;
}

export interface FullAnalysis {
  id: string;
  idea_id: string;
  user_id: string;
  overall_score: number;
  verdict: string;
  verdict_type: 'Build' | 'Improve' | 'Pivot';
  confidence_indicator: string;
  executive_summary: string;
  problem_score: number;
  market_score: number;
  competition_score: number;
  revenue_score: number;
  technical_score: number;
  created_at: string;
  updated_at: string;

  problem_validation: ProblemValidationData;
  market_analysis: MarketAnalysisData;
  competitor_analysis: CompetitorAnalysisData;
  business_model: BusinessModelData;
  technical_feasibility: TechnicalFeasibilityData;
  risks: RiskItem[];
  mvp_roadmap: MvpRoadmapData;
  recommendations: Recommendation[];
  go_to_market: GoToMarketData;
  final_verdict: FinalVerdictData;
}

export interface AnalysisRequestPayload {
  title: string;
  description: string;
  industry: string;
  target_audience: string;
  additional_info?: string;
  userId?: string;
}
