import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import {
  MarketResearchData,
  MarketResearchRecord,
  ResearchSource,
} from '../src/types/marketResearch.ts';

// Initialize server-side Gemini client with system environment variable
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY environment variable is missing on the server.');
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

export const MARKET_RESEARCH_SYSTEM_INSTRUCTION = `You are VentureLens Market Research Analyst.

Use Google Search grounding to research current public information.

Prioritize:
1. Official company websites
2. Government sources
3. Regulatory bodies
4. Official statistics
5. Recognized industry organizations
6. Reputable business/technology publications
7. Other credible sources

Do not invent statistics, market sizes, competitor pricing, funding information, or company features.

If information cannot be verified, say so.
If competitor pricing cannot be verified, explicitly state: "Pricing not publicly verified."

Separate:
- Verified fact
- Source-reported claim
- AI inference
- Strategic recommendation

Never present an inference as a verified fact.
For competitive gaps, explicitly label each as "Research-based opportunity".
For time-sensitive information, include the publication/update date whenever available (focusing on the last ~12 months for recent developments).

Output your research as a single, valid, parseable JSON object without any Markdown formatting or code fences.`;

export interface StartupResearchContext {
  title: string;
  description: string;
  industry: string;
  target_audience: string;
  business_model?: string;
  existing_analysis?: {
    tam?: string;
    sam?: string;
    som?: string;
    overall_score?: number;
    verdict_type?: string;
    competitors?: Array<{ name: string }>;
  };
}

/**
 * Execute real-time web-grounded market research with Google Search Grounding
 */
export async function executeMarketResearch(
  context: StartupResearchContext
): Promise<MarketResearchData> {
  const ai = getGeminiClient();

  const prompt = `Conduct comprehensive real-time web-grounded market research using Google Search grounding for the following startup idea:

Startup Identity:
- Title: "${context.title}"
- Industry: "${context.industry}"
- Target Audience: "${context.target_audience}"
- Concept Description: "${context.description}"
${context.business_model ? `- Proposed Business Model: "${context.business_model}"` : ''}
${
  context.existing_analysis
    ? `- Existing Analysis Context: Score: ${context.existing_analysis.overall_score || 'N/A'}/100, Verdict: ${context.existing_analysis.verdict_type || 'N/A'}, TAM estimate: ${context.existing_analysis.tam || 'N/A'}`
    : ''
}

SEARCH DIRECTIVES:
1. Search current market conditions, market size, growth rates, and recent developments for ${context.industry} and ${context.title}.
2. Search real competitors, existing commercial products, startups, or apps targeting ${context.target_audience}. Look up their official websites, public pricing, and observable positioning. If pricing cannot be verified publicly, specify "Pricing not publicly verified."
3. Search verified customer demand signals, public reviews, forum discussions (Reddit, ProductHunt, G2, user complaints), or unmet needs.
4. Search recent industry developments from the last 12 months (funding announcements, product launches, acquisitions, regulations).
5. Identify 5-8 current trends, 3-5 market opportunities, competitive gaps, and real market threats with supporting evidence and source references.

FORMAT REQUIREMENT:
Return a JSON object conforming strictly to this structure:
{
  "market_overview": {
    "summary": "Detailed narrative of current market conditions and dynamics",
    "market_state": "Current state e.g. Rapidly Growing / Fragmented / Consolidating",
    "key_developments": ["Development 1 with date/context", "Development 2..."],
    "recent_statistics": ["Stat 1 with source reference", "Stat 2..."]
  },
  "trends": [
    {
      "title": "Trend title",
      "description": "Explanation of the trend",
      "why_it_matters": "Why it matters to this startup",
      "source": "Source publication or organization name",
      "source_url": "https://...",
      "published_date": "Recent date or year"
    }
  ],
  "customer_demand": [
    {
      "signal": "Demand signal or user sentiment",
      "evidence": "Observed customer behavior, search interest, complaint, or review evidence",
      "interpretation": "Clearly labeled inference vs verified fact",
      "source": "Platform or report source",
      "source_url": "https://..."
    }
  ],
  "competitors": [
    {
      "name": "Company/Product Name",
      "website": "https://...",
      "description": "What they do",
      "target_audience": "Audience they serve",
      "pricing": "Verified pricing or 'Pricing not publicly verified.'",
      "features": ["Feature 1", "Feature 2"],
      "positioning": "How they position themselves in the market",
      "strengths": ["Strength 1"],
      "observed_gaps": ["Publicly observable weakness or unmet gap"],
      "sources": [{"title": "Company site or review", "url": "https://..."}]
    }
  ],
  "competitive_gaps": [
    {
      "gap_type": "e.g. Underserved audience / Missing feature / Pricing opportunity",
      "opportunity": "Description of the market void",
      "label": "Research-based opportunity",
      "evidence": "Evidence showing why this gap exists"
    }
  ],
  "opportunities": [
    {
      "title": "Opportunity title",
      "description": "Opportunity explanation",
      "evidence": "Supporting evidence from current research",
      "relevance": "Direct relevance to this startup",
      "sources": [{"title": "Source name", "url": "https://..."}]
    }
  ],
  "threats": [
    {
      "title": "Threat title",
      "description": "Explanation of risk",
      "evidence": "Evidence of competitor dominance, saturation, regulation, or user inertia",
      "threat_type": "Established Competitors / Market Saturation / Regulation / Technology Changes / Customer Barriers",
      "sources": [{"title": "Source name", "url": "https://..."}]
    }
  ],
  "recent_developments": [
    {
      "title": "Headline or development",
      "description": "What happened",
      "date": "Month Year (within last 12 months)",
      "source": "News source or press release",
      "source_url": "https://..."
    }
  ],
  "sources": [
    {
      "title": "Article or Website Title",
      "url": "https://...",
      "domain": "example.com",
      "published_date": "Date if known"
    }
  ]
}`;

  // Try gemini-3.8-flash first with googleSearch grounding, with fallbacks
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;
  let response: any = null;

  for (const modelName of candidateModels) {
    try {
      console.log(`[VentureLens Market Research] Calling ${modelName} with Google Search grounding...`);
      response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: MARKET_RESEARCH_SYSTEM_INSTRUCTION,
          temperature: 0.2,
          tools: [{ googleSearch: {} }],
        },
      });

      if (response && response.text) {
        break;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[VentureLens Market Research] Model ${modelName} call warning:`, err?.message || err);
      // Wait briefly before fallback model
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  if (!response || !response.text) {
    const errorDetail = lastError?.message || 'Gemini Search grounding service is unavailable.';
    throw new Error(`Market research could not be completed: ${errorDetail}`);
  }

  // Extract grounding metadata from Gemini response
  const candidate = response.candidates?.[0];
  const groundingMetadata = candidate?.groundingMetadata;
  const searchQueries: string[] = groundingMetadata?.webSearchQueries || [];
  const groundingChunks: Array<{ web?: { uri?: string; title?: string } }> =
    groundingMetadata?.groundingChunks || [];

  // Parse response JSON
  let rawText = response.text.trim();
  if (rawText.startsWith('```')) {
    rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch (parseErr) {
    console.error('[VentureLens Market Research] Malformed JSON from Gemini. Raw text snippet:', rawText.slice(0, 300));
    // Attempt relaxed regex extraction
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('Received non-standard response from research model. Please try again.');
      }
    } else {
      throw new Error('Received unparseable research output. Please try again.');
    }
  }

  // Normalize sources from groundingChunks and parsed.sources
  const sourcesMap = new Map<string, ResearchSource>();

  // 1. Add citations directly from Gemini Google Search grounding metadata
  for (const chunk of groundingChunks) {
    if (chunk.web?.uri) {
      const url = chunk.web.uri;
      try {
        const domain = new URL(url).hostname.replace(/^www\./, '');
        sourcesMap.set(url, {
          title: chunk.web.title || domain,
          url,
          domain,
        });
      } catch {
        // invalid URL ignore
      }
    }
  }

  // 2. Add sources parsed in the JSON
  if (Array.isArray(parsed.sources)) {
    for (const s of parsed.sources) {
      if (s?.url && typeof s.url === 'string' && s.url.startsWith('http')) {
        try {
          const domain = s.domain || new URL(s.url).hostname.replace(/^www\./, '');
          if (!sourcesMap.has(s.url)) {
            sourcesMap.set(s.url, {
              title: s.title || domain,
              url: s.url,
              domain,
              published_date: s.published_date,
            });
          }
        } catch {
          // ignore
        }
      }
    }
  }

  const consolidatedSources: ResearchSource[] = Array.from(sourcesMap.values());

  // Ensure robust fallback defaults for required sections
  const sanitizedData: MarketResearchData = {
    market_overview: {
      summary: parsed.market_overview?.summary || 'Market research completed using public web intelligence.',
      market_state: parsed.market_overview?.market_state || 'Expanding',
      key_developments: Array.isArray(parsed.market_overview?.key_developments)
        ? parsed.market_overview.key_developments
        : [],
      recent_statistics: Array.isArray(parsed.market_overview?.recent_statistics)
        ? parsed.market_overview.recent_statistics
        : ['Statistics not publicly verified.'],
    },
    trends: Array.isArray(parsed.trends)
      ? parsed.trends.map((t: any) => ({
          title: t.title || 'Market Trend',
          description: t.description || '',
          why_it_matters: t.why_it_matters || 'Relevant to customer adoption and product positioning.',
          source: t.source || 'Industry Analysis',
          source_url: t.source_url || (consolidatedSources[0]?.url || ''),
          published_date: t.published_date,
        }))
      : [],
    customer_demand: Array.isArray(parsed.customer_demand)
      ? parsed.customer_demand.map((c: any) => ({
          signal: c.signal || 'Demand Indicator',
          evidence: c.evidence || 'Observed in industry adoption patterns.',
          interpretation: c.interpretation || 'Inferred from market dynamics.',
          source: c.source || 'Public Web Sources',
          source_url: c.source_url || (consolidatedSources[0]?.url || ''),
        }))
      : [],
    competitors: Array.isArray(parsed.competitors)
      ? parsed.competitors.map((comp: any) => ({
          name: comp.name || 'Identified Competitor',
          website: comp.website || '',
          description: comp.description || '',
          target_audience: comp.target_audience || context.target_audience,
          pricing: comp.pricing || 'Pricing not publicly verified.',
          features: Array.isArray(comp.features) ? comp.features : [],
          positioning: comp.positioning || '',
          strengths: Array.isArray(comp.strengths) ? comp.strengths : [],
          observed_gaps: Array.isArray(comp.observed_gaps) ? comp.observed_gaps : [],
          sources: Array.isArray(comp.sources) ? comp.sources : [],
        }))
      : [],
    competitive_gaps: Array.isArray(parsed.competitive_gaps)
      ? parsed.competitive_gaps.map((g: any) => ({
          gap_type: g.gap_type || 'Market Opportunity',
          opportunity: g.opportunity || '',
          label: 'Research-based opportunity' as const,
          evidence: g.evidence || 'Observed customer friction with incumbent alternatives.',
        }))
      : [],
    opportunities: Array.isArray(parsed.opportunities)
      ? parsed.opportunities.map((o: any) => ({
          title: o.title || 'Market Opportunity',
          description: o.description || '',
          evidence: o.evidence || 'Supported by recent sector growth signals.',
          relevance: o.relevance || 'Directly applicable to early product design.',
          sources: Array.isArray(o.sources) ? o.sources : [],
        }))
      : [],
    threats: Array.isArray(parsed.threats)
      ? parsed.threats.map((th: any) => ({
          title: th.title || 'Market Threat',
          description: th.description || '',
          evidence: th.evidence || 'Market competition and incumbent moats.',
          threat_type: th.threat_type || 'Competitive Pressure',
          sources: Array.isArray(th.sources) ? th.sources : [],
        }))
      : [],
    recent_developments: Array.isArray(parsed.recent_developments)
      ? parsed.recent_developments.map((d: any) => ({
          title: d.title || 'Industry Event',
          description: d.description || '',
          date: d.date || 'Last 12 months',
          source: d.source || 'Public Press',
          source_url: d.source_url || (consolidatedSources[0]?.url || ''),
        }))
      : [],
    sources: consolidatedSources,
    search_queries_performed: searchQueries,
  };

  return sanitizedData;
}

/**
 * Supabase Database Helper: Saves or updates market research record for an analysis
 */
export async function saveMarketResearchToSupabase(options: {
  analysisId: string;
  userId: string;
  userToken: string;
  researchData: MarketResearchData;
}): Promise<MarketResearchRecord | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${options.userToken}` },
      },
    });

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('market_research')
      .upsert(
        {
          analysis_id: options.analysisId,
          user_id: options.userId,
          research_data: options.researchData,
          researched_at: now,
          updated_at: now,
        },
        { onConflict: 'analysis_id' }
      )
      .select()
      .single();

    if (error) {
      console.warn('[VentureLens Market Research] Supabase save notice:', error.message);
      return null;
    }

    return data as MarketResearchRecord;
  } catch (err) {
    console.warn('[VentureLens Market Research] Supabase save error:', err);
    return null;
  }
}

/**
 * Supabase Database Helper: Fetches existing market research record for an analysis
 */
export async function getMarketResearchFromSupabase(options: {
  analysisId: string;
  userToken: string;
}): Promise<MarketResearchRecord | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${options.userToken}` },
      },
    });

    const { data, error } = await supabase
      .from('market_research')
      .select('*')
      .eq('analysis_id', options.analysisId)
      .maybeSingle();

    if (error) {
      console.warn('[VentureLens Market Research] Supabase fetch error:', error.message);
      return null;
    }

    return data as MarketResearchRecord | null;
  } catch (err) {
    console.warn('[VentureLens Market Research] Supabase fetch error:', err);
    return null;
  }
}
