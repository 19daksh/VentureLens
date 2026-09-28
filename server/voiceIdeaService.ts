import { GoogleGenAI, Type } from '@google/genai';

export interface VoicePitchPayload {
  transcript?: string;
  audioBase64?: string;
  mimeType?: string;
}

export interface ExtractedVoiceIdea {
  title: string;
  industry: string;
  custom_industry?: string;
  target_audience: string;
  description: string;
  additional_info?: string;
  raw_transcript: string;
  key_highlights: string[];
}

const VALID_INDUSTRIES = [
  'Artificial Intelligence',
  'B2B SaaS',
  'FinTech',
  'HealthTech & BioTech',
  'CleanTech & Climate',
  'DevTools & Infrastructure',
  'CyberSecurity',
  'E-Commerce & RetailTech',
  'EdTech',
  'Marketplace & Platforms',
  'Supply Chain & Logistics',
  'Other',
];

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
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

const voiceIdeaResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'A crisp, professional startup concept title or venture name (e.g., "CarePath AI", "FleetPulse", "SupplyGrid"). If the speaker suggested a name, use it; otherwise craft a compelling 2-3 word brand name based on the core solution.',
    },
    industry: {
      type: Type.STRING,
      description: `Select the most accurate industry matching exactly one of: ${VALID_INDUSTRIES.join(', ')}. If none match cleanly, pick "Other".`,
    },
    custom_industry: {
      type: Type.STRING,
      description: 'Only provide if industry is "Other", e.g. "DefenseTech", "BioEngineering", "PropTech". Otherwise empty string.',
    },
    target_audience: {
      type: Type.STRING,
      description: 'Precise target customer persona or ICP (e.g., "Outpatient specialty clinic operators", "Fleet managers running 20-200 delivery vans", "Seed-stage CTOs").',
    },
    description: {
      type: Type.STRING,
      description: 'A structured, thorough narrative of the problem, proposed product solution, and core value proposition (at least 2-4 comprehensive sentences; expand founder natural speech into a clear professional pitch).',
    },
    additional_info: {
      type: Type.STRING,
      description: 'Any mentioned pilots, pricing intentions, customer discovery insights, technical stack, or competitor mentions.',
    },
    raw_transcript: {
      type: Type.STRING,
      description: 'Accurate full transcription of what the founder spoke in their voice recording.',
    },
    key_highlights: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 to 5 bullet points highlighting the strongest venture signals or takeaways from this pitch.',
    },
  },
  required: ['title', 'industry', 'target_audience', 'description', 'raw_transcript', 'key_highlights'],
};

/**
 * Fallback parser when Gemini API key is not present or if an offline response is needed
 */
function heuristicExtract(transcript: string): ExtractedVoiceIdea {
  const clean = transcript.trim();
  const words = clean.split(/\s+/);
  
  // Heuristic title from first few words or generic
  let title = 'New Venture Concept';
  if (words.length >= 2) {
    title = words.slice(0, 3).join(' ').replace(/[^a-zA-Z0-9\s]/g, '');
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // Detect simple industry keywords
  const lower = clean.toLowerCase();
  let industry = 'B2B SaaS';
  if (lower.includes('health') || lower.includes('clinic') || lower.includes('doctor') || lower.includes('patient')) {
    industry = 'HealthTech & BioTech';
  } else if (lower.includes('security') || lower.includes('cyber') || lower.includes('vulnerability')) {
    industry = 'CyberSecurity';
  } else if (lower.includes('crypto') || lower.includes('bank') || lower.includes('fintech') || lower.includes('payment')) {
    industry = 'FinTech';
  } else if (lower.includes('energy') || lower.includes('climate') || lower.includes('ev ') || lower.includes('electric')) {
    industry = 'CleanTech & Climate';
  } else if (lower.includes('ai ') || lower.includes('model') || lower.includes('llm') || lower.includes('agent')) {
    industry = 'Artificial Intelligence';
  } else if (lower.includes('logistics') || lower.includes('fleet') || lower.includes('warehouse') || lower.includes('shipping')) {
    industry = 'Supply Chain & Logistics';
  } else if (lower.includes('shop') || lower.includes('store') || lower.includes('retail') || lower.includes('ecommerce')) {
    industry = 'E-Commerce & RetailTech';
  }

  return {
    title: title || 'Spoken Startup Concept',
    industry,
    target_audience: 'Early adopters facing this specific operational friction',
    description: clean || 'Founder described startup concept via microphone voice recording.',
    additional_info: 'Extracted from voice recording transcript.',
    raw_transcript: clean,
    key_highlights: [
      'Captured via voice recorder',
      'Problem and solution outlined by founder',
      'Ready for VentureLens institutional validation',
    ],
  };
}

export async function processSpokenStartupPitch(payload: VoicePitchPayload): Promise<ExtractedVoiceIdea> {
  const { transcript = '', audioBase64, mimeType = 'audio/webm' } = payload;

  if (!transcript.trim() && !audioBase64) {
    throw new Error('Please provide either spoken audio or speech transcript to structure.');
  }

  const ai = getGeminiClient();

  // If Gemini client is unavailable, fall back to heuristic extraction
  if (!ai) {
    return heuristicExtract(transcript || 'Startup idea recorded via voice audio.');
  }

  const prompt = `You are VentureLens Spoken Pitch Processor.
The founder has recorded a voice note describing their startup idea naturally, conversationally, or in bullet points.
Your job is to:
1. Accurately transcribe (if audio is provided) or polish the transcript into 'raw_transcript'.
2. Synthesize and extract a professional, cohesive startup concept ready for venture capital due diligence:
   - "title": A short, memorable, professional startup name (e.g. "CarePath AI", "FleetPulse", "SupplyGrid").
   - "industry": Select the best fit from: ${VALID_INDUSTRIES.join(', ')}.
   - "custom_industry": If industry is "Other", specify it.
   - "target_audience": Explicit buyer persona, ideal customer profile (ICP), or user base.
   - "description": Clear, well-written problem, solution, and value proposition synthesizing everything they explained.
   - "additional_info": Mention any pilots, customer quotes, pricing ideas, or competitor mentions they spoke about.
   - "key_highlights": 3 to 5 bullet points capturing key metrics, unfair advantages, or pain points mentioned.

Ensure the output is clean, actionable, and faithfully represents the founder's intentions.`;

  const contents: any[] = [];

  // If audio is provided as base64
  if (audioBase64) {
    const cleanMime = mimeType.split(';')[0].trim();
    contents.push({
      inlineData: {
        data: audioBase64,
        mimeType: cleanMime || 'audio/webm',
      },
    });
  }

  if (transcript && transcript.trim()) {
    contents.push({
      text: `Founder's Spoken Speech Transcript:\n"${transcript.trim()}"`,
    });
  }

  contents.push({
    text: prompt,
  });

  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Voice Idea Processor] Processing spoken pitch with ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: 'You are an institutional venture analyst specializing in listening to founder audio pitches and structuring them into clear startup investment memos.',
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: voiceIdeaResponseSchema,
        },
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text) as ExtractedVoiceIdea;
        // Validate required fields
        if (parsed && parsed.title && parsed.description) {
          if (!VALID_INDUSTRIES.includes(parsed.industry)) {
            parsed.industry = 'B2B SaaS';
          }
          if (!parsed.raw_transcript && transcript) {
            parsed.raw_transcript = transcript;
          }
          return parsed;
        }
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Voice Idea Processor] Error with model ${modelName}:`, err?.message || err);
    }
  }

  console.error('[Voice Idea Processor] All Gemini models failed, falling back to heuristic parsing:', lastError?.message);
  return heuristicExtract(transcript || 'Audio pitch processed.');
}
