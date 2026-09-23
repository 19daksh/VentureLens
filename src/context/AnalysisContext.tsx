import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StartupIdea, FullAnalysis, AnalysisRequestPayload } from '../types/analysis';
import { MarketResearchRecord } from '../types/marketResearch';
import { FinancialProjectionRecord } from '../types/financialProjection';
import { CompetitorIntelligenceRecord } from '../types/competitorIntelligence';
import { useAuth, isUuid } from './AuthContext';
import { supabase, isSupabaseConfigured, localDb } from '../lib/supabase';

interface AnalysisContextType {
  ideas: StartupIdea[];
  loading: boolean;
  isAnalyzing: boolean;
  analysisProgressStep: string;
  error: string | null;
  selectedCompareIds: string[];
  refreshIdeas: () => Promise<void>;
  createIdeaAndAnalyze: (payload: Omit<AnalysisRequestPayload, 'userId'>) => Promise<{ ideaId?: string; error?: string }>;
  deleteIdea: (ideaId: string) => Promise<boolean>;
  getIdeaById: (id: string) => StartupIdea | null;
  fetchIdeaOrAnalysisById: (id: string) => Promise<StartupIdea | null>;
  toggleCompareId: (id: string) => void;
  clearCompare: () => void;
  saveMarketResearchForIdea: (ideaId: string, record: MarketResearchRecord) => void;
  saveFinancialProjectionForIdea: (ideaId: string, record: FinancialProjectionRecord) => void;
  saveCompetitorIntelligenceForIdea: (ideaId: string, record: CompetitorIntelligenceRecord) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgressStep, setAnalysisProgressStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);

  // Fetch ideas for the active user
  const refreshIdeas = useCallback(async () => {
    if (!user) {
      setIdeas([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSupabaseConfigured && supabase && isUuid(user.id)) {
        // Fetch ideas and nested analyses directly from Supabase PostgreSQL
        const { data: dbIdeas, error: ideasError } = await supabase
          .from('startup_ideas')
          .select('*, analyses(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ideasError) {
          console.warn('Supabase query notice:', ideasError.message);
          // Fall back to local storage if available for this user
          const localList = localDb.getIdeas(user.id);
          if (localList.length > 0) {
            setIdeas(localList);
            setLoading(false);
            return;
          }
        } else if (dbIdeas && dbIdeas.length > 0) {
          const formatted: StartupIdea[] = dbIdeas.map((item: any) => {
            const rawAnalysis = item.analyses && item.analyses.length > 0 ? item.analyses[0] : null;
            const fullAnalysis: FullAnalysis | undefined = rawAnalysis
              ? {
                  id: rawAnalysis.id,
                  idea_id: rawAnalysis.idea_id,
                  user_id: rawAnalysis.user_id,
                  overall_score: rawAnalysis.overall_score,
                  verdict: rawAnalysis.verdict,
                  verdict_type: rawAnalysis.verdict_type,
                  confidence_indicator: rawAnalysis.confidence_indicator,
                  executive_summary: rawAnalysis.executive_summary,
                  problem_score: rawAnalysis.problem_score,
                  market_score: rawAnalysis.market_score,
                  competition_score: rawAnalysis.competition_score,
                  revenue_score: rawAnalysis.revenue_score,
                  technical_score: rawAnalysis.technical_score,
                  created_at: rawAnalysis.created_at,
                  updated_at: rawAnalysis.updated_at,
                  ...(rawAnalysis.raw_gemini_response || {}),
                }
              : undefined;

            const savedMr = fullAnalysis ? localDb.getMarketResearchByAnalysisId(fullAnalysis.id) : null;
            if (savedMr && fullAnalysis) {
              fullAnalysis.market_research = savedMr;
            }

            const savedFp = fullAnalysis ? localDb.getFinancialProjectionByAnalysisId(fullAnalysis.id) : null;
            if (savedFp && fullAnalysis) {
              fullAnalysis.financial_projection = savedFp;
            }

            const savedCi = fullAnalysis ? localDb.getCompetitorIntelligenceByAnalysisId(fullAnalysis.id) : null;
            if (savedCi && fullAnalysis) {
              fullAnalysis.competitor_intelligence = savedCi;
            }

            return {
              id: item.id,
              user_id: item.user_id,
              title: item.title,
              description: item.description,
              industry: item.industry,
              target_audience: item.target_audience,
              additional_info: item.additional_info,
              status: item.status,
              created_at: item.created_at,
              updated_at: item.updated_at,
              analysis: fullAnalysis,
              market_research: savedMr || undefined,
              financial_projection: savedFp || undefined,
              competitor_intelligence: savedCi || undefined,
            };
          });

          setIdeas(formatted);
          setLoading(false);
          return;
        }
      }

      // Check local storage for ideas
      const localList = localDb.getIdeas(user.id);
      const enriched = localList.map(item => {
        const analysis = localDb.getAnalysisByIdeaId(item.id, user.id);
        const savedMr = analysis ? localDb.getMarketResearchByAnalysisId(analysis.id) : null;
        if (savedMr && analysis) {
          analysis.market_research = savedMr;
        }
        const savedFp = analysis ? localDb.getFinancialProjectionByAnalysisId(analysis.id) : null;
        if (savedFp && analysis) {
          analysis.financial_projection = savedFp;
        }
        const savedCi = analysis ? localDb.getCompetitorIntelligenceByAnalysisId(analysis.id) : null;
        if (savedCi && analysis) {
          analysis.competitor_intelligence = savedCi;
        }
        return {
          ...item,
          analysis: analysis || undefined,
          market_research: savedMr || undefined,
          financial_projection: savedFp || undefined,
          competitor_intelligence: savedCi || undefined,
        };
      });
      setIdeas(enriched);
    } catch (err: any) {
      console.error('Error fetching ideas:', err);
      const localList = localDb.getIdeas(user.id);
      setIdeas(localList);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshIdeas();
  }, [refreshIdeas]);

  // Submit and analyze an idea
  const createIdeaAndAnalyze = async (
    payload: Omit<AnalysisRequestPayload, 'userId'>
  ): Promise<{ ideaId?: string; error?: string }> => {
    if (!user) {
      return { error: 'Please log in to validate a startup idea.' };
    }

    setIsAnalyzing(true);
    setError(null);

    // Use RFC 4122 compliant UUIDs for PostgreSQL UUID columns
    const ideaId = crypto.randomUUID();
    const analysisId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newIdea: StartupIdea = {
      id: ideaId,
      user_id: user.id,
      title: payload.title,
      description: payload.description,
      industry: payload.industry,
      target_audience: payload.target_audience,
      additional_info: payload.additional_info,
      status: 'analyzing',
      created_at: now,
      updated_at: now,
    };

    if (!isSupabaseConfigured) {
      localDb.saveIdea(newIdea);
    }
    setIdeas(prev => [newIdea, ...prev]);

    try {
      // Step 1: Market & Problem Analysis
      setAnalysisProgressStep('Synthesizing target audience and customer problem depth...');
      await new Promise(r => setTimeout(r, 600));

      // Step 2: Gemini API Call
      setAnalysisProgressStep('Engaging Gemini to cross-examine competition, TAM/SAM/SOM, and moat...');

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Gemini returned an unparseable response.');
      }

      setAnalysisProgressStep('Calibrating unit economics, risk matrix, and MVP roadmap...');
      await new Promise(r => setTimeout(r, 500));

      const rawAiData = result.data;

      // Normalize verdict and type to adhere to schema check constraints
      const rawVerdictType = String(rawAiData.verdict_type || rawAiData.final_verdict?.verdict_type || 'Build');
      const normalizedVerdictType: 'Build' | 'Improve' | 'Pivot' =
        rawVerdictType.toLowerCase() === 'pivot' ? 'Pivot' :
        rawVerdictType.toLowerCase() === 'improve' ? 'Improve' : 'Build';

      const verdictText = typeof rawAiData.verdict === 'object'
        ? (rawAiData.verdict?.verdict || 'Evaluation completed.')
        : String(rawAiData.verdict || rawAiData.final_verdict?.verdict || 'Evaluation completed.');

      const confidenceText = typeof rawAiData.confidence_indicator === 'string'
        ? rawAiData.confidence_indicator
        : (rawAiData.final_verdict?.confidence_indicator || 'High Confidence');

      const fullAnalysis: FullAnalysis = {
        id: analysisId,
        idea_id: ideaId,
        user_id: user.id,
        overall_score: Number(rawAiData.overall_score) || 75,
        verdict: verdictText,
        verdict_type: normalizedVerdictType,
        confidence_indicator: confidenceText,
        executive_summary: String(rawAiData.executive_summary || 'Analysis completed successfully.'),
        problem_score: Number(rawAiData.problem_score) || 75,
        market_score: Number(rawAiData.market_score) || 75,
        competition_score: Number(rawAiData.competition_score) || 70,
        revenue_score: Number(rawAiData.revenue_score) || 70,
        technical_score: Number(rawAiData.technical_score) || 75,
        created_at: now,
        updated_at: now,
        problem_validation: rawAiData.problem_validation,
        market_analysis: rawAiData.market_analysis,
        competitor_analysis: rawAiData.competitor_analysis,
        business_model: rawAiData.business_model,
        technical_feasibility: rawAiData.technical_feasibility,
        risks: rawAiData.risks,
        mvp_roadmap: rawAiData.mvp_roadmap,
        recommendations: rawAiData.recommendations,
        go_to_market: rawAiData.go_to_market,
        final_verdict: rawAiData.final_verdict,
      };

      // Always save to local storage first so evaluated venture data is never lost
      localDb.saveIdea({ ...newIdea, status: 'completed' });
      localDb.saveAnalysis(fullAnalysis);

      // If Supabase is connected and user has a valid Supabase UUID, write to PostgreSQL tables
      if (isSupabaseConfigured && supabase && isUuid(user.id)) {
        try {
          // Insert into startup_ideas table
          const { error: ideaError } = await supabase.from('startup_ideas').insert({
            id: ideaId,
            user_id: user.id,
            title: payload.title,
            description: payload.description,
            industry: payload.industry,
            target_audience: payload.target_audience,
            additional_info: payload.additional_info,
            status: 'completed',
          });

          if (ideaError) {
            console.warn('Supabase Database insert idea notice:', ideaError.message);
          } else {
            // Insert into analyses table
            const { error: analysisError } = await supabase.from('analyses').insert({
              id: analysisId,
              idea_id: ideaId,
              user_id: user.id,
              overall_score: fullAnalysis.overall_score,
              verdict: fullAnalysis.verdict,
              verdict_type: fullAnalysis.verdict_type,
              confidence_indicator: fullAnalysis.confidence_indicator,
              executive_summary: fullAnalysis.executive_summary,
              problem_score: fullAnalysis.problem_score,
              market_score: fullAnalysis.market_score,
              competition_score: fullAnalysis.competition_score,
              revenue_score: fullAnalysis.revenue_score,
              technical_score: fullAnalysis.technical_score,
              raw_gemini_response: rawAiData,
            });

            if (analysisError) {
              console.warn('Supabase Database insert analysis notice:', analysisError.message);
            } else {
              // Sub-tables
              if (rawAiData.market_analysis) {
                try {
                  await supabase.from('market_analysis').insert({
                    analysis_id: analysisId,
                    tam: String(rawAiData.market_analysis.tam || 'N/A'),
                    sam: String(rawAiData.market_analysis.sam || 'N/A'),
                    som: String(rawAiData.market_analysis.som || 'N/A'),
                    demand_score: Number(rawAiData.market_analysis.demand_score) || 75,
                    growth_potential: String(rawAiData.market_analysis.growth_potential || 'High'),
                    market_trends: rawAiData.market_analysis.market_trends || [],
                    key_insights: String(rawAiData.market_analysis.key_insights || ''),
                  });
                } catch (err) {
                  console.warn('market_analysis sub-table insert notice:', err);
                }
              }

              if (rawAiData.competitor_analysis?.competitors && Array.isArray(rawAiData.competitor_analysis.competitors)) {
                for (const c of rawAiData.competitor_analysis.competitors) {
                  try {
                    await supabase.from('competitors').insert({
                      analysis_id: analysisId,
                      name: String(c.name || 'Competitor'),
                      description: String(c.description || ''),
                      strengths: c.strengths || [],
                      weaknesses: c.weaknesses || [],
                      target_customer: String(c.target_customer || ''),
                      differentiation_opportunity: String(c.differentiation_opportunity || ''),
                    });
                  } catch (err) {
                    console.warn('competitors sub-table insert notice:', err);
                  }
                }
              }

              if (rawAiData.risks && Array.isArray(rawAiData.risks)) {
                for (const r of rawAiData.risks) {
                  const capitalize = (val?: string, fallback: string = 'Medium') => {
                    if (!val) return fallback;
                    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                  };

                  try {
                    await supabase.from('risks').insert({
                      analysis_id: analysisId,
                      category: String(r.category || 'General'),
                      description: String(r.description || ''),
                      severity: ['Critical', 'High', 'Medium', 'Low'].includes(capitalize(r.severity)) ? capitalize(r.severity) : 'Medium',
                      probability: ['High', 'Medium', 'Low'].includes(capitalize(r.probability)) ? capitalize(r.probability) : 'Medium',
                      impact: ['High', 'Medium', 'Low'].includes(capitalize(r.impact)) ? capitalize(r.impact) : 'Medium',
                      mitigation: String(r.mitigation || ''),
                    });
                  } catch (err) {
                    console.warn('risks sub-table insert notice:', err);
                  }
                }
              }

              if (rawAiData.business_model) {
                try {
                  await supabase.from('business_models').insert({
                    analysis_id: analysisId,
                    recommended_model: String(rawAiData.business_model.recommended_business_model || 'Subscription SaaS'),
                    customer_segment: String(rawAiData.business_model.customer_segment || 'Target Customers'),
                    pricing_strategy: String(rawAiData.business_model.pricing_strategy || 'Value-based Pricing'),
                    revenue_streams: rawAiData.business_model.revenue_streams || [],
                    monetization_strategy: String(rawAiData.business_model.monetization_strategy || ''),
                    unit_economics: String(rawAiData.business_model.unit_economics_considerations || 'Favorable unit economics projected'),
                  });
                } catch (err) {
                  console.warn('business_models sub-table insert notice:', err);
                }
              }

              if (rawAiData.mvp_roadmap?.phases && Array.isArray(rawAiData.mvp_roadmap.phases)) {
                for (const p of rawAiData.mvp_roadmap.phases) {
                  try {
                    await supabase.from('mvp_roadmap').insert({
                      analysis_id: analysisId,
                      phase_name: String(p.phase || 'Phase 1'),
                      duration: String(p.duration || '3 Months'),
                      features: p.features || [],
                      goal: String(p.goal || 'Validate core value proposition'),
                      priority: String(p.priority || 'High'),
                      is_must_have: p.priority === 'Critical' || p.priority === 'High',
                    });
                  } catch (err) {
                    console.warn('mvp_roadmap sub-table insert notice:', err);
                  }
                }
              }

              if (rawAiData.recommendations && Array.isArray(rawAiData.recommendations)) {
                for (const rec of rawAiData.recommendations) {
                  const capitalize = (val?: string, fallback: string = 'High') => {
                    if (!val) return fallback;
                    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                  };

                  const recPriority = ['Immediate', 'High', 'Medium', 'Low'].includes(capitalize(rec.priority))
                    ? capitalize(rec.priority)
                    : 'High';

                  try {
                    await supabase.from('recommendations').insert({
                      analysis_id: analysisId,
                      action: String(rec.action || 'Key Action'),
                      priority: recPriority,
                      category: String(rec.category || 'General'),
                      reason: String(rec.reason || ''),
                    });
                  } catch (err) {
                    console.warn('recommendations sub-table insert notice:', err);
                  }
                }
              }
            }
          }
        } catch (dbErr: any) {
          console.warn('Supabase DB persistence notice:', dbErr.message);
        }
      }

      // Update state
      const completedIdea: StartupIdea = {
        ...newIdea,
        status: 'completed',
        analysis: fullAnalysis,
      };

      setIdeas(prev => prev.map(item => (item.id === ideaId ? completedIdea : item)));

      return { ideaId };
    } catch (err: any) {
      console.error('Validation error:', err);
      const msg = err?.message || 'Failed to complete validation analysis.';
      setError(msg);

      // Mark idea as failed in state
      const failedIdea: StartupIdea = {
        ...newIdea,
        status: 'failed',
      };
      if (!isSupabaseConfigured) {
        localDb.saveIdea(failedIdea);
      }
      setIdeas(prev => prev.map(item => (item.id === ideaId ? failedIdea : item)));

      return { error: msg };
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgressStep('');
    }
  };

  // Delete idea
  const deleteIdea = async (ideaId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      if (isSupabaseConfigured && supabase && isUuid(user.id)) {
        const { error: delError } = await supabase
          .from('startup_ideas')
          .delete()
          .eq('id', ideaId)
          .eq('user_id', user.id);

        if (delError) {
          console.warn('Supabase deletion warning:', delError.message);
        }
      }
      localDb.deleteIdea(ideaId, user.id);
      setIdeas(prev => prev.filter(i => i.id !== ideaId));
      setSelectedCompareIds(prev => prev.filter(id => id !== ideaId));
      return true;
    } catch (err: any) {
      console.error('Error deleting idea:', err);
      localDb.deleteIdea(ideaId, user.id);
      setIdeas(prev => prev.filter(i => i.id !== ideaId));
      setSelectedCompareIds(prev => prev.filter(id => id !== ideaId));
      return true;
    }
  };

  const getIdeaById = (id: string): StartupIdea | null => {
    return ideas.find(i => i.id === id) || (user ? localDb.getIdeaById(id, user.id) : null);
  };

  const fetchIdeaOrAnalysisById = async (id: string): Promise<StartupIdea | null> => {
    if (!id || typeof id !== 'string') return null;
    const cleanId = id.trim();

    // 1. Check in-memory ideas (by idea.id or by idea.analysis.id)
    const inMem = ideas.find(i => i.id === cleanId || i.analysis?.id === cleanId);
    if (inMem) return inMem;

    // 2. Check localDb ideas
    const allLocalIdeas = localDb.getAllIdeas();
    const localIdea = allLocalIdeas.find(i => i.id === cleanId || i.analysis?.id === cleanId);
    if (localIdea) {
      if (!localIdea.analysis) {
        const ana = localDb.getAnalysisByIdeaId(localIdea.id, user?.id || '');
        if (ana) localIdea.analysis = ana;
      }
      return localIdea;
    }

    // 3. Check localDb analyses
    const allLocalAnalyses = localDb.getAllAnalyses();
    const localAnalysis = allLocalAnalyses.find(a => a.id === cleanId || a.idea_id === cleanId);
    if (localAnalysis) {
      const associatedIdea = allLocalIdeas.find(i => i.id === localAnalysis.idea_id);
      if (associatedIdea) {
        return { ...associatedIdea, analysis: localAnalysis };
      }
      return {
        id: localAnalysis.idea_id || `idea-${localAnalysis.id}`,
        user_id: localAnalysis.user_id || user?.id || '',
        title: localAnalysis.executive_summary?.slice(0, 45) || 'Analyzed Startup Concept',
        description: localAnalysis.executive_summary || '',
        industry: 'Technology',
        target_audience: 'B2B / B2C',
        status: 'completed',
        created_at: localAnalysis.created_at,
        updated_at: localAnalysis.updated_at,
        analysis: localAnalysis,
      };
    }

    // 4. Check Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: anaData } = await supabase
          .from('analyses')
          .select('*, startup_ideas(*)')
          .or(`id.eq.${cleanId},idea_id.eq.${cleanId}`)
          .maybeSingle();

        if (anaData) {
          const rawAnalysis: FullAnalysis = {
            id: anaData.id,
            idea_id: anaData.idea_id,
            user_id: anaData.user_id,
            overall_score: anaData.overall_score,
            verdict: anaData.verdict,
            verdict_type: anaData.verdict_type,
            confidence_indicator: anaData.confidence_indicator,
            executive_summary: anaData.executive_summary,
            problem_score: anaData.problem_score,
            market_score: anaData.market_score,
            competition_score: anaData.competition_score,
            revenue_score: anaData.revenue_score,
            technical_score: anaData.technical_score,
            created_at: anaData.created_at,
            updated_at: anaData.updated_at,
            ...(anaData.raw_gemini_response || {}),
          };

          const rawIdea = anaData.startup_ideas;
          return {
            id: rawIdea?.id || anaData.idea_id,
            user_id: rawIdea?.user_id || anaData.user_id,
            title: rawIdea?.title || 'Analyzed Startup Concept',
            description: rawIdea?.description || rawAnalysis.executive_summary,
            industry: rawIdea?.industry || 'Technology',
            target_audience: rawIdea?.target_audience || 'General Market',
            status: 'completed',
            created_at: rawIdea?.created_at || anaData.created_at,
            updated_at: rawIdea?.updated_at || anaData.updated_at,
            analysis: rawAnalysis,
          };
        }

        const { data: ideaData } = await supabase
          .from('startup_ideas')
          .select('*, analyses(*)')
          .eq('id', cleanId)
          .maybeSingle();

        if (ideaData) {
          const rawAnalysis = ideaData.analyses && ideaData.analyses.length > 0 ? ideaData.analyses[0] : null;
          return {
            id: ideaData.id,
            user_id: ideaData.user_id,
            title: ideaData.title,
            description: ideaData.description,
            industry: ideaData.industry,
            target_audience: ideaData.target_audience,
            status: ideaData.status,
            created_at: ideaData.created_at,
            updated_at: ideaData.updated_at,
            analysis: rawAnalysis
              ? {
                  id: rawAnalysis.id,
                  idea_id: rawAnalysis.idea_id,
                  user_id: rawAnalysis.user_id,
                  overall_score: rawAnalysis.overall_score,
                  verdict: rawAnalysis.verdict,
                  verdict_type: rawAnalysis.verdict_type,
                  confidence_indicator: rawAnalysis.confidence_indicator,
                  executive_summary: rawAnalysis.executive_summary,
                  problem_score: rawAnalysis.problem_score,
                  market_score: rawAnalysis.market_score,
                  competition_score: rawAnalysis.competition_score,
                  revenue_score: rawAnalysis.revenue_score,
                  technical_score: rawAnalysis.technical_score,
                  created_at: rawAnalysis.created_at,
                  updated_at: rawAnalysis.updated_at,
                  ...(rawAnalysis.raw_gemini_response || {}),
                }
              : undefined,
          };
        }
      } catch (err) {
        console.warn('Supabase fetch error for id:', cleanId, err);
      }
    }

    return null;
  };

  const toggleCompareId = (id: string) => {
    setSelectedCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length >= 3) {
        // Cap at 3 for compare view
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const clearCompare = () => {
    setSelectedCompareIds([]);
  };

  const saveMarketResearchForIdea = (ideaId: string, record: MarketResearchRecord) => {
    localDb.saveMarketResearch(record);
    setIdeas(prev =>
      prev.map(item => {
        if (item.id === ideaId) {
          const updatedAnalysis = item.analysis
            ? { ...item.analysis, market_research: record }
            : undefined;
          return {
            ...item,
            market_research: record,
            analysis: updatedAnalysis,
          };
        }
        return item;
      })
    );
  };

  const saveFinancialProjectionForIdea = (ideaId: string, record: FinancialProjectionRecord) => {
    localDb.saveFinancialProjection(record);
    setIdeas(prev =>
      prev.map(item => {
        if (item.id === ideaId) {
          const updatedAnalysis = item.analysis
            ? { ...item.analysis, financial_projection: record }
            : undefined;
          return {
            ...item,
            financial_projection: record,
            analysis: updatedAnalysis,
          };
        }
        return item;
      })
    );
  };

  const saveCompetitorIntelligenceForIdea = (ideaId: string, record: CompetitorIntelligenceRecord) => {
    localDb.saveCompetitorIntelligence(record);
    setIdeas(prev =>
      prev.map(item => {
        if (item.id === ideaId) {
          const updatedAnalysis = item.analysis
            ? { ...item.analysis, competitor_intelligence: record }
            : undefined;
          return {
            ...item,
            competitor_intelligence: record,
            analysis: updatedAnalysis,
          };
        }
        return item;
      })
    );
  };

  return (
    <AnalysisContext.Provider
      value={{
        ideas,
        loading,
        isAnalyzing,
        analysisProgressStep,
        error,
        selectedCompareIds,
        refreshIdeas,
        createIdeaAndAnalyze,
        deleteIdea,
        getIdeaById,
        fetchIdeaOrAnalysisById,
        toggleCompareId,
        clearCompare,
        saveMarketResearchForIdea,
        saveFinancialProjectionForIdea,
        saveCompetitorIntelligenceForIdea,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) throw new Error('useAnalysis must be used within an AnalysisProvider');
  return context;
};
