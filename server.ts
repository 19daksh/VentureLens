import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
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
  streamAdvisorResponse,
  fetchVerifiedAnalysis,
  AnalysisContextData,
  ChatMessage,
} from './server/advisorService.ts';

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
    try {
      const { analysisId, ideaData, clientContext } = req.body;

      const title = ideaData?.title || clientContext?.title;
      const description = ideaData?.description || clientContext?.description;
      const industry = ideaData?.industry || clientContext?.industry;
      const target_audience = ideaData?.target_audience || clientContext?.target_audience;
      const business_model = ideaData?.business_model || clientContext?.recommended_business_model;

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          error: 'Please provide valid startup details (title and description) for market research.',
        });
      }

      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const isDemoSession = token === 'demo-token' || clientContext?.isDemo;

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
      // Persist to Supabase if token and analysisId are available
      if (token && !isDemoSession && analysisId) {
        const userId = req.body.userId || clientContext?.user_id;
        if (userId) {
          savedRecord = await saveMarketResearchToSupabase({
            analysisId,
            userId,
            userToken: token,
            researchData,
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: savedRecord || {
          analysis_id: analysisId || 'local',
          research_data: researchData,
          researched_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('[VentureLens AI] Market Research Error:', error);
      const isUnavailable =
        error?.message?.includes('temporarily') ||
        error?.message?.includes('quota') ||
        error?.message?.includes('Search grounding');

      return res.status(503).json({
        success: false,
        error: isUnavailable
          ? 'Market research is temporarily unavailable. Your existing VentureLens analysis is still available.'
          : error?.message || 'Market research is temporarily unavailable. Your existing VentureLens analysis is still available.',
        canRetry: true,
      });
    }
  });

  // 4. Fetch saved market research for an analysis
  app.get('/api/market-research/:analysisId', async (req, res) => {
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

  // 6. VentureLens AI Advisor Conversational Endpoint
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VentureLens AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[VentureLens AI] Fatal server startup error:', err);
});
