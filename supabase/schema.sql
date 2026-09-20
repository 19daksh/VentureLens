-- ==========================================================
-- VentureLens AI - Supabase & PostgreSQL Schema
-- Complete DDL for 9 connected tables with RLS and Indexes
-- ==========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  organization TEXT,
  role TEXT DEFAULT 'Founder',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. STARTUP IDEAS TABLE
CREATE TABLE IF NOT EXISTS public.startup_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  industry TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'analyzing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. ANALYSES TABLE (Core summary, scores, and verdict)
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.startup_ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  verdict TEXT NOT NULL,
  verdict_type TEXT NOT NULL CHECK (verdict_type IN ('Build', 'Improve', 'Pivot')),
  confidence_indicator TEXT NOT NULL,
  executive_summary TEXT NOT NULL,
  problem_score INTEGER NOT NULL CHECK (problem_score >= 0 AND problem_score <= 100),
  market_score INTEGER NOT NULL CHECK (market_score >= 0 AND market_score <= 100),
  competition_score INTEGER NOT NULL CHECK (competition_score >= 0 AND competition_score <= 100),
  revenue_score INTEGER NOT NULL CHECK (revenue_score >= 0 AND revenue_score <= 100),
  technical_score INTEGER NOT NULL CHECK (technical_score >= 0 AND technical_score <= 100),
  raw_gemini_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. MARKET ANALYSIS TABLE
CREATE TABLE IF NOT EXISTS public.market_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  tam TEXT NOT NULL,
  sam TEXT NOT NULL,
  som TEXT NOT NULL,
  demand_score INTEGER NOT NULL CHECK (demand_score >= 0 AND demand_score <= 100),
  growth_potential TEXT NOT NULL,
  market_trends JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_insights TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. COMPETITORS TABLE
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_customer TEXT NOT NULL,
  differentiation_opportunity TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. BUSINESS MODELS TABLE
CREATE TABLE IF NOT EXISTS public.business_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  recommended_model TEXT NOT NULL,
  customer_segment TEXT NOT NULL,
  pricing_strategy TEXT NOT NULL,
  revenue_streams JSONB NOT NULL DEFAULT '[]'::jsonb,
  monetization_strategy TEXT NOT NULL,
  unit_economics TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. RISKS TABLE
CREATE TABLE IF NOT EXISTS public.risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  probability TEXT NOT NULL CHECK (probability IN ('High', 'Medium', 'Low')),
  impact TEXT NOT NULL CHECK (impact IN ('High', 'Medium', 'Low')),
  mitigation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. MVP ROADMAP TABLE
CREATE TABLE IF NOT EXISTS public.mvp_roadmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  duration TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  goal TEXT NOT NULL,
  priority TEXT NOT NULL,
  is_must_have BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Immediate', 'High', 'Medium', 'Low')),
  category TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==========================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_startup_ideas_user_id ON public.startup_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_startup_ideas_created_at ON public.startup_ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_idea_id ON public.analyses(idea_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_market_analysis_analysis_id ON public.market_analysis(analysis_id);
CREATE INDEX IF NOT EXISTS idx_competitors_analysis_id ON public.competitors(analysis_id);
CREATE INDEX IF NOT EXISTS idx_business_models_analysis_id ON public.business_models(analysis_id);
CREATE INDEX IF NOT EXISTS idx_risks_analysis_id ON public.risks(analysis_id);
CREATE INDEX IF NOT EXISTS idx_mvp_roadmap_analysis_id ON public.mvp_roadmap(analysis_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_analysis_id ON public.recommendations(analysis_id);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures users can ONLY see, insert, modify, or delete their own data!
-- ==========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mvp_roadmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Startup Ideas Policies
CREATE POLICY "Users can view own ideas" ON public.startup_ideas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ideas" ON public.startup_ideas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ideas" ON public.startup_ideas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas" ON public.startup_ideas
  FOR DELETE USING (auth.uid() = user_id);

-- Analyses Policies
CREATE POLICY "Users can view own analyses" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON public.analyses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON public.analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Sub-tables Policies (Ownership verified via parent analysis -> analyses.user_id = auth.uid())

-- 4. Market Analysis Policies
CREATE POLICY "Users can view own market analysis" ON public.market_analysis
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = market_analysis.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own market analysis" ON public.market_analysis
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = market_analysis.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can update own market analysis" ON public.market_analysis
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = market_analysis.analysis_id AND analyses.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = market_analysis.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own market analysis" ON public.market_analysis
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = market_analysis.analysis_id AND analyses.user_id = auth.uid())
  );

-- 5. Competitors Policies
CREATE POLICY "Users can view own competitors" ON public.competitors
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = competitors.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own competitors" ON public.competitors
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = competitors.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can update own competitors" ON public.competitors
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = competitors.analysis_id AND analyses.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = competitors.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own competitors" ON public.competitors
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = competitors.analysis_id AND analyses.user_id = auth.uid())
  );

-- 6. Business Models Policies
CREATE POLICY "Users can view own business models" ON public.business_models
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = business_models.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own business models" ON public.business_models
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = business_models.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can update own business models" ON public.business_models
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = business_models.analysis_id AND analyses.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = business_models.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own business models" ON public.business_models
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = business_models.analysis_id AND analyses.user_id = auth.uid())
  );

-- 7. Risks Policies
CREATE POLICY "Users can view own risks" ON public.risks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = risks.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own risks" ON public.risks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = risks.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can update own risks" ON public.risks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = risks.analysis_id AND analyses.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = risks.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own risks" ON public.risks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = risks.analysis_id AND analyses.user_id = auth.uid())
  );

-- 8. MVP Roadmap Policies
CREATE POLICY "Users can view own mvp roadmap" ON public.mvp_roadmap
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = mvp_roadmap.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own mvp roadmap" ON public.mvp_roadmap
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = mvp_roadmap.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can update own mvp roadmap" ON public.mvp_roadmap
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = mvp_roadmap.analysis_id AND analyses.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = mvp_roadmap.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own mvp roadmap" ON public.mvp_roadmap
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = mvp_roadmap.analysis_id AND analyses.user_id = auth.uid())
  );

-- 9. Recommendations Policies
CREATE POLICY "Users can view own recommendations" ON public.recommendations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = recommendations.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own recommendations" ON public.recommendations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = recommendations.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can update own recommendations" ON public.recommendations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = recommendations.analysis_id AND analyses.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = recommendations.analysis_id AND analyses.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own recommendations" ON public.recommendations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = recommendations.analysis_id AND analyses.user_id = auth.uid())
  );

-- 10. REAL-TIME MARKET RESEARCH TABLE
CREATE TABLE IF NOT EXISTS public.market_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  research_data JSONB NOT NULL,
  researched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_analysis_market_research UNIQUE (analysis_id)
);

CREATE INDEX IF NOT EXISTS idx_market_research_analysis_id ON public.market_research(analysis_id);
CREATE INDEX IF NOT EXISTS idx_market_research_user_id ON public.market_research(user_id);

ALTER TABLE public.market_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own market research" ON public.market_research
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own market research" ON public.market_research
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own market research" ON public.market_research
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own market research" ON public.market_research
  FOR DELETE USING (auth.uid() = user_id);

-- 11. FINANCIAL PROJECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.financial_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  projection_period INTEGER NOT NULL DEFAULT 36,
  currency TEXT NOT NULL DEFAULT 'INR',
  assumptions JSONB NOT NULL,
  monthly_projection JSONB NOT NULL,
  scenarios JSONB NOT NULL,
  unit_economics JSONB NOT NULL,
  funding_analysis JSONB NOT NULL,
  ai_insights JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_analysis_financial_projection UNIQUE (analysis_id)
);

CREATE INDEX IF NOT EXISTS idx_financial_projections_analysis_id ON public.financial_projections(analysis_id);
CREATE INDEX IF NOT EXISTS idx_financial_projections_user_id ON public.financial_projections(user_id);

ALTER TABLE public.financial_projections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financial projections" ON public.financial_projections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial projections" ON public.financial_projections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial projections" ON public.financial_projections
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial projections" ON public.financial_projections
  FOR DELETE USING (auth.uid() = user_id);

-- 12. COMPETITOR INTELLIGENCE TABLE (Grounded real-time competitor research data)
CREATE TABLE IF NOT EXISTS public.competitor_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  research_data JSONB NOT NULL,
  researched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_analysis_competitor_intelligence UNIQUE (analysis_id)
);

CREATE INDEX IF NOT EXISTS idx_competitor_intelligence_analysis_id ON public.competitor_intelligence(analysis_id);
CREATE INDEX IF NOT EXISTS idx_competitor_intelligence_user_id ON public.competitor_intelligence(user_id);

ALTER TABLE public.competitor_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own competitor intelligence" ON public.competitor_intelligence
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own competitor intelligence" ON public.competitor_intelligence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own competitor intelligence" ON public.competitor_intelligence
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own competitor intelligence" ON public.competitor_intelligence
  FOR DELETE USING (auth.uid() = user_id);

-- 13. COMPETITOR PROFILES TABLE (Individual company profiles)
CREATE TABLE IF NOT EXISTS public.competitor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  competitor_type TEXT NOT NULL DEFAULT 'Direct',
  description TEXT,
  target_audience TEXT,
  business_model TEXT,
  pricing JSONB,
  features JSONB,
  positioning JSONB,
  strengths JSONB,
  limitations JSONB,
  recent_developments JSONB,
  sources JSONB,
  researched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_competitor_profiles_analysis_id ON public.competitor_profiles(analysis_id);
CREATE INDEX IF NOT EXISTS idx_competitor_profiles_user_id ON public.competitor_profiles(user_id);

ALTER TABLE public.competitor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own competitor profiles" ON public.competitor_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own competitor profiles" ON public.competitor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own competitor profiles" ON public.competitor_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own competitor profiles" ON public.competitor_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- 14. COMPETITOR TRACKING TABLE (Pinned & monitored competitors)
CREATE TABLE IF NOT EXISTS public.competitor_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_id TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  last_researched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_competitor_tracking_analysis_id ON public.competitor_tracking(analysis_id);
CREATE INDEX IF NOT EXISTS idx_competitor_tracking_user_id ON public.competitor_tracking(user_id);

ALTER TABLE public.competitor_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own competitor tracking" ON public.competitor_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own competitor tracking" ON public.competitor_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own competitor tracking" ON public.competitor_tracking
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own competitor tracking" ON public.competitor_tracking
  FOR DELETE USING (auth.uid() = user_id);



