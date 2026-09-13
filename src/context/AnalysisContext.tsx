import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StartupIdea, FullAnalysis, AnalysisRequestPayload } from '../types/analysis';
import { useAuth } from './AuthContext';
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
  toggleCompareId: (id: string) => void;
  clearCompare: () => void;
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
    try {
      if (isSupabaseConfigured && supabase) {
        // Fetch ideas and nested analyses from Supabase
        const { data: dbIdeas, error: ideasError } = await supabase
          .from('startup_ideas')
          .select('*, analyses(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!ideasError && dbIdeas) {
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
            };
          });

          setIdeas(formatted);
          setLoading(false);
          return;
        }
      }

      // Local storage fallback
      const localList = localDb.getIdeas(user.id);
      // Attach analyses
      const enriched = localList.map(item => {
        const analysis = localDb.getAnalysisByIdeaId(item.id, user.id);
        return {
          ...item,
          analysis: analysis || undefined,
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

    const ideaId = 'idea_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const analysisId = 'analysis_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
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

    // Save initial idea record
    localDb.saveIdea(newIdea);
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

      const fullAnalysis: FullAnalysis = {
        id: analysisId,
        idea_id: ideaId,
        user_id: user.id,
        overall_score: rawAiData.overall_score,
        verdict: rawAiData.verdict,
        verdict_type: rawAiData.verdict_type,
        confidence_indicator: rawAiData.confidence_indicator,
        executive_summary: rawAiData.executive_summary,
        problem_score: rawAiData.problem_score,
        market_score: rawAiData.market_score,
        competition_score: rawAiData.competition_score,
        revenue_score: rawAiData.revenue_score,
        technical_score: rawAiData.technical_score,
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

      // Save locally
      localDb.saveAnalysis(fullAnalysis);

      // If Supabase is connected, write records to PostgreSQL tables
      if (isSupabaseConfigured && supabase) {
        try {
          // Insert into startup_ideas
          await supabase.from('startup_ideas').upsert({
            id: ideaId,
            user_id: user.id,
            title: payload.title,
            description: payload.description,
            industry: payload.industry,
            target_audience: payload.target_audience,
            additional_info: payload.additional_info,
            status: 'completed',
          });

          // Insert into analyses table
          await supabase.from('analyses').upsert({
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

          // Sub-tables
          if (rawAiData.market_analysis) {
            await supabase.from('market_analysis').insert({
              analysis_id: analysisId,
              tam: rawAiData.market_analysis.tam,
              sam: rawAiData.market_analysis.sam,
              som: rawAiData.market_analysis.som,
              demand_score: rawAiData.market_analysis.demand_score,
              growth_potential: rawAiData.market_analysis.growth_potential,
              market_trends: rawAiData.market_analysis.market_trends,
              key_insights: rawAiData.market_analysis.key_insights,
            });
          }

          if (rawAiData.competitor_analysis?.competitors) {
            for (const c of rawAiData.competitor_analysis.competitors) {
              await supabase.from('competitors').insert({
                analysis_id: analysisId,
                name: c.name,
                description: c.description,
                strengths: c.strengths,
                weaknesses: c.weaknesses,
                target_customer: c.target_customer,
                differentiation_opportunity: c.differentiation_opportunity,
              });
            }
          }

          if (rawAiData.risks) {
            for (const r of rawAiData.risks) {
              await supabase.from('risks').insert({
                analysis_id: analysisId,
                category: r.category,
                description: r.description,
                severity: r.severity,
                probability: r.probability,
                impact: r.impact,
                mitigation: r.mitigation,
              });
            }
          }
        } catch (supabaseErr) {
          console.warn('Supabase insertion notice (saved safely in local storage):', supabaseErr);
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

      // Mark idea as failed
      const failedIdea: StartupIdea = {
        ...newIdea,
        status: 'failed',
      };
      localDb.saveIdea(failedIdea);
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
      if (isSupabaseConfigured && supabase) {
        await supabase.from('startup_ideas').delete().eq('id', ideaId);
      }
      localDb.deleteIdea(ideaId, user.id);
      setIdeas(prev => prev.filter(i => i.id !== ideaId));
      setSelectedCompareIds(prev => prev.filter(id => id !== ideaId));
      return true;
    } catch (err) {
      console.error('Error deleting idea:', err);
      return false;
    }
  };

  const getIdeaById = (id: string): StartupIdea | null => {
    return ideas.find(i => i.id === id) || (user ? localDb.getIdeaById(id, user.id) : null);
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
        toggleCompareId,
        clearCompare,
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
