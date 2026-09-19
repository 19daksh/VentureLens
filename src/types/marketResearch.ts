export interface MarketOverview {
  summary: string;
  market_state: string;
  key_developments: string[];
  recent_statistics: string[];
}

export interface MarketTrend {
  title: string;
  description: string;
  why_it_matters: string;
  source: string;
  source_url: string;
  published_date?: string;
}

export interface CustomerDemandSignal {
  signal: string;
  evidence: string;
  interpretation: string;
  source: string;
  source_url: string;
}

export interface GroundedCompetitor {
  name: string;
  website: string;
  description: string;
  target_audience: string;
  pricing: string;
  features: string[];
  positioning: string;
  strengths: string[];
  observed_gaps: string[];
  sources: Array<{ title?: string; url: string }>;
}

export interface CompetitiveGap {
  gap_type: string;
  opportunity: string;
  label: 'Research-based opportunity';
  evidence: string;
}

export interface MarketOpportunity {
  title: string;
  description: string;
  evidence: string;
  relevance: string;
  sources: Array<{ title?: string; url: string }>;
}

export interface MarketThreat {
  title: string;
  description: string;
  evidence: string;
  threat_type: string;
  sources: Array<{ title?: string; url: string }>;
}

export interface RecentDevelopment {
  title: string;
  description: string;
  date: string;
  source: string;
  source_url: string;
}

export interface ResearchSource {
  title: string;
  url: string;
  domain: string;
  published_date?: string;
}

export interface MarketResearchData {
  market_overview: MarketOverview;
  trends: MarketTrend[];
  customer_demand: CustomerDemandSignal[];
  competitors: GroundedCompetitor[];
  competitive_gaps: CompetitiveGap[];
  opportunities: MarketOpportunity[];
  threats: MarketThreat[];
  recent_developments: RecentDevelopment[];
  sources: ResearchSource[];
  search_queries_performed?: string[];
}

export interface MarketResearchRecord {
  id: string;
  analysis_id: string;
  user_id: string;
  research_data: MarketResearchData;
  researched_at: string;
  created_at: string;
  updated_at: string;
}
