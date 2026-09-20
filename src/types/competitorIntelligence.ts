export interface CompetitorSource {
  title: string;
  url: string;
  publisher?: string;
  published_date?: string;
  accessed_date?: string;
  domain?: string;
}

export interface CompetitorPricingTier {
  plan_name: string;
  price: string;
  billing_period?: string;
  features_included?: string[];
  is_free?: boolean;
  is_enterprise?: boolean;
}

export interface CompetitorPricingModel {
  model_type: string;
  free_tier?: string;
  entry_tier?: string;
  mid_tier?: string;
  premium_tier?: string;
  enterprise_tier?: string;
  pricing_summary: string;
  last_researched: string;
  confidence: 'Verified' | 'Source-Reported' | 'Unverified / Publicly Unavailable';
  source_reference?: string;
}

export type CompetitorType = 'Direct' | 'Indirect' | 'Substitute' | 'Emerging';
export type InformationQualityStatus = 'Verified' | 'Source-reported' | 'AI inference';

export interface CompetitorProfile {
  id: string;
  name: string;
  website: string;
  competitor_type: CompetitorType;
  target_audience: string;
  core_product: string;
  business_model: string;
  pricing: CompetitorPricingModel;
  key_features: string[];
  positioning: string;
  geographic_focus: string;
  observed_strengths: string[];
  observed_limitations: string[];
  latest_development?: {
    date: string;
    title: string;
    description: string;
    potential_implication: string;
    source_title?: string;
    source_url?: string;
  };
  sources: CompetitorSource[];
  information_status: InformationQualityStatus;
  is_pinned?: boolean;
  tracked_at?: string;
}

export type FeatureStatus = 'Available' | 'Partial' | 'Not identified';
export type FeatureAvailabilityStatus = FeatureStatus;

export interface FeatureMatrixRow {
  id: string;
  category: string;
  feature_name: string;
  description?: string;
  startup_status: FeatureStatus;
  competitor_status: Record<string, FeatureStatus>; // competitor_id -> status
  notes?: string;
}

export interface PositioningCoordinate {
  id: string;
  name: string;
  is_startup?: boolean;
  competitor_type?: string;
  x_score: number; // 0 to 100
  y_score: number; // 0 to 100
  x_label: string;
  y_label: string;
  notes?: string;
}

export type PositioningAxisKey = 'price_vs_features' | 'innovation_vs_maturity' | 'price_vs_target' | 'ease_vs_depth' | 'b2c_vs_b2b';

export interface PositioningAxisOption {
  key: PositioningAxisKey;
  label: string;
  x_axis_label: string;
  y_axis_label: string;
  x_low: string;
  x_high: string;
  y_low: string;
  y_high: string;
}

export interface CompetitiveGapItem {
  id: string;
  gap_type:
    | 'Underserved segment'
    | 'Missing feature'
    | 'Pricing gap'
    | 'Geographic gap'
    | 'Workflow gap'
    | 'Integration gap'
    | 'Accessibility gap'
    | 'Onboarding gap'
    | string;
  title: string;
  evidence: string;
  affected_segment: string;
  relevant_competitors: string[];
  confidence: 'High' | 'Medium' | 'Low';
  sources: CompetitorSource[];
  classification: 'Potential gap identified from comparison' | 'Research-based opportunity';
}

export interface DifferentiationOpportunity {
  dimension:
    | 'pricing'
    | 'target_audience'
    | 'product_experience'
    | 'technology'
    | 'personalization'
    | 'distribution'
    | 'integrations'
    | 'geographic_focus'
    | 'business_model'
    | 'customer_support'
    | string;
  title: string;
  current_landscape: string;
  potential_differentiation: string;
  evidence: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export type CompetitorDevelopmentType =
  | 'Product Launch'
  | 'Feature Update'
  | 'Pricing Change'
  | 'Funding'
  | 'Partnership'
  | 'Acquisition'
  | 'Geographic Expansion'
  | 'Strategic Change';

export interface RecentCompetitorDevelopment {
  id: string;
  competitor_name: string;
  competitor_id?: string;
  date: string;
  development_type: CompetitorDevelopmentType;
  title: string;
  description: string;
  potential_implication: string;
  source_title: string;
  source_url: string;
}

export interface StartupPositionComparison {
  dimension: string;
  startup_position: string;
  competitor_landscape: string;
  key_difference: string;
}

export interface AICompetitorInsights {
  landscape_summary: string;
  market_structure: {
    direct: string;
    indirect: string;
    substitutes: string;
    emerging: string;
  };
  differentiation_opportunities: Array<{
    opportunity: string;
    rationale: string;
    label: 'AI Inference' | 'Strategic Recommendation';
  }>;
  competitive_risks: Array<{
    risk: string;
    severity: 'High' | 'Medium' | 'Low';
    mitigation: string;
  }>;
  questions_to_validate: string[];
}

export interface CompetitorAlert {
  id: string;
  competitor_name: string;
  change_type: 'Pricing Changed' | 'New Product' | 'New Feature' | 'New Market' | 'Partnership' | 'Leadership';
  message: string;
  detected_at: string;
  source_url?: string;
}

export interface CompetitorIntelligenceData {
  landscape_summary: string;
  competitors: CompetitorProfile[];
  competitor_profiles?: CompetitorProfile[]; // Convenient alias
  feature_matrix: FeatureMatrixRow[];
  positioning_maps: Record<string, PositioningCoordinate[]>;
  competitive_gaps: CompetitiveGapItem[];
  differentiation_analysis: DifferentiationOpportunity[];
  differentiation_opportunities?: DifferentiationOpportunity[]; // Convenient alias
  recent_developments: RecentCompetitorDevelopment[];
  startup_comparison: StartupPositionComparison[];
  ai_insights: AICompetitorInsights;
  sources: CompetitorSource[];
  alerts?: CompetitorAlert[];
  researched_at: string;
  last_refreshed_at?: string;
  search_queries_performed?: string[];
  is_search_grounded?: boolean;
  grounding_status?: 'live_search' | 'fallback_synthesis';
  grounding_message?: string;
}

export interface CompetitorIntelligenceRecord {
  id: string;
  analysis_id: string;
  user_id: string;
  research_data: CompetitorIntelligenceData;
  intelligence_data?: CompetitorIntelligenceData; // Convenient alias
  researched_at: string;
  created_at?: string;
  updated_at?: string;
  pinned_competitors?: string[];
  change_alerts?: CompetitorAlert[];
}
