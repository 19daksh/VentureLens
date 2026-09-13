import { GoogleGenAI, Type } from '@google/genai';
import { AnalysisRequestPayload, FullAnalysis } from '../src/types/analysis';

// Initialize Gemini SDK with User-Agent header for telemetry as required
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// JSON Schema definition for Gemini responseSchema
const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    overall_score: {
      type: Type.INTEGER,
      description: 'Overall startup validation score from 0 to 100 based on rigorous holistic evaluation.',
    },
    verdict: {
      type: Type.STRING,
      description: 'A 1-2 sentence definitive verdict summarizing whether and how the founder should proceed.',
    },
    verdict_type: {
      type: Type.STRING,
      description: 'Must be exactly one of: "Build", "Improve", or "Pivot".',
    },
    confidence_indicator: {
      type: Type.STRING,
      description: 'E.g. "High Confidence (94% market signal match)" or "Moderate Confidence".',
    },
    executive_summary: {
      type: Type.STRING,
      description: 'A punchy 3-4 sentence executive summary of the venture opportunity, main customer pain point, and feasibility.',
    },
    problem_validation: {
      type: Type.OBJECT,
      properties: {
        problem_strength_score: { type: Type.INTEGER },
        problem_severity: { type: Type.STRING, description: 'Critical, High, Moderate, or Low' },
        frequency: { type: Type.STRING, description: 'Daily, Weekly, Occasional, or Rare' },
        existing_alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
        customer_pain_points: { type: Type.ARRAY, items: { type: Type.STRING } },
        validation_insights: { type: Type.STRING },
      },
      required: ['problem_strength_score', 'problem_severity', 'frequency', 'existing_alternatives', 'customer_pain_points', 'validation_insights'],
    },
    market_analysis: {
      type: Type.OBJECT,
      properties: {
        market_opportunity_score: { type: Type.INTEGER },
        tam: { type: Type.STRING, description: 'Total Addressable Market estimate with labeled source or calculation assumptions' },
        sam: { type: Type.STRING, description: 'Serviceable Addressable Market estimate' },
        som: { type: Type.STRING, description: 'Serviceable Obtainable Market estimate (years 1-3)' },
        demand_score: { type: Type.INTEGER },
        growth_potential: { type: Type.STRING, description: 'E.g. High Growth (28% CAGR), Moderate, Niche' },
        market_trends: { type: Type.ARRAY, items: { type: Type.STRING } },
        key_insights: { type: Type.STRING },
      },
      required: ['market_opportunity_score', 'tam', 'sam', 'som', 'demand_score', 'growth_potential', 'market_trends', 'key_insights'],
    },
    competitor_analysis: {
      type: Type.OBJECT,
      properties: {
        competition_score: { type: Type.INTEGER },
        competitive_landscape_summary: { type: Type.STRING },
        differentiation_strategy: { type: Type.STRING },
        competitors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              target_customer: { type: Type.STRING },
              differentiation_opportunity: { type: Type.STRING },
            },
            required: ['name', 'description', 'strengths', 'weaknesses', 'target_customer', 'differentiation_opportunity'],
          },
        },
      },
      required: ['competition_score', 'competitive_landscape_summary', 'differentiation_strategy', 'competitors'],
    },
    business_model: {
      type: Type.OBJECT,
      properties: {
        recommended_business_model: { type: Type.STRING },
        customer_segment: { type: Type.STRING },
        pricing_strategy: { type: Type.STRING },
        revenue_streams: { type: Type.ARRAY, items: { type: Type.STRING } },
        monetization_strategy: { type: Type.STRING },
        unit_economics_considerations: { type: Type.STRING },
        revenue_potential_score: { type: Type.INTEGER },
      },
      required: ['recommended_business_model', 'customer_segment', 'pricing_strategy', 'revenue_streams', 'monetization_strategy', 'unit_economics_considerations', 'revenue_potential_score'],
    },
    technical_feasibility: {
      type: Type.OBJECT,
      properties: {
        technical_feasibility_score: { type: Type.INTEGER },
        recommended_technology_direction: { type: Type.STRING },
        major_technical_requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
        complexity: { type: Type.STRING, description: 'Low, Medium, High, or Very High' },
        scalability_considerations: { type: Type.STRING },
        technical_risks: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['technical_feasibility_score', 'recommended_technology_direction', 'major_technical_requirements', 'complexity', 'scalability_considerations', 'technical_risks'],
    },
    risks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          description: { type: Type.STRING },
          severity: { type: Type.STRING, description: 'Critical, High, Medium, or Low' },
          probability: { type: Type.STRING, description: 'High, Medium, or Low' },
          impact: { type: Type.STRING, description: 'High, Medium, or Low' },
          mitigation: { type: Type.STRING },
        },
        required: ['category', 'description', 'severity', 'probability', 'impact', 'mitigation'],
      },
    },
    mvp_roadmap: {
      type: Type.OBJECT,
      properties: {
        phases: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phase: { type: Type.STRING },
              duration: { type: Type.STRING },
              features: { type: Type.ARRAY, items: { type: Type.STRING } },
              goal: { type: Type.STRING },
              priority: { type: Type.STRING },
            },
            required: ['phase', 'duration', 'features', 'goal', 'priority'],
          },
        },
        must_have_features: { type: Type.ARRAY, items: { type: Type.STRING } },
        nice_to_have_features: { type: Type.ARRAY, items: { type: Type.STRING } },
        future_features: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['phases', 'must_have_features', 'nice_to_have_features', 'future_features'],
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING },
          priority: { type: Type.STRING, description: 'Immediate, High, Medium, or Low' },
          category: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['action', 'priority', 'category', 'reason'],
      },
    },
    go_to_market: {
      type: Type.OBJECT,
      properties: {
        initial_target_customer: { type: Type.STRING },
        acquisition_channels: { type: Type.ARRAY, items: { type: Type.STRING } },
        launch_strategy: { type: Type.STRING },
        positioning: { type: Type.STRING },
        early_validation_strategy: { type: Type.STRING },
      },
      required: ['initial_target_customer', 'acquisition_channels', 'launch_strategy', 'positioning', 'early_validation_strategy'],
    },
    final_verdict: {
      type: Type.OBJECT,
      properties: {
        overall_score: { type: Type.INTEGER },
        verdict: { type: Type.STRING },
        verdict_type: { type: Type.STRING },
        confidence_indicator: { type: Type.STRING },
        strongest_aspects: { type: Type.ARRAY, items: { type: Type.STRING } },
        weakest_aspects: { type: Type.ARRAY, items: { type: Type.STRING } },
        biggest_risk: { type: Type.STRING },
        recommended_next_step: { type: Type.STRING },
      },
      required: ['overall_score', 'verdict', 'verdict_type', 'confidence_indicator', 'strongest_aspects', 'weakest_aspects', 'biggest_risk', 'recommended_next_step'],
    },
  },
  required: [
    'overall_score',
    'verdict',
    'verdict_type',
    'confidence_indicator',
    'executive_summary',
    'problem_validation',
    'market_analysis',
    'competitor_analysis',
    'business_model',
    'technical_feasibility',
    'risks',
    'mvp_roadmap',
    'recommendations',
    'go_to_market',
    'final_verdict',
  ],
};

export async function runStartupIdeaAnalysis(payload: AnalysisRequestPayload): Promise<Partial<FullAnalysis>> {
  const ai = getGeminiClient();

  const prompt = `Analyze and validate the following startup idea with venture capital rigor:
Title: "${payload.title}"
Industry: "${payload.industry}"
Target Audience: "${payload.target_audience}"
Description: "${payload.description}"
Additional Notes / Existing Pilots / Tech Stack: "${payload.additional_info || 'None provided'}"

Provide your rigorous startup evaluation in structured JSON conforming to the schema.
Ensure all numerical scores are between 0 and 100.
Do NOT fabricate precise real-world market statistics as verified facts; clearly label estimates, ranges, or model assumptions.
Verdict type must be strictly "Build", "Improve", or "Pivot".
`;

  const systemInstruction = `You are VentureLens AI, an institutional-grade venture capital analyst and startup validator.
Evaluate early-stage concepts realistically. Look out for critical flaws, competitive moats, market timing, distribution friction, unit-economic bottlenecks, and technical risks.
Offer pragmatic, prioritized advice that empowers founders to test assumptions before spending capital.`;

  // Call Gemini model with automatic retry & fallback across fast, highly-available models
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash'];
  let lastError: any = null;
  let response: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[VentureLens AI] Calling model ${modelName} (attempt ${attempt})...`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.4,
            responseMimeType: 'application/json',
            responseSchema: analysisResponseSchema,
          },
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.log(`[VentureLens AI] Model ${modelName} attempt ${attempt} notice:`, err?.message || err);
        // Backoff pause
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
    if (response && response.text) {
      break;
    }
  }

  if (!response || !response.text) {
    let readableMsg = 'Gemini model is temporarily busy. Please retry in a moment.';
    if (lastError?.message) {
      try {
        const parsedErr = JSON.parse(lastError.message);
        if (parsedErr?.error?.message) {
          readableMsg = parsedErr.error.message;
        }
      } catch {
        readableMsg = lastError.message;
      }
    }
    throw new Error(readableMsg);
  }

  const rawText = response.text;
  if (!rawText) {
    throw new Error('Gemini returned an empty response.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawText.trim());
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', rawText);
    throw new Error('Malformed JSON output received from AI model.');
  }

  // Validate core fields exist
  if (typeof parsed.overall_score !== 'number' || !parsed.verdict || !parsed.problem_validation) {
    throw new Error('Incomplete validation schema returned by AI analysis.');
  }

  // Ensure bounded numbers
  parsed.overall_score = Math.max(0, Math.min(100, Math.round(parsed.overall_score)));
  parsed.problem_score = Math.max(0, Math.min(100, Math.round(parsed.problem_validation?.problem_strength_score || parsed.overall_score)));
  parsed.market_score = Math.max(0, Math.min(100, Math.round(parsed.market_analysis?.market_opportunity_score || parsed.overall_score)));
  parsed.competition_score = Math.max(0, Math.min(100, Math.round(parsed.competitor_analysis?.competition_score || parsed.overall_score)));
  parsed.revenue_score = Math.max(0, Math.min(100, Math.round(parsed.business_model?.revenue_potential_score || parsed.overall_score)));
  parsed.technical_score = Math.max(0, Math.min(100, Math.round(parsed.technical_feasibility?.technical_feasibility_score || parsed.overall_score)));

  // Normalize verdict_type
  if (!['Build', 'Improve', 'Pivot'].includes(parsed.verdict_type)) {
    if (parsed.overall_score >= 75) parsed.verdict_type = 'Build';
    else if (parsed.overall_score >= 50) parsed.verdict_type = 'Improve';
    else parsed.verdict_type = 'Pivot';
  }

  return parsed;
}
