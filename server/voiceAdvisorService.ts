import { GoogleGenAI, Modality } from '@google/genai';
import { AnalysisContextData } from './advisorService.ts';

// Voice-optimized system prompt that instructs Gemini to speak naturally, concisely, and conversationally
export const VOICE_ADVISOR_BASE_INSTRUCTION = `You are VentureLens Voice AI Advisor, an expert startup strategy partner having a live, spoken conversation with a startup founder.

Spoken Conversational Directives:
1. Spoken Economy: This is a spoken voice dialogue. Keep answers natural, direct, and concise (typically 1 to 3 short sentences per turn unless the founder explicitly asks for a detailed breakdown or deep dive).
2. Natural Delivery: Speak like a seasoned Y Combinator or venture capital partner sitting across the table. Be encouraging yet analytically sharp and honest.
3. No Raw Markdown or Symbols: DO NOT say "hash hash", "asterisk", "bullet point", or read out markdown formatting or raw code. Speak in fluid, natural sentences.
4. Grounded Knowledge: When a saved VentureLens startup analysis is attached, use its verified evaluation scores, market size (TAM/SAM/SOM), identified competitors, pricing, and risk factors as your ground truth.
5. Honesty & Risk: Never flatter false assumptions. If unit economics or CAC/LTV are problematic, highlight the issue directly.
6. Responsive to Interruptions: The founder may interrupt you at any time. When resumed, acknowledge naturally and address their point without repeating previous sentences.`;

/**
 * Builds a compact, high-signal spoken context grounding summary
 */
export function buildVoiceContextSummary(context: AnalysisContextData): string {
  const parts: string[] = [];

  parts.push(`STARTUP EVALUATION CONTEXT:`);
  parts.push(`Title: "${context.title || 'Untitled Concept'}"`);
  if (context.industry) parts.push(`Industry: ${context.industry}`);
  if (context.target_audience) parts.push(`Target Customer: ${context.target_audience}`);
  if (context.description) parts.push(`Core Concept: ${context.description.slice(0, 300)}`);
  
  if (context.overall_score !== undefined) {
    parts.push(`Overall VentureLens Score: ${context.overall_score}/100 (Verdict: ${context.verdict_type || 'Reviewed'})`);
  }
  if (context.problem_score !== undefined || context.market_score !== undefined || context.competition_score !== undefined) {
    parts.push(`Scores - Problem: ${context.problem_score ?? 'N/A'}/100, Market: ${context.market_score ?? 'N/A'}/100, Moat: ${context.competition_score ?? 'N/A'}/100, Revenue: ${context.revenue_score ?? 'N/A'}/100, Feasibility: ${context.technical_score ?? 'N/A'}/100`);
  }

  if (context.tam || context.sam || context.som) {
    parts.push(`Market Sizing - TAM: ${context.tam || 'N/A'}, SAM: ${context.sam || 'N/A'}, SOM: ${context.som || 'N/A'}`);
  }

  if (context.competitors && context.competitors.length > 0) {
    const compNames = context.competitors.slice(0, 4).map(c => c.name).join(', ');
    parts.push(`Key Identified Competitors: ${compNames}`);
  }

  if (context.recommended_business_model || context.pricing_strategy) {
    parts.push(`Business Model: ${context.recommended_business_model || 'Standard'}, Pricing: ${context.pricing_strategy || 'Unspecified'}`);
  }

  if (context.risks && context.risks.length > 0) {
    const topRisk = context.risks[0];
    parts.push(`Primary Risk (${topRisk.category}): ${topRisk.description} (Mitigation: ${topRisk.mitigation})`);
  }

  if (context.recommendations && context.recommendations.length > 0) {
    const topRec = context.recommendations[0];
    parts.push(`Top Action Item: ${topRec.action} (${topRec.reason})`);
  }

  if (context.market_research?.market_overview?.summary) {
    parts.push(`Latest Market Signal: ${context.market_research.market_overview.summary.slice(0, 200)}`);
  }

  return parts.join('\n');
}

/**
 * Creates an ephemeral token with locked or unlocked Live parameters
 */
export async function createVoiceEphemeralToken(options: {
  analysisContext?: AnalysisContextData | null;
  voiceName?: string;
}): Promise<{ token: string; systemInstruction: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { apiVersion: 'v1alpha' },
  });

  const { analysisContext, voiceName = 'Puck' } = options;

  let systemInstruction = VOICE_ADVISOR_BASE_INSTRUCTION;
  if (analysisContext && analysisContext.title) {
    const summary = buildVoiceContextSummary(analysisContext);
    systemInstruction += `\n\n${summary}\nCRITICAL: The founder is discussing "${analysisContext.title}". Proactively refer to these findings, metrics, and risks. Greet them warmly and reference their startup in your first response.`;
  } else {
    systemInstruction += `\n\nNo specific startup analysis is currently selected. Ask the founder what idea or market they would like to explore today.`;
  }

  // Generate ephemeral token valid for 30 minutes
  const token = await ai.authTokens.create({
    config: {
      expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      liveConnectConstraints: {
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName || 'Puck',
              },
            },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      },
    },
  });

  return {
    token: token.name,
    systemInstruction,
  };
}

/**
 * Robust text generator with multi-model fallback for high-demand spikes
 */
async function generateSpokenTextWithFallback(
  ai: GoogleGenAI,
  contents: any,
  systemInstruction: string
): Promise<string> {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 250,
        },
      });
      const text = response.text?.trim();
      if (text) return text;
    } catch (err: any) {
      console.warn(`[Voice Advisor Service] Text model ${model} failed:`, err?.message || err);
    }
  }

  return 'I hear you. Let us evaluate your startup strategy, address core market risks, and sharpen your unit economics.';
}

/**
 * Generates 24kHz PCM audio using Gemini TTS
 */
async function generatePcmAudio(
  ai: GoogleGenAI,
  text: string,
  voiceName: string
): Promise<string | null> {
  try {
    const cleanText = text
      .replace(/[*#_`~[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const ttsRes = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName || 'Puck',
            },
          },
        },
      },
    });

    const base64Audio = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (err: any) {
    console.warn('[Voice Advisor Service] Gemini TTS generation warning:', err?.message || err);
    return null;
  }
}

/**
 * Generates an opening spoken greeting tailored to the founder and active idea
 */
export async function generateVoiceGreeting(options: {
  analysisContext?: AnalysisContextData | null;
  voiceName?: string;
}): Promise<{ text: string; audio: string | null }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      text: 'Welcome to VentureLens Voice Advisor! What startup idea would you like to explore today?',
      audio: null,
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const { analysisContext, voiceName = 'Puck' } = options;

  let greetingText = '';
  if (analysisContext && analysisContext.title) {
    const scoreText = analysisContext.overall_score ? `with an evaluation score of ${analysisContext.overall_score} out of 100` : '';
    const prompt = `Give a warm, natural 1-2 sentence spoken opening greeting to a founder whose startup is "${analysisContext.title}" (${analysisContext.industry || 'Tech'}), ${scoreText}. Invite them to discuss their business model, risks, or market opportunity. Speak naturally.`;

    const systemInstruction = VOICE_ADVISOR_BASE_INSTRUCTION;
    greetingText = await generateSpokenTextWithFallback(ai, prompt, systemInstruction);
  } else {
    greetingText = 'Hello! I am your VentureLens Voice AI Advisor. What startup concept, market question, or unit economics would you like to brainstorm today?';
  }

  const audio = await generatePcmAudio(ai, greetingText, voiceName);
  return { text: greetingText, audio };
}

/**
 * Generates spoken response and 24kHz audio for a conversational voice turn
 */
export async function generateVoiceTurnResponse(options: {
  userTranscript: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  analysisContext?: AnalysisContextData | null;
  voiceName?: string;
}): Promise<{ text: string; audio: string | null }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      text: 'The Gemini API key is not configured on the server. Please check your environment settings.',
      audio: null,
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const { userTranscript, history = [], analysisContext, voiceName = 'Puck' } = options;

  let systemInstruction = VOICE_ADVISOR_BASE_INSTRUCTION;
  if (analysisContext && analysisContext.title) {
    const summary = buildVoiceContextSummary(analysisContext);
    systemInstruction += `\n\n${summary}\nCRITICAL: The founder is discussing "${analysisContext.title}". Proactively refer to these findings, metrics, and risks.`;
  }

  // Construct conversational history
  const contents: any[] = [];
  const recentHistory = history.slice(-6);
  for (const h of recentHistory) {
    contents.push({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: userTranscript }],
  });

  const spokenText = await generateSpokenTextWithFallback(ai, contents, systemInstruction);
  const audio = await generatePcmAudio(ai, spokenText, voiceName);

  return { text: spokenText, audio };
}
