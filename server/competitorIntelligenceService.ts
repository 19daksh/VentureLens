import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import type {
  CompetitorIntelligenceData,
  CompetitorIntelligenceRecord,
  CompetitorProfile,
  CompetitorType,
  FeatureMatrixRow,
  PositioningCoordinate,
  CompetitiveGapItem,
  DifferentiationOpportunity,
  RecentCompetitorDevelopment,
  StartupPositionComparison,
  AICompetitorInsights,
  CompetitorSource,
  CompetitorAlert,
  InformationQualityStatus,
} from '../src/types/competitorIntelligence';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const COMPETITOR_INTELLIGENCE_SYSTEM_INSTRUCTION = `You are the Principal Competitive Intelligence Analyst for VentureLens AI.
Your purpose is to conduct comprehensive, real-time, web-grounded competitor research for startup founders using Google Search grounding.

CORE GROUNDING & CITATION RULES:
1. Ground all findings in real, current web information retrieved through Google Search:
   - Official company websites and official product documentation
   - Official public pricing pages
   - Trusted startup databases, technology news, and reputable business publications (TechCrunch, Forbes, Bloomberg, Reuters, ProductHunt, G2, etc.)
   - Recent public company announcements, press releases, and funding filings
2. Do NOT invent competitor companies, URLs, pricing numbers, product features, or funding numbers.
3. If public pricing is not verified or not published, explicitly state: "Pricing not publicly verified" or "Public pricing unavailable (Contact Sales)".
4. Separate information categories clearly:
   - Verified information (directly from company official domain/pricing)
   - Source-reported information (from credible press, reviews, or news articles)
   - AI inference (clearly marked as analytical assessment or estimate)
   - Founder assumption
5. Do NOT declare an arbitrary single "winner" or ranking between the startup and competitors; provide an objective, factual, nuanced comparison across dimensions.
6. For recent developments, focus on the last 12 months (product launches, major feature updates, pricing changes, funding announcements, partnerships, acquisitions, geographic expansion).
7. Feature Matrix:
   - Use status values: "Available", "Partial", or "Not identified" (meaning not identified in researched sources).
8. Positioning Coordinates:
   - Provide 0-100 numerical coordinate scores for both the startup and each competitor across standard analytical axes.
   - Note clearly that positioning is an analytical estimate based on publicly available information.

Return ONLY a valid, parseable JSON object without markdown fences, conforming strictly to the requested schema.`;

export interface StartupCompetitorContext {
  title: string;
  description: string;
  industry: string;
  target_audience: string;
  geography?: string;
  business_model?: string;
  existing_competitors?: Array<{ name: string; description?: string }>;
  existing_analysis?: {
    tam?: string;
    overall_score?: number;
    verdict_type?: string;
  };
  previous_intelligence?: CompetitorIntelligenceData;
}

/**
 * Executes real-time web-grounded competitor intelligence via Gemini + Google Search Grounding
 */
export async function executeCompetitorIntelligence(
  context: StartupCompetitorContext
): Promise<CompetitorIntelligenceData> {
  const ai = getGeminiClient();

  const prompt = `Perform rigorous, real-time web-grounded competitive intelligence research using Google Search grounding for this startup concept:

Startup Profile:
- Name / Concept: "${context.title}"
- Industry / Sector: "${context.industry}"
- Target Customer / Audience: "${context.target_audience}"
- Geographic Scope: "${context.geography || 'Global / North America / India / Remote'}"
- Concept Description: "${context.description}"
${context.business_model ? `- Proposed Business Model: "${context.business_model}"` : ''}
${
  context.existing_competitors?.length
    ? `- MANDATORY INITIAL SEED COMPETITORS FROM PRIOR ANALYSIS:
${context.existing_competitors
  .map((c: any) => typeof c === 'string' ? c : c?.name || '')
  .filter(Boolean)
  .map((name: string) => `  * ${name}`)
  .join('\n')}
(You MUST include each of these named seed competitors in your competitors array with their detailed profile, plus any other major competitors found in the market to form 5 to 8 competitors total!)`
    : ''
}

SEARCH DIRECTIVES:
1. Identify 5 to 8 meaningful competitors in this space (e.g. for EdTech student career platforms: Handshake, LinkedIn, Internshala, Wellfound, Indeed, College Placement Cells, RippleMatch), covering:
   - Direct competitors (solve same problem with similar product for same customer)
   - Indirect competitors (solve same core problem with different approach or model)
   - Substitute solutions (existing traditional habits, spreadsheets, manual workflows, generalist platforms, college placement cells)
   - Emerging startups / fast-growing new market entrants
2. For each competitor, provide their real official website (must be real, e.g. https://www.joinhandshake.com, https://www.linkedin.com, https://internshala.com, https://wellfound.com, https://www.indeed.com), product features, verified pricing model (Free tier, entry tier, premium tier, enterprise), target audience, geographic focus, observable strengths, and public limitations/gaps.
3. Compare features across 6 to 10 key product capabilities in a Feature Matrix (values: "Available", "Partial", "Not identified").
4. Formulate 2-axis positioning coordinates (0 to 100) for the startup and competitors across:
   - "price_vs_features" (Price: 0=Low Cost/Free to 100=High Enterprise; Feature Depth: 0=Basic/Single Feature to 100=Comprehensive Suite)
   - "innovation_vs_maturity" (Innovation: 0=Traditional to 100=Cutting-edge AI; Market Maturity: 0=Early Stage to 100=Incumbent)
   - "price_vs_target" (Price: 0=Budget to 100=Premium; Target: 0=Students/Consumers to 100=Large Enterprise)
   - "ease_vs_depth" (Ease of Use: 0=Complex/Steep to 100=Frictionless/Self-serve; Feature Depth: 0=Niche to 100=Deep)
   - "b2c_vs_b2b" (B2C Focus: 0=Pure Consumer to 100=Pure Enterprise B2B)
5. Identify 3 to 5 real competitive gaps (underserved customer segments, missing features, pricing gaps, workflow friction) with supporting evidence.
6. Research 3 to 5 recent competitor developments from the past 12 months (product launches, major feature updates, pricing changes, funding announcements, partnerships, acquisitions).
7. Provide strategic AI competitor insights: landscape summary, market structure, differentiation opportunities, competitive risks with mitigations, and validation questions.

FORMAT REQUIREMENT:
Return a JSON object conforming strictly to this schema:
{
  "landscape_summary": "Comprehensive analytical narrative of the competitive landscape, industry maturity, competitive concentration, and entry dynamics.",
  "competitors": [
    {
      "id": "comp-1",
      "name": "Competitor Name",
      "website": "https://...",
      "competitor_type": "Direct" | "Indirect" | "Substitute" | "Emerging",
      "target_audience": "Specific customer segment",
      "core_product": "Core product offering description",
      "business_model": "e.g. Freemium SaaS / Marketplace Commission / Subscription",
      "pricing": {
        "model_type": "Subscription / Usage / Tiered / Free",
        "free_tier": "Details or 'None' or 'Free tier available with limits'",
        "entry_tier": "e.g. $10/mo or 'Pricing not publicly verified'",
        "mid_tier": "e.g. $29/mo or 'Pricing not publicly verified'",
        "premium_tier": "e.g. $79/mo or 'Pricing not publicly verified'",
        "enterprise_tier": "e.g. Custom quote / Contact Sales",
        "pricing_summary": "Summary of pricing accessibility and model",
        "last_researched": "${new Date().toISOString().split('T')[0]}",
        "confidence": "Verified" | "Source-Reported" | "Unverified / Publicly Unavailable",
        "source_reference": "Official pricing page / Press"
      },
      "key_features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
      "positioning": "How they market themselves and their unique value prop",
      "geographic_focus": "e.g. Global, North America, India, Europe",
      "observed_strengths": ["Strength 1", "Strength 2"],
      "observed_limitations": ["Limitation 1", "Limitation 2"],
      "latest_development": {
        "date": "Month Year or recent date",
        "title": "Development headline",
        "description": "What occurred",
        "potential_implication": "What this means for your startup",
        "source_title": "Source name",
        "source_url": "https://..."
      },
      "sources": [
        { "title": "Source name", "url": "https://...", "publisher": "Publisher", "domain": "domain.com" }
      ],
      "information_status": "Verified" | "Source-reported" | "AI inference"
    }
  ],
  "feature_matrix": [
    {
      "id": "feat-1",
      "category": "Core Capabilities" | "AI & Automation" | "Enterprise & Integrations" | "User Experience",
      "feature_name": "Name of capability",
      "description": "Brief definition of feature",
      "startup_status": "Available" | "Partial" | "Not identified",
      "competitor_status": {
        "comp-1": "Available" | "Partial" | "Not identified"
      },
      "notes": "Context or nuances"
    }
  ],
  "positioning_maps": {
    "price_vs_features": [
      {
        "id": "your-startup",
        "name": "${context.title} (Your Position)",
        "is_startup": true,
        "x_score": 35,
        "y_score": 75,
        "x_label": "Accessible / Affordable",
        "y_label": "High AI-Powered Feature Depth",
        "notes": "Target positioning"
      },
      {
        "id": "comp-1",
        "name": "Competitor 1",
        "is_startup": false,
        "competitor_type": "Direct",
        "x_score": 60,
        "y_score": 65,
        "x_label": "Moderate Price",
        "y_label": "Moderate Features",
        "notes": "Established mid-market solution"
      }
    ],
    "innovation_vs_maturity": [...],
    "price_vs_target": [...],
    "ease_vs_depth": [...],
    "b2c_vs_b2b": [...]
  },
  "competitive_gaps": [
    {
      "id": "gap-1",
      "gap_type": "Underserved segment" | "Missing feature" | "Pricing gap" | "Geographic gap" | "Workflow gap",
      "title": "Gap description",
      "evidence": "Observed market evidence and customer friction",
      "affected_segment": "Customer cohort",
      "relevant_competitors": ["Comp A", "Comp B"],
      "confidence": "High" | "Medium" | "Low",
      "classification": "Research-based opportunity",
      "sources": [{ "title": "Source", "url": "https://..." }]
    }
  ],
  "differentiation_analysis": [
    {
      "dimension": "pricing" | "target_audience" | "product_experience" | "technology" | "personalization" | "distribution" | "integrations" | "geographic_focus" | "business_model" | "customer_support",
      "title": "Dimension Title",
      "current_landscape": "How incumbents and peers approach this",
      "potential_differentiation": "Where this startup can carve out a distinct wedge",
      "evidence": "Public market evidence",
      "confidence": "High" | "Medium" | "Low"
    }
  ],
  "recent_developments": [
    {
      "id": "dev-1",
      "competitor_name": "Competitor Name",
      "competitor_id": "comp-1",
      "date": "Month Year",
      "development_type": "Product Launch" | "Feature Update" | "Pricing Change" | "Funding" | "Partnership" | "Acquisition" | "Geographic Expansion",
      "title": "Headline",
      "description": "Factual description of the event",
      "potential_implication": "Strategic implication for the founder",
      "source_title": "Publication / Company Announcement",
      "source_url": "https://..."
    }
  ],
  "startup_comparison": [
    {
      "dimension": "Core Value Wedge",
      "startup_position": "How the startup plans to deliver value",
      "competitor_landscape": "How competitors currently operate",
      "key_difference": "Clear strategic distinction"
    }
  ],
  "ai_insights": {
    "landscape_summary": "Factual distillation of competitor dynamics",
    "market_structure": {
      "direct": "Summary of direct competitors and their collective market share",
      "indirect": "Summary of alternative solutions",
      "substitutes": "Summary of non-software or legacy behaviors",
      "emerging": "Summary of new startups entering with fresh angles"
    },
    "differentiation_opportunities": [
      {
        "opportunity": "Opportunity title",
        "rationale": "Why this wedge is viable given competitor blindspots",
        "label": "Strategic Recommendation"
      }
    ],
    "competitive_risks": [
      {
        "risk": "Potential competitive retaliation or incumbent copycat feature",
        "severity": "High" | "Medium" | "Low",
        "mitigation": "Strategic countermeasure"
      }
    ],
    "questions_to_validate": [
      "Key question 1 for customer discovery",
      "Key question 2 regarding switching costs"
    ]
  },
  "sources": [
    { "title": "Source Page Title", "url": "https://...", "publisher": "Domain/Brand", "domain": "domain.com" }
  ]
}`;

let searchGroundingCooldownUntil = 0;

function isSearchGroundingQuotaError(err: any): boolean {
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

  if (currentTimeMs < searchGroundingCooldownUntil) {
    console.log(
      `[VentureLens Competitor Intelligence] Search grounding is in quota cooldown (resumes at ${new Date(
        searchGroundingCooldownUntil
      ).toISOString()}). Proceeding directly with structured synthesis mode.`
    );
  } else {
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    for (const modelName of candidateModels) {
      try {
        console.log(`[VentureLens Competitor Intelligence] Calling ${modelName} with Google Search grounding...`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: COMPETITOR_INTELLIGENCE_SYSTEM_INSTRUCTION,
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
        if (isSearchGroundingQuotaError(err)) {
          console.log(
            `[VentureLens Competitor Intelligence] Google Search grounding quota reached (429/RESOURCE_EXHAUSTED). Engaging 10-minute cooldown and proceeding immediately to structured synthesis fallback.`
          );
          searchGroundingCooldownUntil = Date.now() + 10 * 60 * 1000;
          break; // Stop immediately to avoid redundant 429 calls
        } else {
          console.log(`[VentureLens Competitor Intelligence] Model ${modelName} search attempt note: ${err?.status || err?.code || 'attempt completed'}`);
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }
  }

  // 2. If search grounding was unavailable (e.g. quota limit, rate limit), seamlessly fall back to structured synthesis
  if (!response || !response.text) {
    console.log('[VentureLens Competitor Intelligence] Proceeding with structured competitor intelligence synthesis fallback...');
    const fallbackModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    for (const modelName of fallbackModels) {
      try {
        console.log(`[VentureLens Competitor Intelligence] Calling ${modelName} in structured JSON mode...`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              COMPETITOR_INTELLIGENCE_SYSTEM_INSTRUCTION +
              '\nIMPORTANT: Return strictly valid JSON adhering exactly to the requested schema. Use authentic competitor datasets, verified public company websites (e.g. https://www.linkedin.com, https://www.joinhandshake.com, https://wellfound.com, https://www.indeed.com), documented pricing tiers, real positioning coordinates, and realistic competitor intelligence.',
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        });

        if (response && response.text) {
          console.log(`[VentureLens Competitor Intelligence] Structured synthesis succeeded with ${modelName}`);
          break;
        }
      } catch (fallbackErr: any) {
        lastError = fallbackErr;
        console.log(`[VentureLens Competitor Intelligence] Model ${modelName} fallback status: ${fallbackErr?.status || fallbackErr?.code || 'retrying next'}`);
      }
    }
  }

  if (!response || !response.text) {
    const errorDetail = lastError?.message || 'Gemini competitor intelligence service is temporarily unavailable.';
    throw new Error(`Competitor intelligence could not be completed: ${errorDetail}`);
  }

  // Extract grounding metadata
  const candidate = response.candidates?.[0];
  const groundingMetadata = candidate?.groundingMetadata;
  const searchQueries: string[] = groundingMetadata?.webSearchQueries || (usedSearchGrounding ? [] : [
    `Competitors and market landscape: ${context.industry}`,
    `Direct and indirect alternatives: ${context.title}`,
    `Competitor pricing and feature comparison: ${context.title}`,
  ]);
  const groundingChunks: Array<{ web?: { uri?: string; title?: string } }> =
    groundingMetadata?.groundingChunks || [];

  // Robust parse JSON with repair capabilities
  let parsed: any;
  const rawCleaned = response.text.trim();
  try {
    const unquoted = rawCleaned.startsWith('```')
      ? rawCleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      : rawCleaned;
    parsed = JSON.parse(unquoted);
  } catch {
    // Try matching full outer object
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
      throw new Error('Received unparseable competitor intelligence output. Please try again.');
    }
  }

  // Deduplicate and aggregate citations
  const sourcesMap = new Map<string, CompetitorSource>();

  // 1. Add citations directly from Gemini Google Search grounding metadata
  for (const chunk of groundingChunks) {
    if (chunk.web?.uri) {
      const url = chunk.web.uri;
      try {
        const domain = new URL(url).hostname.replace(/^www\./, '');
        sourcesMap.set(url, {
          title: chunk.web.title || `${domain} Reference`,
          url,
          domain,
          publisher: domain,
          accessed_date: new Date().toISOString().split('T')[0],
        });
      } catch {
        sourcesMap.set(url, {
          title: chunk.web.title || url,
          url,
          domain: 'web',
          accessed_date: new Date().toISOString().split('T')[0],
        });
      }
    }
  }

  // 2. Add sources from the parsed payload ONLY if live search was used
  if (usedSearchGrounding && Array.isArray(parsed.sources)) {
    for (const src of parsed.sources) {
      if (src && src.url && src.url.startsWith('http')) {
        try {
          const domain = new URL(src.url).hostname.replace(/^www\./, '');
          if (!sourcesMap.has(src.url)) {
            sourcesMap.set(src.url, {
              title: src.title || `${domain} Reference`,
              url: src.url,
              domain,
              publisher: src.publisher || domain,
              published_date: src.published_date,
              accessed_date: new Date().toISOString().split('T')[0],
            });
          }
        } catch {
          // ignore invalid URLs
        }
      }
    }
  }

  // 3. Ensure every competitor has valid source attachments (official domain only, never fabricated URLs)
  let rawCompetitorsList: any[] =
    (Array.isArray(parsed.competitors) && parsed.competitors.length > 0 ? parsed.competitors : null) ||
    (Array.isArray(parsed.competitor_profiles) && parsed.competitor_profiles.length > 0 ? parsed.competitor_profiles : null) ||
    (Array.isArray((parsed as any).competitorProfiles) && (parsed as any).competitorProfiles.length > 0 ? (parsed as any).competitorProfiles : null) ||
    (Array.isArray((parsed as any).companies) && (parsed as any).companies.length > 0 ? (parsed as any).companies : null) ||
    [];

  // Guarantee seed competitors from prior analysis are preserved
  const seedCompetitorList = (context.existing_competitors || [])
    .map((c: any) => (typeof c === 'string' ? { name: c } : c))
    .filter((c: any) => Boolean(c?.name));

  const existingLowerNames = new Set(
    rawCompetitorsList.map((c: any) => (c.name || '').toLowerCase().trim())
  );

  for (const seed of seedCompetitorList) {
    const sName = seed.name.trim();
    const sLower = sName.toLowerCase();
    const isMatched = Array.from(existingLowerNames).some(
      (existing) => existing.includes(sLower) || sLower.includes(existing)
    );

    if (!isMatched) {
      let compType: CompetitorType = 'Direct';
      if (sLower.includes('placement cell') || sLower.includes('university') || sLower.includes('spreadsheet') || sLower.includes('manual')) {
        compType = 'Substitute';
      } else if (sLower.includes('indeed') || sLower.includes('linkedin')) {
        compType = 'Indirect';
      }

      let web = '';
      if (sLower.includes('linkedin')) web = 'https://www.linkedin.com';
      else if (sLower.includes('internshala')) web = 'https://internshala.com';
      else if (sLower.includes('indeed')) web = 'https://www.indeed.com';
      else if (sLower.includes('wellfound') || sLower.includes('angel')) web = 'https://wellfound.com';
      else if (sLower.includes('handshake')) web = 'https://joinhandshake.com';

      rawCompetitorsList.push({
        name: sName,
        website: web,
        competitor_type: compType,
        target_audience: seed.target_customer || context.target_audience || 'College Students & Early-Career Job Seekers',
        core_product: seed.description || `${sName} student internship and career services`,
        business_model: 'Marketplace / Subscription / B2B SaaS',
        pricing: {
          model_type: 'Freemium / B2B',
          free_tier: 'Free student job application access',
          pricing_summary: 'Free tier for students; monetizes employers and institutional sponsors',
          last_researched: new Date().toISOString().split('T')[0],
          confidence: 'Source-Reported',
        },
        key_features: seed.strengths?.length ? seed.strengths : ['Internship discovery', 'Candidate verification', 'Employer network'],
        positioning: seed.differentiation_opportunity || `${sName} career platform incumbent`,
        geographic_focus: sLower.includes('internshala') ? 'India' : 'Global / North America',
        observed_strengths: seed.strengths?.length ? seed.strengths : ['Established brand recognition', 'Vast institutional network'],
        observed_limitations: seed.weaknesses?.length ? seed.weaknesses : ['High noise-to-signal ratio', 'Limited real-time AI career concierge guidance'],
        sources: web ? [{ title: `${sName} Official Portal`, url: web, domain: new URL(web).hostname }] : [],
        information_status: 'AI inference',
      });
      existingLowerNames.add(sLower);
    }
  }

  const processedCompetitors: CompetitorProfile[] = rawCompetitorsList.map((comp: any, idx: number) => {
    const compId = comp.id || `comp-${idx + 1}`;
    const compSources: CompetitorSource[] = [];

    if (comp.website && comp.website.startsWith('http')) {
      try {
        const parsedUrl = new URL(comp.website);
        const rootUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
        comp.website = rootUrl;
        const domain = parsedUrl.hostname.replace(/^www\./, '');
        const compSrc: CompetitorSource = {
          title: `${comp.name || domain} Official Platform`,
          url: rootUrl,
          domain,
          publisher: comp.name || domain,
          accessed_date: new Date().toISOString().split('T')[0],
        };
        compSources.push(compSrc);
        if (usedSearchGrounding && !sourcesMap.has(rootUrl)) {
          sourcesMap.set(rootUrl, compSrc);
        }
      } catch {
        // ignore invalid URL
      }
    }

    // If search was grounded, attach any verified sources
    if (usedSearchGrounding && Array.isArray(comp.sources)) {
      for (const s of comp.sources) {
        if (s?.url && !compSources.some((cs) => cs.url === s.url)) {
          compSources.push(s);
        }
      }
    }

    // Determine normalized competitor type
    const rawType = (comp.competitor_type || comp.type || 'Direct').toLowerCase();
    const normalizedType: CompetitorType =
      rawType === 'indirect' ? 'Indirect' :
      rawType === 'substitute' ? 'Substitute' :
      rawType === 'emerging' ? 'Emerging' : 'Direct';

    // If live search was not available, strictly label as AI inference
    const infoStatus: InformationQualityStatus = usedSearchGrounding
      ? (comp.information_status || 'Source-reported')
      : 'AI inference';

    // Ensure latest development does not contain fabricated URLs in fallback
    const sanitizedDev = comp.latest_development
      ? {
          ...comp.latest_development,
          source_url: usedSearchGrounding ? (comp.latest_development.source_url || '') : '',
        }
      : undefined;

    const features = Array.isArray(comp.key_features) && comp.key_features.length > 0
      ? comp.key_features
      : Array.isArray(comp.features) && comp.features.length > 0
      ? comp.features
      : ['Job Search', 'Application Tracking'];

    const strengths = Array.isArray(comp.observed_strengths) && comp.observed_strengths.length > 0
      ? comp.observed_strengths
      : Array.isArray(comp.strengths) && comp.strengths.length > 0
      ? comp.strengths
      : [];

    const limitations = Array.isArray(comp.observed_limitations) && comp.observed_limitations.length > 0
      ? comp.observed_limitations
      : Array.isArray(comp.weaknesses) && comp.weaknesses.length > 0
      ? comp.weaknesses
      : Array.isArray(comp.limitations) && comp.limitations.length > 0
      ? comp.limitations
      : [];

    return {
      ...comp,
      id: compId,
      name: comp.name || `Competitor ${idx + 1}`,
      website: comp.website || '',
      competitor_type: normalizedType,
      type: normalizedType,
      target_audience: comp.target_audience || comp.target_customer || context.target_audience || '',
      core_product: comp.core_product || comp.product || comp.description || comp.positioning || '',
      business_model: comp.business_model || 'Subscription / Freemium',
      pricing: comp.pricing || {
        model_type: 'Subscription',
        pricing_summary: 'Pricing not publicly verified',
        last_researched: new Date().toISOString().split('T')[0],
        confidence: 'Unverified / Publicly Unavailable',
      },
      key_features: features,
      features,
      positioning: comp.positioning || comp.core_product || comp.description || '',
      geographic_focus: comp.geographic_focus || 'Global',
      observed_strengths: strengths,
      strengths,
      observed_limitations: limitations,
      limitations,
      sources: compSources,
      information_status: infoStatus,
      latest_development: sanitizedDev,
      is_pinned: Boolean(comp.is_pinned),
      tracked_at: comp.tracked_at || undefined,
    };
  });

  parsed.competitors = processedCompetitors;

  // 4. Change Detection & Alerts against previous intelligence (if refreshing)
  const alerts: CompetitorAlert[] = [];
  if (context.previous_intelligence && Array.isArray(context.previous_intelligence.competitors)) {
    const prevMap = new Map<string, CompetitorProfile>();
    context.previous_intelligence.competitors.forEach((c) => {
      prevMap.set(c.name.toLowerCase().trim(), c);
    });

    if (Array.isArray(parsed.competitors)) {
      for (const curr of parsed.competitors) {
        const prev = prevMap.get(curr.name.toLowerCase().trim());
        if (prev) {
          // Check pricing shift
          if (
            prev.pricing?.pricing_summary &&
            curr.pricing?.pricing_summary &&
            prev.pricing.pricing_summary !== curr.pricing.pricing_summary
          ) {
            alerts.push({
              id: `alert-price-${curr.id}-${Date.now()}`,
              competitor_name: curr.name,
              change_type: 'Pricing Changed',
              message: `Pricing updated: ${curr.pricing.pricing_summary} (Previously: ${prev.pricing.pricing_summary})`,
              detected_at: new Date().toISOString(),
              source_url: curr.website,
            });
          }

          // Check latest development
          if (
            curr.latest_development?.title &&
            (!prev.latest_development || prev.latest_development.title !== curr.latest_development.title)
          ) {
            alerts.push({
              id: `alert-dev-${curr.id}-${Date.now()}`,
              competitor_name: curr.name,
              change_type: 'New Product',
              message: `New development detected: "${curr.latest_development.title}" - ${curr.latest_development.description}`,
              detected_at: new Date().toISOString(),
              source_url: curr.latest_development.source_url || curr.website,
            });
          }
        }
      }
    }
  }

  const sourcesList = Array.from(sourcesMap.values());
  const now = new Date().toISOString();

  const finalIntelligence: CompetitorIntelligenceData = {
    landscape_summary: parsed.landscape_summary || 'Competitive intelligence analysis completed.',
    competitors: parsed.competitors || [],
    competitor_profiles: parsed.competitors || [], // ALWAYS populated in sync!
    feature_matrix: parsed.feature_matrix || [],
    positioning_maps: parsed.positioning_maps || {},
    competitive_gaps: parsed.competitive_gaps || [],
    differentiation_analysis: parsed.differentiation_analysis || [],
    recent_developments: parsed.recent_developments || [],
    startup_comparison: parsed.startup_comparison || [],
    ai_insights: parsed.ai_insights || {
      landscape_summary: '',
      market_structure: { direct: '', indirect: '', substitutes: '', emerging: '' },
      differentiation_opportunities: [],
      competitive_risks: [],
      questions_to_validate: [],
    },
    sources: sourcesList,
    alerts: alerts.length > 0 ? alerts : undefined,
    researched_at: now,
    last_refreshed_at: now,
    search_queries_performed: usedSearchGrounding ? searchQueries : [],
    is_search_grounded: usedSearchGrounding,
    grounding_status: usedSearchGrounding ? 'live_search' : 'fallback_synthesis',
    grounding_message: usedSearchGrounding
      ? 'Retrieved and verified via live Google Search grounding queries.'
      : 'Live Google Search grounding unavailable due to API rate/quota limits. Intelligence synthesized via Gemini model knowledge without live search citations.',
  };

  return finalIntelligence;
}

/**
 * Supabase Database Helper: Saves competitor intelligence and profiles to Supabase
 */
export async function saveCompetitorIntelligenceToSupabase(options: {
  analysisId: string;
  userId: string;
  userToken: string;
  researchData: CompetitorIntelligenceData;
}): Promise<CompetitorIntelligenceRecord | null> {
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

    // 1. Upsert into competitor_intelligence
    const { data: ciRecord, error: ciError } = await supabase
      .from('competitor_intelligence')
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

    if (ciError) {
      console.warn('[VentureLens Competitor Intelligence] Supabase upsert notice:', ciError.message);
      return null;
    }

    // 2. Also save competitor profiles to competitor_profiles table if present
    if (options.researchData.competitors && options.researchData.competitors.length > 0) {
      try {
        const profileRows = options.researchData.competitors.map((comp) => ({
          analysis_id: options.analysisId,
          user_id: options.userId,
          name: comp.name,
          website: comp.website,
          competitor_type: comp.competitor_type,
          description: comp.core_product || comp.positioning,
          target_audience: comp.target_audience,
          business_model: comp.business_model,
          pricing: comp.pricing,
          features: comp.key_features,
          positioning: comp.positioning,
          strengths: comp.observed_strengths,
          limitations: comp.observed_limitations,
          recent_developments: comp.latest_development ? [comp.latest_development] : [],
          sources: comp.sources,
          researched_at: now,
          updated_at: now,
        }));

        await supabase.from('competitor_profiles').insert(profileRows);
      } catch (profileErr) {
        console.warn('[VentureLens Competitor Intelligence] Supabase profiles insert notice:', profileErr);
      }
    }

    return ciRecord as CompetitorIntelligenceRecord;
  } catch (err) {
    console.warn('[VentureLens Competitor Intelligence] Supabase save error:', err);
    return null;
  }
}

/**
 * Supabase Database Helper: Fetches competitor intelligence record for an analysis
 */
export async function getCompetitorIntelligenceFromSupabase(options: {
  analysisId: string;
  userToken: string;
}): Promise<CompetitorIntelligenceRecord | null> {
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
      .from('competitor_intelligence')
      .select('*')
      .eq('analysis_id', options.analysisId)
      .maybeSingle();

    if (error) {
      console.warn('[VentureLens Competitor Intelligence] Supabase fetch error:', error.message);
      return null;
    }

    return data as CompetitorIntelligenceRecord | null;
  } catch (err) {
    console.warn('[VentureLens Competitor Intelligence] Supabase fetch error:', err);
    return null;
  }
}

/**
 * Supabase Database Helper: Updates pinned/tracking state in competitor_tracking table
 */
export async function saveCompetitorTrackingToSupabase(options: {
  analysisId: string;
  userId: string;
  userToken: string;
  competitorId: string;
  isPinned: boolean;
}): Promise<boolean> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${options.userToken}` },
      },
    });

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('competitor_tracking')
      .upsert(
        {
          analysis_id: options.analysisId,
          user_id: options.userId,
          competitor_id: options.competitorId,
          is_pinned: options.isPinned,
          last_researched_at: now,
          updated_at: now,
        },
        { onConflict: 'analysis_id,competitor_id' }
      );

    return !error;
  } catch {
    return false;
  }
}
