import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { runStartupIdeaAnalysis } from './server/geminiService.ts';
import {
  executeMarketResearch,
  saveMarketResearchToSupabase,
  getMarketResearchFromSupabase,
} from './server/marketResearchService.ts';
import {
  generateAiFinancialInsights,
  suggestFinancialAssumptionsWithGemini,
  saveFinancialProjectionToSupabase,
  getFinancialProjectionFromSupabase,
} from './server/financialProjectionService.ts';
import {
  executeCompetitorIntelligence,
  saveCompetitorIntelligenceToSupabase,
  getCompetitorIntelligenceFromSupabase,
  saveCompetitorTrackingToSupabase,
} from './server/competitorIntelligenceService.ts';
import {
  streamAdvisorResponse,
  fetchVerifiedAnalysis,
  AnalysisContextData,
  ChatMessage,
} from './server/advisorService.ts';
import {
  createVoiceEphemeralToken,
  generateVoiceGreeting,
  generateVoiceTurnResponse,
} from './server/voiceAdvisorService.ts';
import { setupVoiceAdvisorWebSocketServer } from './server/voiceAdvisorWsBridge.ts';

// Load environment variables
dotenv.config();

const rootDir = process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parsing
  app.use(express.json({ limit: '5mb' }));

  // Favicon handler to prevent 404 console errors
  app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'favicon.svg'));
  });

  // 1. Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'VentureLens AI Server',
      timestamp: new Date().toISOString(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  // 2. Startup Idea Analysis endpoint
  app.post('/api/analyze', async (req, res) => {
    try {
      const { title, description, industry, target_audience, additional_info, userId } = req.body;

      // Basic input validation
      if (!title || typeof title !== 'string' || title.trim().length < 2) {
        return res.status(400).json({ error: 'Please provide a valid startup title (minimum 2 characters).' });
      }
      if (!description || typeof description !== 'string' || description.trim().length < 15) {
        return res.status(400).json({ error: 'Please provide a comprehensive idea description (minimum 15 characters).' });
      }
      if (!industry || typeof industry !== 'string') {
        return res.status(400).json({ error: 'Please select an industry.' });
      }
      if (!target_audience || typeof target_audience !== 'string') {
        return res.status(400).json({ error: 'Please describe the target audience.' });
      }

      console.log(`[VentureLens AI] Analyzing startup idea: "${title}" in "${industry}"...`);

      // Execute structured Gemini analysis with error isolation
      const analysisResult = await runStartupIdeaAnalysis({
        title: title.trim(),
        description: description.trim(),
        industry: industry.trim(),
        target_audience: target_audience.trim(),
        additional_info: additional_info ? String(additional_info).trim() : undefined,
        userId,
      });

      console.log(`[VentureLens AI] Analysis complete. Overall score: ${analysisResult.overall_score}/100, Verdict: ${analysisResult.verdict_type}`);

      return res.status(200).json({
        success: true,
        data: analysisResult,
      });
    } catch (error: any) {
      console.error('[VentureLens AI] Analysis Error:', error);
      const errorMessage = error?.message || 'Failed to complete startup evaluation.';

      return res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // 3. Real-Time Market Research Endpoint with Google Search Grounding
  app.post('/api/market-research', async (req, res) => {
    // Explicitly guarantee Content-Type: application/json
    res.setHeader('Content-Type', 'application/json');

    try {
      const { analysisId, ideaData, clientContext } = req.body;

      const title = ideaData?.title || clientContext?.title || req.body.title;
      const description = ideaData?.description || clientContext?.description || req.body.description;
      const industry = ideaData?.industry || clientContext?.industry || req.body.industry;
      const target_audience = ideaData?.target_audience || clientContext?.target_audience || req.body.target_audience;
      const business_model = ideaData?.business_model || clientContext?.recommended_business_model || req.body.business_model;

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          error: 'Please provide valid startup details (title and description) for market research.',
          details: 'Missing required startup title or description in request payload.',
        });
      }

      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const isDemoSession = token === 'demo-token' || clientContext?.isDemo;
      let authenticatedUserId: string | null = null;

      // Authenticate user & verify ownership against database (do not trust user-supplied analysis data)
      if (token && !isDemoSession) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false },
            global: { headers: { Authorization: `Bearer ${token}` } },
          });

          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser(token);

          if (userError || !user) {
            return res.status(401).json({
              success: false,
              error: 'Authentication required. Please log in to run market research.',
              details: userError?.message || 'Invalid or expired user session token.',
            });
          }

          authenticatedUserId = user.id;

          // Verify ownership if an existing analysisId was provided
          if (analysisId && typeof analysisId === 'string' && analysisId !== 'local' && !analysisId.startsWith('local-')) {
            const { data: analysisRows, error: analysisQueryError } = await supabase
              .from('analyses')
              .select('id, user_id, startup_ideas(id, user_id)')
              .or(`id.eq.${analysisId},idea_id.eq.${analysisId}`)
              .limit(1);

            if (!analysisQueryError && analysisRows && analysisRows.length > 0) {
              const analysisRecord = analysisRows[0];
              const ideaRecord = (analysisRecord.startup_ideas as any);
              const isOwner =
                analysisRecord.user_id === user.id ||
                ideaRecord?.user_id === user.id;

              if (!isOwner) {
                return res.status(403).json({
                  success: false,
                  error: 'Unauthorized: You do not have permission to run market research on this analysis.',
                  details: 'Startup analysis does not belong to the authenticated user.',
                });
              }
            }
          }
        }
      }

      console.log(`[VentureLens AI] Starting Google Search grounded market research for: "${title}" (${industry})...`);

      const researchData = await executeMarketResearch({
        title,
        description,
        industry: industry || 'Technology',
        target_audience: target_audience || 'General Market',
        business_model,
        existing_analysis: clientContext
          ? {
              tam: clientContext.tam,
              sam: clientContext.sam,
              som: clientContext.som,
              overall_score: clientContext.overall_score,
              verdict_type: clientContext.verdict_type,
              competitors: clientContext.competitors,
            }
          : undefined,
      });

      console.log(`[VentureLens AI] Market research completed successfully. Extracted ${researchData.trends.length} trends, ${researchData.competitors.length} competitors, ${researchData.sources.length} sources.`);

      let savedRecord: any = null;
      // Persist to Supabase if authenticated and analysisId are available
      if (token && !isDemoSession && analysisId && authenticatedUserId) {
        savedRecord = await saveMarketResearchToSupabase({
          analysisId,
          userId: authenticatedUserId,
          userToken: token,
          researchData,
        });
      }

      // Return both requested response structures: exact prompt specification (research) and app internal (data)
      return res.status(200).json({
        success: true,
        research: {
          marketOverview: researchData.market_overview?.summary || '',
          marketTrends: researchData.trends || [],
          customerDemandSignals: researchData.customer_demand || [],
          competitorLandscape: researchData.competitors || [],
          competitiveGaps: researchData.competitive_gaps || [],
          marketOpportunities: researchData.opportunities || [],
          marketThreats: researchData.threats || [],
          recentDevelopments: researchData.recent_developments || [],
          sources: researchData.sources || [],
        },
        data: savedRecord || {
          id: 'mr-' + Date.now(),
          analysis_id: analysisId || 'local',
          user_id: authenticatedUserId || (isDemoSession ? '00000000-0000-4000-8000-000000000001' : 'local'),
          research_data: researchData,
          researched_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('[VentureLens AI] Market Research Error:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(error.statusCode || 500).json({
        success: false,
        error: 'Market research service is temporarily unavailable. Please try again.',
        details: error?.message || 'An unexpected error occurred during market research execution.',
        canRetry: true,
      });
    }
  });

  // 4. Fetch saved market research for an analysis
  app.get('/api/market-research/:analysisId', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const { analysisId } = req.params;
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

      if (!token || token === 'demo-token') {
        return res.status(200).json({ success: true, data: null });
      }

      const record = await getMarketResearchFromSupabase({
        analysisId,
        userToken: token,
      });

      return res.status(200).json({ success: true, data: record });
    } catch (err: any) {
      console.error('[VentureLens AI] Fetch Market Research Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Financial Projection Simulator Endpoints
  // Save or update financial projection
  app.post('/api/financial-projection', async (req, res) => {
    try {
      const projectionRecord = req.body;
      if (!projectionRecord || !projectionRecord.analysis_id) {
        return res.status(400).json({ success: false, error: 'Missing analysis_id or projection data' });
      }

      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const isDemo = token === 'demo-token';

      if (!isDemo && token) {
        await saveFinancialProjectionToSupabase(projectionRecord);
      }

      return res.status(200).json({ success: true, data: projectionRecord });
    } catch (err: any) {
      console.error('[VentureLens AI] Save Financial Projection Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Fetch saved financial projection
  app.get('/api/financial-projection/:analysisId', async (req, res) => {
    try {
      const { analysisId } = req.params;
      const record = await getFinancialProjectionFromSupabase(analysisId);
      return res.status(200).json({ success: true, data: record });
    } catch (err: any) {
      console.error('[VentureLens AI] Fetch Financial Projection Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Generate AI Financial Insights (grounded in deterministic simulation outputs)
  app.post('/api/financial-projection/ai-insights', async (req, res) => {
    try {
      const {
        ideaTitle,
        industry,
        businessModel,
        currency,
        periodMonths,
        assumptions,
        summaryMetrics,
        unitEconomics,
        fundingAnalysis,
        scenarios,
      } = req.body;

      if (!assumptions || !summaryMetrics) {
        return res.status(400).json({ success: false, error: 'Incomplete simulation model provided for AI insights.' });
      }

      const insights = await generateAiFinancialInsights({
        ideaTitle: ideaTitle || 'Early-Stage Venture',
        industry: industry || 'Technology',
        businessModel: businessModel || 'Subscription SaaS',
        currency: currency || 'INR',
        periodMonths: periodMonths || 36,
        assumptions,
        summaryMetrics,
        unitEconomics: unitEconomics || {},
        fundingAnalysis: fundingAnalysis || {},
        scenarios: scenarios || {},
      });

      return res.status(200).json({ success: true, data: insights });
    } catch (err: any) {
      console.error('[VentureLens AI] AI Financial Insights Error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to generate financial insights.' });
    }
  });

  // Suggest Financial Assumptions via Gemini
  app.post('/api/financial-projection/suggest-assumptions', async (req, res) => {
    try {
      const { title, description, industry, targetAudience, businessModel, currency } = req.body;

      const result = await suggestFinancialAssumptionsWithGemini({
        title: title || 'Startup Idea',
        description: description || '',
        industry: industry || 'Technology',
        targetAudience: targetAudience || 'Target Customers',
        businessModel,
        currency: currency || 'INR',
      });

      return res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      console.error('[VentureLens AI] Suggest Assumptions Error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to suggest assumptions.' });
    }
  });

  // 6. Real-Time Competitor Intelligence Endpoint with Google Search Grounding
  app.post('/api/competitor-intelligence', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const { analysisId, ideaData, clientContext, previousIntelligence } = req.body;

      const title = ideaData?.title || clientContext?.title || req.body.title;
      const description = ideaData?.description || clientContext?.description || req.body.description;
      const industry = ideaData?.industry || clientContext?.industry || req.body.industry;
      const target_audience = ideaData?.target_audience || clientContext?.target_audience || req.body.target_audience;
      const business_model = ideaData?.business_model || clientContext?.recommended_business_model || req.body.business_model;
      const existing_competitors = ideaData?.existing_competitors || clientContext?.competitors || req.body.existing_competitors || [];

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          error: 'Please provide valid startup details (title and description) for competitor intelligence.',
        });
      }

      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const isDemoSession = token === 'demo-token' || clientContext?.isDemo;
      let authenticatedUserId: string | null = null;

      // Authenticate with Supabase server-side if token is provided
      if (token && !isDemoSession) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false },
            global: {
              headers: { Authorization: `Bearer ${token}` },
            },
          });

          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser(token);

          if (userError || !user) {
            return res.status(401).json({
              success: false,
              error: 'Authentication required. Please log in to run competitor intelligence.',
              details: userError?.message || 'Invalid or expired user session token.',
            });
          }

          authenticatedUserId = user.id;

          // Verify ownership if an existing analysisId was provided
          if (analysisId && typeof analysisId === 'string' && analysisId !== 'local' && !analysisId.startsWith('local-')) {
            const { data: analysisRows, error: analysisQueryError } = await supabase
              .from('analyses')
              .select('id, user_id, startup_ideas(id, user_id)')
              .or(`id.eq.${analysisId},idea_id.eq.${analysisId}`)
              .limit(1);

            if (!analysisQueryError && analysisRows && analysisRows.length > 0) {
              const analysisRecord = analysisRows[0];
              const ideaRecord = (analysisRecord.startup_ideas as any);
              const isOwner =
                analysisRecord.user_id === user.id ||
                ideaRecord?.user_id === user.id;

              if (!isOwner) {
                return res.status(403).json({
                  success: false,
                  error: 'Unauthorized: You do not have permission to run competitor intelligence on this analysis.',
                  details: 'Startup analysis does not belong to the authenticated user.',
                });
              }
            }
          }
        }
      }

      console.log(`[VentureLens AI] Starting Google Search grounded competitor intelligence for: "${title}"...`);

      const intelligenceData = await executeCompetitorIntelligence({
        title,
        description,
        industry: industry || 'Technology',
        target_audience: target_audience || 'General Market',
        business_model,
        existing_competitors,
        existing_analysis: clientContext
          ? {
              tam: clientContext.tam,
              overall_score: clientContext.overall_score,
              verdict_type: clientContext.verdict_type,
            }
          : undefined,
        previous_intelligence: previousIntelligence,
      });

      console.log(
        `[VentureLens AI] Competitor intelligence completed: ${intelligenceData.competitors.length} competitors, ${intelligenceData.feature_matrix.length} features, ${intelligenceData.sources.length} sources.`
      );

      let savedRecord: any = null;
      if (token && !isDemoSession && analysisId && authenticatedUserId) {
        savedRecord = await saveCompetitorIntelligenceToSupabase({
          analysisId,
          userId: authenticatedUserId,
          userToken: token,
          researchData: intelligenceData,
        });
      }

      return res.status(200).json({
        success: true,
        intelligence: intelligenceData,
        data: savedRecord || {
          id: `ci-${analysisId || 'local'}-${Date.now()}`,
          analysis_id: analysisId || 'local',
          user_id: authenticatedUserId || (isDemoSession ? '00000000-0000-4000-8000-000000000001' : 'local'),
          research_data: intelligenceData,
          intelligence_data: intelligenceData,
          researched_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('[VentureLens AI] Competitor Intelligence Error:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(error?.statusCode || 500).json({
        success: false,
        error: 'Competitor intelligence service is temporarily unavailable. Please try again.',
        details: error?.message || 'An unexpected error occurred during competitor intelligence execution.',
        canRetry: true,
      });
    }
  });

  // Fetch saved competitor intelligence for an analysis
  app.get('/api/competitor-intelligence/:analysisId', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const { analysisId } = req.params;
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

      if (!token || token === 'demo-token') {
        return res.status(200).json({ success: true, data: null });
      }

      // Verify user token with Supabase
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false },
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        });

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser(token);

        if (userError || !user) {
          return res.status(401).json({ success: false, error: 'Unauthorized session.' });
        }

        // Verify ownership
        if (analysisId && analysisId !== 'local' && !analysisId.startsWith('local-')) {
          const { data: analysisRows } = await supabase
            .from('analyses')
            .select('id, user_id, startup_ideas(id, user_id)')
            .or(`id.eq.${analysisId},idea_id.eq.${analysisId}`)
            .limit(1);

          if (analysisRows && analysisRows.length > 0) {
            const analysisRecord = analysisRows[0];
            const ideaRecord = (analysisRecord.startup_ideas as any);
            const isOwner =
              analysisRecord.user_id === user.id ||
              ideaRecord?.user_id === user.id;

            if (!isOwner) {
              return res.status(403).json({ success: false, error: 'Forbidden: Access denied to this analysis.' });
            }
          }
        }
      }

      const record = await getCompetitorIntelligenceFromSupabase({
        analysisId,
        userToken: token,
      });

      return res.status(200).json({ success: true, data: record });
    } catch (err: any) {
      console.error('[VentureLens AI] Fetch Competitor Intelligence Error:', err);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Toggle competitor tracking/pinned state
  app.post('/api/competitor-intelligence/track', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const { analysisId, competitorId, isPinned } = req.body;
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

      if (!analysisId || !competitorId) {
        return res.status(400).json({ success: false, error: 'Missing analysisId or competitorId' });
      }

      if (token && token !== 'demo-token') {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false },
            global: {
              headers: { Authorization: `Bearer ${token}` },
            },
          });

          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser(token);

          if (userError || !user) {
            return res.status(401).json({ success: false, error: 'Unauthorized.' });
          }

          await saveCompetitorTrackingToSupabase({
            analysisId,
            userId: user.id,
            userToken: token,
            competitorId,
            isPinned: Boolean(isPinned),
          });
        }
      }

      return res.status(200).json({ success: true, isPinned: Boolean(isPinned) });
    } catch (err: any) {
      console.error('[VentureLens AI] Competitor Tracking Error:', err);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. VentureLens AI Advisor Conversational Endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history = [], analysisId, stream = true, clientContext } = req.body;

      // Validate message
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }

      if (message.length > 2500) {
        return res.status(400).json({ error: 'Message exceeds maximum length of 2500 characters.' });
      }

      let analysisContext: AnalysisContextData | null = null;

      // If an analysisId is specified, verify authentication & ownership
      if (analysisId && typeof analysisId === 'string') {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

        const isDemoSession = token === 'demo-token' || (clientContext && clientContext.isDemo);

        if (!token && !isDemoSession) {
          return res.status(401).json({
            error: 'Authentication required to access saved startup analysis. Please log in.',
          });
        }

        if (token && !isDemoSession) {
          const { context, authorized, error: authErr } = await fetchVerifiedAnalysis(analysisId, token);
          if (!authorized) {
            return res.status(403).json({
              error: authErr || 'Unauthorized: You do not have permission to view or discuss this analysis.',
            });
          }
          analysisContext = context;
        } else if (isDemoSession && clientContext) {
          analysisContext = clientContext;
        }
      }

      // Safe history validation (limit to last 10 messages)
      const sanitizedHistory: ChatMessage[] = Array.isArray(history)
        ? history
            .filter((h: any) => h && (h.role === 'user' || h.role === 'model') && typeof h.text === 'string')
            .slice(-10)
            .map((h: any) => ({
              role: h.role,
              text: String(h.text).slice(0, 3000),
            }))
        : [];

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        try {
          await streamAdvisorResponse({
            message: message.trim(),
            history: sanitizedHistory,
            analysisContext,
            onChunk: (chunk: string) => {
              res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            },
          });
          res.write('data: [DONE]\n\n');
          res.end();
        } catch (streamErr: any) {
          console.error('[VentureLens Chat] Stream generation error:', streamErr);
          res.write(`data: ${JSON.stringify({ error: 'VentureLens AI is temporarily unavailable. Please try again.' })}\n\n`);
          res.end();
        }
      } else {
        let fullText = '';
        await streamAdvisorResponse({
          message: message.trim(),
          history: sanitizedHistory,
          analysisContext,
          onChunk: (chunk: string) => {
            fullText += chunk;
          },
        });
        return res.json({ success: true, text: fullText });
      }
    } catch (error: any) {
      console.error('[VentureLens Chat] Top-level handler error:', error);
      return res.status(500).json({
        error: 'VentureLens AI is temporarily unavailable. Please try again.',
      });
    }
  });

  // 12. Real-Time Voice Advisor Ephemeral Token Endpoint
  app.post('/api/advisor/voice-token', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const { analysisId, clientContext, voiceName = 'Puck' } = req.body;
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

      let analysisContext: AnalysisContextData | null = null;

      // Ownership and authentication verification:
      // If a Supabase user token is provided with an analysisId, verify ownership securely:
      if (analysisId && typeof analysisId === 'string' && token && token !== 'demo-token') {
        try {
          const { context, authorized } = await fetchVerifiedAnalysis(analysisId, token);
          if (authorized && context) {
            analysisContext = context;
          } else if (clientContext) {
            analysisContext = clientContext;
          }
        } catch {
          if (clientContext) {
            analysisContext = clientContext;
          }
        }
      } else if (clientContext) {
        analysisContext = clientContext;
      }

      console.log(`[Voice Advisor] Generating ephemeral session token for analysis: "${analysisContext?.title || 'General Advisor'}" (Voice: ${voiceName})...`);

      const { token: ephemeralToken, systemInstruction } = await createVoiceEphemeralToken({
        analysisContext,
        voiceName,
      });

      return res.status(200).json({
        success: true,
        token: ephemeralToken,
        systemInstruction,
        activeIdeaSummary: analysisContext
          ? {
              title: analysisContext.title,
              overallScore: analysisContext.overall_score,
              verdictType: analysisContext.verdict_type,
            }
          : null,
      });
    } catch (error: any) {
      console.error('[Voice Advisor] Ephemeral token creation error:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to initialize real-time voice advisor session.',
      });
    }
  });

  // 13. Voice Advisor Opening Spoken Greeting
  app.post('/api/advisor/voice-greeting', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const { analysisId, clientContext, voiceName = 'Puck' } = req.body;
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

      let analysisContext: AnalysisContextData | null = null;
      if (analysisId && typeof analysisId === 'string' && token && token !== 'demo-token') {
        try {
          const { context, authorized } = await fetchVerifiedAnalysis(analysisId, token);
          if (authorized && context) {
            analysisContext = context;
          } else if (clientContext) {
            analysisContext = clientContext;
          }
        } catch {
          if (clientContext) analysisContext = clientContext;
        }
      } else if (clientContext) {
        analysisContext = clientContext;
      }

      const greeting = await generateVoiceGreeting({
        analysisContext,
        voiceName,
      });

      return res.status(200).json({
        success: true,
        text: greeting.text,
        audio: greeting.audio,
      });
    } catch (err: any) {
      console.error('[Voice Advisor Greeting] Error:', err);
      return res.status(200).json({
        success: true,
        text: 'Hello founder! I am your VentureLens Voice Advisor. What aspect of your startup shall we review?',
        audio: null,
      });
    }
  });

  // 14. Voice Advisor Spoken Turn Endpoint
  app.post('/api/advisor/voice-turn', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const { userTranscript, history = [], analysisId, clientContext, voiceName = 'Puck' } = req.body;
      if (!userTranscript || typeof userTranscript !== 'string' || !userTranscript.trim()) {
        return res.status(400).json({ success: false, error: 'User transcript cannot be empty.' });
      }

      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

      let analysisContext: AnalysisContextData | null = null;
      if (analysisId && typeof analysisId === 'string' && token && token !== 'demo-token') {
        try {
          const { context, authorized } = await fetchVerifiedAnalysis(analysisId, token);
          if (authorized && context) {
            analysisContext = context;
          } else if (clientContext) {
            analysisContext = clientContext;
          }
        } catch {
          if (clientContext) analysisContext = clientContext;
        }
      } else if (clientContext) {
        analysisContext = clientContext;
      }

      const turnResult = await generateVoiceTurnResponse({
        userTranscript: userTranscript.trim(),
        history,
        analysisContext,
        voiceName,
      });

      return res.status(200).json({
        success: true,
        text: turnResult.text,
        audio: turnResult.audio,
      });
    } catch (err: any) {
      console.error('[Voice Advisor Turn] Error:', err);
      return res.status(200).json({
        success: true,
        text: 'I understand your point. Let us examine how that impacts your market positioning and customer acquisition costs.',
        audio: null,
      });
    }
  });

  // 404 Handler for all API routes - Guarantees that /api/* NEVER returns an HTML page
  app.all('/api/*', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(404).json({
      success: false,
      error: `API route not found: ${req.method} ${req.path}`,
      details: 'The requested API endpoint does not exist. All API endpoints return JSON.',
    });
  });

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Create unified HTTP + WebSocket server for container ingress on port 3000
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/api/advisor/voice-ws' });
  setupVoiceAdvisorWebSocketServer(wss);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[VentureLens AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[VentureLens AI] Fatal server startup error:', err);
});
