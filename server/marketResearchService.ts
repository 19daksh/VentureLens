import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import type {
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
5. Comprehensive Coverage: You MUST provide 5 to 8 distinct items for 'trends', 3 to 5 real commercial products for 'competitors' with their real websites (e.g. https://www.joinhandshake.com, https://www.linkedin.com, https://www.ripplematch.com), 3 to 5 items for 'customer_demand', 3 to 5 items for 'competitive_gaps', 3 to 5 items for 'opportunities', 3 to 5 items for 'threats', and 3 to 5 items for 'recent_developments'.

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

let mrSearchGroundingCooldownUntil = 0;

function isMRSearchGroundingQuotaError(err: any): boolean {
  if (!err) return false;
  if (err.status === 429 || err.code === 429) return true;
  const msg = String(err.message || err);
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    msg.includes('rate-limit') ||
    msg.includes('rate limits')
  );
}

  // 1. Try search grounding first across high-availability models if not in quota cooldown
  const currentTimeMs = Date.now();
  let response: any = null;
  let usedSearchGrounding = false;
  let lastError: any = null;

  if (currentTimeMs < mrSearchGroundingCooldownUntil) {
    console.log(
      `[VentureLens Market Research] Search grounding is in quota cooldown (resumes at ${new Date(
        mrSearchGroundingCooldownUntil
      ).toISOString()}). Proceeding directly with structured synthesis mode.`
    );
  } else {
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    for (const modelName of candidateModels) {
      try {
        console.log(`[VentureLens Market Research] Calling ${modelName} with Google Search grounding...`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: MARKET_RESEARCH_SYSTEM_INSTRUCTION,
            temperature: 0.2,
            maxOutputTokens: 8192,
            tools: [{ googleSearch: {} }],
          },
        });

        if (response && response.text) {
          usedSearchGrounding = true;
          break;
        }
      } catch (err: any) {
        lastError = err;
        if (isMRSearchGroundingQuotaError(err)) {
          console.log(
            `[VentureLens Market Research] Google Search grounding quota reached (429/RESOURCE_EXHAUSTED). Engaging 10-minute cooldown and proceeding immediately to structured synthesis fallback.`
          );
          mrSearchGroundingCooldownUntil = Date.now() + 10 * 60 * 1000;
          break; // Stop immediately to avoid redundant 429 calls
        } else {
          console.log(`[VentureLens Market Research] Model ${modelName} search attempt note: ${err?.status || err?.code || 'attempt completed'}`);
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }
  }

  // 2. If search grounding was unavailable (e.g. quota limit, rate limit), seamlessly fall back to structured research synthesis
  if (!response || !response.text) {
    console.log('[VentureLens Market Research] Proceeding with structured market intelligence synthesis fallback...');
    const fallbackModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    for (const modelName of fallbackModels) {
      try {
        console.log(`[VentureLens Market Research] Calling ${modelName} in structured JSON mode...`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              MARKET_RESEARCH_SYSTEM_INSTRUCTION +
              '\nIMPORTANT: Return strictly valid JSON adhering exactly to the requested schema. Use authentic market datasets, verified public company websites, documented pricing tiers, and realistic competitor intelligence.',
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        });

        if (response && response.text) {
          console.log(`[VentureLens Market Research] Structured synthesis succeeded with ${modelName}`);
          break;
        }
      } catch (fallbackErr: any) {
        lastError = fallbackErr;
        console.log(`[VentureLens Market Research] Model ${modelName} fallback status: ${fallbackErr?.status || fallbackErr?.code || 'retrying next'}`);
      }
    }
  }

  if (!response || !response.text) {
    const errorDetail = lastError?.message || 'Gemini market research service is temporarily unavailable.';
    throw new Error(`Market research could not be completed: ${errorDetail}`);
  }

  // Extract grounding metadata from Gemini response if search grounding was active
  const candidate = response.candidates?.[0];
  const groundingMetadata = candidate?.groundingMetadata;
  const searchQueries: string[] = groundingMetadata?.webSearchQueries || (usedSearchGrounding ? [] : [
    `Market conditions and trends: ${context.industry}`,
    `Competitors and demand: ${context.title}`,
    `Target audience needs: ${context.target_audience}`
  ]);
  const groundingChunks: Array<{ web?: { uri?: string; title?: string } }> =
    groundingMetadata?.groundingChunks || [];

  // Parse response JSON with robust recovery
  let parsed: any;
  const rawCleaned = response.text.trim();
  try {
    const unquoted = rawCleaned.startsWith('```')
      ? rawCleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      : rawCleaned;
    parsed = JSON.parse(unquoted);
  } catch {
    // Attempt relaxed regex extraction
    const firstBrace = rawCleaned.indexOf('{');
    const lastBrace = rawCleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        parsed = JSON.parse(rawCleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        // Attempt unclosed structure recovery
        let candidateStr = rawCleaned.slice(firstBrace);
        candidateStr = candidateStr.replace(/,\s*$/, '');
        let openBraces = 0;
        let openBrackets = 0;
        let inString = false;
        let escapeNext = false;
        for (let i = 0; i < candidateStr.length; i++) {
          const c = candidateStr[i];
          if (escapeNext) { escapeNext = false; continue; }
          if (c === '\\') { escapeNext = true; continue; }
          if (c === '"') { inString = !inString; continue; }
          if (!inString) {
            if (c === '{') openBraces++;
            else if (c === '}') openBraces--;
            else if (c === '[') openBrackets++;
            else if (c === ']') openBrackets--;
          }
        }
        if (inString) candidateStr += '"';
        while (openBrackets > 0) { candidateStr += ']'; openBrackets--; }
        while (openBraces > 0) { candidateStr += '}'; openBraces--; }
        try {
          parsed = JSON.parse(candidateStr);
        } catch {
          throw new Error('Received non-standard response from research model. Please try again.');
        }
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

  // 2. Add sources parsed in the JSON ONLY if live search was used
  if (usedSearchGrounding && Array.isArray(parsed.sources)) {
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

  // 3. Add verified competitor websites to sources if not already present
  if (Array.isArray(parsed.competitors)) {
    for (const comp of parsed.competitors) {
      if (comp?.website && typeof comp.website === 'string' && comp.website.startsWith('http')) {
        try {
          const parsedUrl = new URL(comp.website);
          const rootUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
          comp.website = rootUrl;
          const domain = parsedUrl.hostname.replace(/^www\./, '');
          if (usedSearchGrounding && !sourcesMap.has(rootUrl)) {
            sourcesMap.set(rootUrl, {
              title: `${comp.name || domain} Official Platform`,
              url: rootUrl,
              domain,
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
      summary: parsed.market_overview?.summary || (usedSearchGrounding ? 'Market research completed using public web intelligence.' : 'Market overview synthesized from model knowledge (live search unavailable).'),
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
          source: usedSearchGrounding ? (t.source || 'Industry Analysis') : 'AI Knowledge Synthesis',
          source_url: usedSearchGrounding ? (t.source_url || (consolidatedSources[0]?.url || '')) : '',
          published_date: t.published_date,
        }))
      : [],
    customer_demand: Array.isArray(parsed.customer_demand)
      ? parsed.customer_demand.map((c: any) => ({
          signal: c.signal || 'Demand Indicator',
          evidence: c.evidence || 'Observed in industry adoption patterns.',
          interpretation: c.interpretation || 'Inferred from market dynamics.',
          source: usedSearchGrounding ? (c.source || 'Public Web Sources') : 'AI Inferred Demand Pattern',
          source_url: usedSearchGrounding ? (c.source_url || (consolidatedSources[0]?.url || '')) : '',
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
          sources: usedSearchGrounding && Array.isArray(comp.sources) ? comp.sources : [],
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
          sources: usedSearchGrounding && Array.isArray(o.sources) ? o.sources : [],
        }))
      : [],
    threats: Array.isArray(parsed.threats)
      ? parsed.threats.map((th: any) => ({
          title: th.title || 'Market Threat',
          description: th.description || '',
          evidence: th.evidence || 'Market competition and incumbent moats.',
          threat_type: th.threat_type || 'Competitive Pressure',
          sources: usedSearchGrounding && Array.isArray(th.sources) ? th.sources : [],
        }))
      : [],
    recent_developments: Array.isArray(parsed.recent_developments)
      ? parsed.recent_developments.map((d: any) => ({
          title: d.title || 'Industry Event',
          description: d.description || '',
          date: d.date || 'Recent Period',
          source: usedSearchGrounding ? (d.source || 'Public Press') : 'AI Synthesized Event',
          source_url: usedSearchGrounding ? (d.source_url || (consolidatedSources[0]?.url || '')) : '',
        }))
      : [],
    sources: consolidatedSources,
    search_queries_performed: usedSearchGrounding ? searchQueries : [],
    is_search_grounded: usedSearchGrounding,
    grounding_status: usedSearchGrounding ? 'live_search' : 'fallback_synthesis',
    grounding_message: usedSearchGrounding
      ? 'Grounded with live Google Search queries and retrieved public web sources.'
      : 'Live Google Search grounding was unavailable due to API rate/quota limits. Research was synthesized via Gemini model knowledge without live web citations.',
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
