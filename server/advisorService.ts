import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Initialize server-side Gemini client with system environment variable
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
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

// System instruction conforming to specifications
export const ADVISOR_SYSTEM_INSTRUCTION = `You are VentureLens AI Advisor, an AI startup strategy assistant.
Help founders understand their startup idea, interpret their VentureLens analysis, identify weaknesses, and develop practical next steps.

Core Behavioral Directives:
1. Be concise, practical, objective, and honest. Never flatter without substance or sugarcoat serious structural risks.
2. Do not guarantee startup success. Never make unsubstantiated claims or imply that funding or profitability is guaranteed.
3. Do not invent real-world market statistics, competitors, customer numbers, or financial results.
4. When the user's saved analysis provides information, use it as the primary, authoritative context.
5. If specific data or context is missing from the analysis, explicitly state that it was not captured in the evaluation rather than inventing facts.
6. When giving advice based on the user's analysis, clearly distinguish between:
   - [From Your Analysis]: Information retrieved directly from their VentureLens scorecard/report.
   - [General Business Guidance]: Standard venture frameworks (e.g., Lean Startup, Mom Test, CAC/LTV benchmarks).
   - [Assumptions to Validate]: Key hypotheses that the founder must test with real customers.
7. Format your responses with structured Markdown: clean headings (###), bullet points, bold key phrases, and concise numbered action items.`;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AnalysisContextData {
  title?: string;
  industry?: string;
  target_audience?: string;
  description?: string;
  additional_info?: string;
  overall_score?: number;
  verdict?: string;
  verdict_type?: string;
  confidence_indicator?: string;
  executive_summary?: string;
  problem_score?: number;
  market_score?: number;
  competition_score?: number;
  revenue_score?: number;
  technical_score?: number;
  tam?: string;
  sam?: string;
  som?: string;
  demand_score?: number;
  growth_potential?: string;
  market_trends?: string[];
  key_insights?: string;
  customer_pain_points?: string[];
  existing_alternatives?: string[];
  competitors?: Array<{
    name: string;
    description?: string;
    strengths?: string[];
    weaknesses?: string[];
    target_customer?: string;
    differentiation_opportunity?: string;
  }>;
  recommended_business_model?: string;
  customer_segment?: string;
  pricing_strategy?: string;
  revenue_streams?: string[];
  monetization_strategy?: string;
  unit_economics?: string;
  technical_feasibility?: {
    recommended_technology_direction?: string;
    major_technical_requirements?: string[];
    complexity?: string;
    scalability_considerations?: string;
    technical_risks?: string[];
  };
  risks?: Array<{
    category: string;
    description: string;
    severity: string;
    probability: string;
    impact: string;
    mitigation: string;
  }>;
  mvp_phases?: Array<{
    phase: string;
    duration: string;
    features: string[];
    goal: string;
    priority: string;
  }>;
  must_have_features?: string[];
  recommendations?: Array<{
    action: string;
    priority: string;
    category: string;
    reason: string;
  }>;
  go_to_market?: {
    initial_target_customer?: string;
    acquisition_channels?: string[];
    launch_strategy?: string;
    positioning?: string;
    early_validation_strategy?: string;
  };
}

/**
 * Formats a saved analysis into an authoritative grounding document for Gemini
 */
export function buildContextGroundingString(context: AnalysisContextData): string {
  const parts: string[] = [];

  parts.push(`=== SAVED VENTURELENS STARTUP ANALYSIS CONTEXT ===`);
  parts.push(`STARTUP IDENTITY:`);
  parts.push(`- Title: ${context.title || 'Untitled Concept'}`);
  parts.push(`- Industry: ${context.industry || 'Unspecified'}`);
  parts.push(`- Target Audience: ${context.target_audience || 'Unspecified'}`);
  parts.push(`- Idea Description: ${context.description || 'No description provided'}`);
  if (context.additional_info) {
    parts.push(`- Additional Founder Notes: ${context.additional_info}`);
  }

  parts.push(`\nOVERALL EVALUATION SCORECARD:`);
  parts.push(`- Overall Score: ${context.overall_score !== undefined ? `${context.overall_score}/100` : 'N/A'}`);
  parts.push(`- Official Verdict: ${context.verdict_type || 'N/A'} - "${context.verdict || 'N/A'}"`);
  parts.push(`- Model Confidence: ${context.confidence_indicator || 'Moderate'}`);
  if (context.executive_summary) {
    parts.push(`- Executive Summary: ${context.executive_summary}`);
  }

  parts.push(`\nPILLAR SCORES (0-100):`);
  parts.push(`- Problem Validation: ${context.problem_score ?? 'N/A'}/100`);
  parts.push(`- Market Opportunity: ${context.market_score ?? 'N/A'}/100`);
  parts.push(`- Competitive Moat: ${context.competition_score ?? 'N/A'}/100`);
  parts.push(`- Revenue Potential: ${context.revenue_score ?? 'N/A'}/100`);
  parts.push(`- Technical Feasibility: ${context.technical_score ?? 'N/A'}/100`);

  if (context.customer_pain_points && context.customer_pain_points.length > 0) {
    parts.push(`\nVALIDATED CUSTOMER PAIN POINTS:`);
    context.customer_pain_points.forEach((p, idx) => parts.push(`  ${idx + 1}. ${p}`));
  }

  if (context.tam || context.sam || context.som) {
    parts.push(`\nMARKET SIZING (TAM/SAM/SOM):`);
    if (context.tam) parts.push(`- TAM (Total Addressable Market): ${context.tam}`);
    if (context.sam) parts.push(`- SAM (Serviceable Available Market): ${context.sam}`);
    if (context.som) parts.push(`- SOM (Serviceable Obtainable Market): ${context.som}`);
    if (context.demand_score) parts.push(`- Customer Demand Score: ${context.demand_score}/100`);
    if (context.growth_potential) parts.push(`- Growth Trajectory: ${context.growth_potential}`);
    if (context.market_trends && context.market_trends.length > 0) {
      parts.push(`- Key Market Trends: ${context.market_trends.join(', ')}`);
    }
    if (context.key_insights) parts.push(`- Market Insights: ${context.key_insights}`);
  }

  if (context.competitors && context.competitors.length > 0) {
    parts.push(`\nIDENTIFIED COMPETITORS & DIFFERENTIATION:`);
    context.competitors.forEach((c) => {
      parts.push(`- ${c.name}: ${c.description || ''}`);
      if (c.strengths && c.strengths.length) parts.push(`  * Strengths: ${c.strengths.join(', ')}`);
      if (c.weaknesses && c.weaknesses.length) parts.push(`  * Weaknesses: ${c.weaknesses.join(', ')}`);
      if (c.differentiation_opportunity) parts.push(`  * Differentiation Opportunity: ${c.differentiation_opportunity}`);
    });
  }

  if (context.recommended_business_model || context.pricing_strategy) {
    parts.push(`\nBUSINESS MODEL & UNIT ECONOMICS:`);
    if (context.recommended_business_model) parts.push(`- Recommended Model: ${context.recommended_business_model}`);
    if (context.customer_segment) parts.push(`- Target Customer Segment: ${context.customer_segment}`);
    if (context.pricing_strategy) parts.push(`- Pricing Strategy: ${context.pricing_strategy}`);
    if (context.revenue_streams && context.revenue_streams.length) {
      parts.push(`- Revenue Streams: ${context.revenue_streams.join(', ')}`);
    }
    if (context.monetization_strategy) parts.push(`- Monetization Strategy: ${context.monetization_strategy}`);
    if (context.unit_economics) parts.push(`- Unit Economics Considerations: ${context.unit_economics}`);
  }

  if (context.technical_feasibility) {
    const tf = context.technical_feasibility;
    parts.push(`\nTECHNICAL ARCHITECTURE & FEASIBILITY:`);
    if (tf.recommended_technology_direction) parts.push(`- Tech Direction: ${tf.recommended_technology_direction}`);
    if (tf.complexity) parts.push(`- Implementation Complexity: ${tf.complexity}`);
    if (tf.major_technical_requirements?.length) {
      parts.push(`- Tech Requirements: ${tf.major_technical_requirements.join(', ')}`);
    }
    if (tf.technical_risks?.length) {
      parts.push(`- Technical Risks: ${tf.technical_risks.join(', ')}`);
    }
  }

  if (context.risks && context.risks.length > 0) {
    parts.push(`\nIDENTIFIED RISKS & MITIGATIONS:`);
    context.risks.forEach((r) => {
      parts.push(`- [${r.severity} Severity / ${r.probability} Probability] ${r.category}: ${r.description}`);
      parts.push(`  * Proposed Mitigation: ${r.mitigation}`);
    });
  }

  if (context.mvp_phases && context.mvp_phases.length > 0) {
    parts.push(`\nMVP ROADMAP:`);
    context.mvp_phases.forEach((phase) => {
      parts.push(`- Phase: ${phase.phase} (${phase.duration}) - Goal: ${phase.goal}`);
      if (phase.features?.length) {
        parts.push(`  * Features: ${phase.features.join(', ')}`);
      }
    });
  }

  if (context.recommendations && context.recommendations.length > 0) {
    parts.push(`\nRECOMMENDED FOUNDER ACTION PLAN:`);
    context.recommendations.forEach((rec, idx) => {
      parts.push(`  ${idx + 1}. [${rec.priority} Priority - ${rec.category}] ${rec.action} (Reason: ${rec.reason})`);
    });
  }

  if (context.go_to_market) {
    const gtm = context.go_to_market;
    parts.push(`\nGO-TO-MARKET (GTM) STRATEGY:`);
    if (gtm.initial_target_customer) parts.push(`- Initial Customer Profile: ${gtm.initial_target_customer}`);
    if (gtm.acquisition_channels?.length) parts.push(`- Acquisition Channels: ${gtm.acquisition_channels.join(', ')}`);
    if (gtm.launch_strategy) parts.push(`- Launch Strategy: ${gtm.launch_strategy}`);
    if (gtm.positioning) parts.push(`- Positioning: ${gtm.positioning}`);
    if (gtm.early_validation_strategy) parts.push(`- Early Validation: ${gtm.early_validation_strategy}`);
  }

  parts.push(`=== END OF SAVED ANALYSIS CONTEXT ===\n`);
  return parts.join('\n');
}

/**
 * Securely fetch analysis from Supabase and verify ownership against authenticated user
 */
export async function fetchVerifiedAnalysis(
  analysisId: string,
  userToken?: string
): Promise<{ context: AnalysisContextData; authorized: boolean; error?: string }> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { context: {}, authorized: false, error: 'Database service configuration missing.' };
  }

  // If no auth token provided, verify if demo/guest access is appropriate or require login
  if (!userToken) {
    return { context: {}, authorized: false, error: 'Authentication required to access saved startup analysis.' };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${userToken}` },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(userToken);

    if (userError || !user) {
      return { context: {}, authorized: false, error: 'Invalid or expired authentication session.' };
    }

    // Query analysis joined with startup_ideas
    // Match either analysis.id = analysisId OR analysis.idea_id = analysisId
    const { data: analysisRows, error: analysisQueryError } = await supabase
      .from('analyses')
      .select(`
        *,
        startup_ideas (*),
        market_analysis (*),
        competitors (*),
        business_models (*),
        risks (*),
        mvp_roadmap (*),
        recommendations (*)
      `)
      .or(`id.eq.${analysisId},idea_id.eq.${analysisId}`)
      .limit(1);

    if (analysisQueryError) {
      console.error('[VentureLens Chat] Error fetching analysis from Supabase:', analysisQueryError);
      return { context: {}, authorized: false, error: 'Failed to retrieve analysis from database.' };
    }

    if (!analysisRows || analysisRows.length === 0) {
      return { context: {}, authorized: false, error: 'Analysis not found or you do not have permission to view it.' };
    }

    const analysis = analysisRows[0];
    const idea = analysis.startup_ideas;

    // Strict ownership verification:
    // Analysis must belong to the authenticated user ID
    if (analysis.user_id !== user.id && idea?.user_id !== user.id) {
      return {
        context: {},
        authorized: false,
        error: 'Unauthorized: You do not have permission to access or discuss this analysis.',
      };
    }

    // Build unified context data from raw_gemini_response and relational tables
    const raw = analysis.raw_gemini_response || {};
    const market = (analysis.market_analysis && analysis.market_analysis[0]) || raw.market_analysis || {};
    const businessModel = (analysis.business_models && analysis.business_models[0]) || raw.business_model || {};
    const problem = raw.problem_validation || {};
    const tech = raw.technical_feasibility || {};
    const gtm = raw.go_to_market || {};
    const competitorsList = analysis.competitors?.length ? analysis.competitors : raw.competitor_analysis?.competitors || [];
    const risksList = analysis.risks?.length ? analysis.risks : raw.risks || [];
    const mvpList = analysis.mvp_roadmap?.length ? analysis.mvp_roadmap : raw.mvp_roadmap?.phases || [];
    const recsList = analysis.recommendations?.length ? analysis.recommendations : raw.recommendations || [];

    const context: AnalysisContextData = {
      title: idea?.title || raw.title,
      industry: idea?.industry || raw.industry,
      target_audience: idea?.target_audience || raw.target_audience,
      description: idea?.description || raw.description,
      additional_info: idea?.additional_info || raw.additional_info,
      overall_score: analysis.overall_score ?? raw.overall_score,
      verdict: analysis.verdict ?? raw.verdict,
      verdict_type: analysis.verdict_type ?? raw.verdict_type,
      confidence_indicator: analysis.confidence_indicator ?? raw.confidence_indicator,
      executive_summary: analysis.executive_summary ?? raw.executive_summary,
      problem_score: analysis.problem_score ?? raw.problem_score,
      market_score: analysis.market_score ?? raw.market_score,
      competition_score: analysis.competition_score ?? raw.competition_score,
      revenue_score: analysis.revenue_score ?? raw.revenue_score,
      technical_score: analysis.technical_score ?? raw.technical_score,
      tam: market.tam,
      sam: market.sam,
      som: market.som,
      demand_score: market.demand_score,
      growth_potential: market.growth_potential,
      market_trends: market.market_trends,
      key_insights: market.key_insights,
      customer_pain_points: problem.customer_pain_points,
      existing_alternatives: problem.existing_alternatives,
      competitors: competitorsList.map((c: any) => ({
        name: c.name,
        description: c.description,
        strengths: c.strengths,
        weaknesses: c.weaknesses,
        target_customer: c.target_customer,
        differentiation_opportunity: c.differentiation_opportunity,
      })),
      recommended_business_model: businessModel.recommended_business_model || businessModel.recommended_model,
      customer_segment: businessModel.customer_segment,
      pricing_strategy: businessModel.pricing_strategy,
      revenue_streams: businessModel.revenue_streams,
      monetization_strategy: businessModel.monetization_strategy,
      unit_economics: businessModel.unit_economics_considerations || businessModel.unit_economics,
      technical_feasibility: {
        recommended_technology_direction: tech.recommended_technology_direction,
        major_technical_requirements: tech.major_technical_requirements,
        complexity: tech.complexity,
        scalability_considerations: tech.scalability_considerations,
        technical_risks: tech.technical_risks,
      },
      risks: risksList.map((r: any) => ({
        category: r.category,
        description: r.description,
        severity: r.severity,
        probability: r.probability,
        impact: r.impact,
        mitigation: r.mitigation,
      })),
      mvp_phases: mvpList.map((m: any) => ({
        phase: m.phase || m.phase_name,
        duration: m.duration,
        features: m.features,
        goal: m.goal,
        priority: m.priority,
      })),
      must_have_features: raw.mvp_roadmap?.must_have_features,
      recommendations: recsList.map((rec: any) => ({
        action: rec.action,
        priority: rec.priority,
        category: rec.category,
        reason: rec.reason,
      })),
      go_to_market: {
        initial_target_customer: gtm.initial_target_customer,
        acquisition_channels: gtm.acquisition_channels,
        launch_strategy: gtm.launch_strategy,
        positioning: gtm.positioning,
        early_validation_strategy: gtm.early_validation_strategy,
      },
    };

    return { context, authorized: true };
  } catch (err: any) {
    console.error('[VentureLens Chat] Database verification error:', err);
    return { context: {}, authorized: false, error: err.message || 'Database access error.' };
  }
}

/**
 * Execute Gemini conversational turn with streaming or standard return
 */
export async function streamAdvisorResponse(options: {
  message: string;
  history: ChatMessage[];
  analysisContext?: AnalysisContextData | null;
  onChunk: (chunk: string) => void;
}): Promise<string> {
  const { message, history, analysisContext, onChunk } = options;
  const ai = getGeminiClient();

  // Construct system instruction with contextual grounding if analysis exists
  let fullSystemInstruction = ADVISOR_SYSTEM_INSTRUCTION;
  if (analysisContext && analysisContext.title) {
    const groundingDoc = buildContextGroundingString(analysisContext);
    fullSystemInstruction += `\n\n${groundingDoc}\nCRITICAL INSTRUCTION: The founder is asking about the startup "${analysisContext.title}". Always refer to these specific evaluation findings, scores, unit economics, risks, and competitor data when answering.`;
  } else {
    fullSystemInstruction += `\n\nNo specific startup analysis is currently selected. Provide expert, high-level startup mentorship and practical guidance for early-stage founders.`;
  }

  // Format conversational contents for Gemini
  // Trim history to last 10 messages for token efficiency and responsiveness
  const recentHistory = (history || []).slice(-10);
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const turn of recentHistory) {
    if (turn.text && turn.text.trim()) {
      contents.push({
        role: turn.role === 'user' ? 'user' : 'model',
        parts: [{ text: turn.text.trim() }],
      });
    }
  }

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: message.trim() }],
  });

  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.6-flash'];
  let lastError: any = null;
  let fullAccumulatedText = '';

  for (const modelName of modelsToTry) {
    try {
      console.log(`[VentureLens AI Advisor] Generating response using model: ${modelName}...`);
      const stream = await ai.models.generateContentStream({
        model: modelName,
        contents,
        config: {
          systemInstruction: fullSystemInstruction,
          temperature: 0.6,
          maxOutputTokens: 2048,
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          fullAccumulatedText += text;
          onChunk(text);
        }
      }

      if (fullAccumulatedText.trim().length > 0) {
        return fullAccumulatedText;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[VentureLens AI Advisor] Model ${modelName} stream error:`, err?.message || err);
      fullAccumulatedText = ''; // reset for next model attempt
    }
  }

  // If streaming failed on all attempts, throw user-friendly error message
  console.error('[VentureLens AI Advisor] All model attempts failed. Last error:', lastError);
  throw new Error('VentureLens AI is temporarily unavailable. Please try again.');
}
