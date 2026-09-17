import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { runStartupIdeaAnalysis } from './server/geminiService.ts';
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

  // 3. VentureLens AI Advisor Conversational Endpoint
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
