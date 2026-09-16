import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { runStartupIdeaAnalysis } from './server/geminiService.ts';

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
