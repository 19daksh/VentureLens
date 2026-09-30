import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import {
  GrowthRoadmapData,
  GrowthRoadmapRecord,
  ExecutionPace,
  TeamCapacity,
  MonthlyMilestone,
  TacticalActionItem,
} from '../src/types/growthRoadmap';

// Initialize Gemini Client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY is not configured.');
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

// Local File Persistence Setup
const localDataDir = path.join(process.cwd(), 'data');
const roadmapFile = path.join(localDataDir, 'growth_roadmaps.json');
const memoryRoadmaps = new Map<string, GrowthRoadmapRecord>();

try {
  if (!fs.existsSync(localDataDir)) {
    fs.mkdirSync(localDataDir, { recursive: true });
  }
  if (fs.existsSync(roadmapFile)) {
    const raw = fs.readFileSync(roadmapFile, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      parsed.forEach((item) => {
        if (item && item.idea_id) {
          memoryRoadmaps.set(item.idea_id, item);
        }
      });
    }
  }
} catch (e) {
  console.warn('[Growth Roadmap] Init storage note:', e);
}

function persistRoadmapsToFile() {
  try {
    const list = Array.from(memoryRoadmaps.values());
    fs.writeFileSync(roadmapFile, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Growth Roadmap] File persist error:', err);
  }
}

// JSON Schema for Gemini structured output
const growthRoadmapSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'A 2-3 sentence strategic rationale for this 6-month growth sequence.',
    },
    northStarMetric: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'E.g. Weekly Active Workspaces, Net New ARR, Completed Bookings' },
        sixMonthTarget: { type: Type.STRING, description: 'Specific quantifiable milestone target for Month 6, e.g. $15k MRR or 500 WAU' },
        definition: { type: Type.STRING, description: 'Why this metric encapsulates real product-market fit value' },
      },
      required: ['name', 'sixMonthTarget', 'definition'],
    },
    executivePlaybook: {
      type: Type.OBJECT,
      properties: {
        strategicFocus: { type: Type.STRING, description: 'The single dominant strategic thesis for the first 6 months' },
        primaryGrowthLoop: { type: Type.STRING, description: 'The main self-reinforcing acquisition loop (e.g. content SEO, viral sharing, outbound sales)' },
        criticalAssumptionsToTest: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Top 3 riskiest assumptions that would kill the company if false',
        },
        capitalEfficiencyGuideline: { type: Type.STRING, description: 'Rule of thumb for burn rate and expenditure during this phase' },
      },
      required: ['strategicFocus', 'primaryGrowthLoop', 'criticalAssumptionsToTest', 'capitalEfficiencyGuideline'],
    },
    months: {
      type: Type.ARRAY,
      description: 'Exactly 6 monthly milestones (Month 1 through Month 6)',
      items: {
        type: Type.OBJECT,
        properties: {
          month: { type: Type.INTEGER, description: 'Month number: 1, 2, 3, 4, 5, or 6' },
          phaseTitle: { type: Type.STRING, description: 'E.g. "Month 1: Problem-Solution Validation & Demand Smoke Test"' },
          theme: { type: Type.STRING, description: 'The core operational objective of the month' },
          priority: { type: Type.STRING, description: '"critical", "high", or "medium"' },
          keyObjectives: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3-4 specific milestones to achieve this month',
          },
          primaryKpis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                metric: { type: Type.STRING },
                target: { type: Type.STRING },
                rationale: { type: Type.STRING },
              },
              required: ['metric', 'target', 'rationale'],
            },
          },
          successGate: {
            type: Type.STRING,
            description: 'The definitive gate criterion to pass before moving to the next month',
          },
          actionItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING, description: '"validation", "product", "growth", "monetization", or "operations"' },
                priority: { type: Type.STRING, description: '"critical", "high", or "medium"' },
                estimatedDays: { type: Type.INTEGER },
                deliverable: { type: Type.STRING },
                recommendedTools: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['id', 'title', 'description', 'category', 'priority', 'estimatedDays', 'deliverable'],
            },
          },
          potentialPitfalls: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          suggestedStack: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          estimatedBudgetUsd: { type: Type.STRING },
        },
        required: ['month', 'phaseTitle', 'theme', 'priority', 'keyObjectives', 'primaryKpis', 'successGate', 'actionItems', 'potentialPitfalls', 'suggestedStack'],
      },
    },
    suggestedPivotsOrTriggers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          condition: { type: Type.STRING, description: 'Early warning trigger, e.g. "If Month 2 activation is < 10%"' },
          recommendedPivot: { type: Type.STRING, description: 'Tactical pivot or contingency action' },
        },
        required: ['condition', 'recommendedPivot'],
      },
    },
  },
  required: ['summary', 'northStarMetric', 'executivePlaybook', 'months', 'suggestedPivotsOrTriggers'],
};

/**
 * Executes AI generation of a prioritized 6-month growth roadmap
 */
export async function executeGrowthRoadmapGeneration(params: {
  ideaId: string;
  pace?: ExecutionPace;
  teamCapacity?: TeamCapacity;
  analysisContext: any;
}): Promise<GrowthRoadmapData> {
  const pace = params.pace || 'lean_bootstrapped';
  const capacity = params.teamCapacity || 'small_team';
  const ctx = params.analysisContext || {};

  const ideaTitle = ctx.idea?.title || ctx.title || 'Startup Venture';
  const industry = ctx.idea?.industry || ctx.industry || 'Technology';
  const targetAudience = ctx.idea?.target_audience || ctx.target_audience || 'Target Customers';
  const description = ctx.idea?.description || ctx.description || '';
  const overallScore = ctx.analysis?.overall_score || 75;
  const verdict = ctx.analysis?.verdict || 'Build with disciplined validation';
  const verdictType = ctx.analysis?.verdict_type || 'Build';
  const problemValidation = ctx.analysis?.problem_validation || {};
  const marketAnalysis = ctx.analysis?.market_analysis || {};
  const competitorIntel = ctx.analysis?.competitor_intelligence || ctx.idea?.competitor_intelligence || {};
  const financialProj = ctx.analysis?.financial_projection || ctx.idea?.financial_projection || {};
  const risks = ctx.analysis?.risks || [];
  const mvpRoadmap = ctx.analysis?.mvp_roadmap || {};

  try {
    const ai = getGeminiClient();

    const prompt = `You are an elite startup growth architect and venture partner from a top accelerator (Y Combinator, Sequoia, a16z).
Your task is to generate a comprehensive, prioritized, tactical 6-Month Growth Roadmap specifically tailored for this startup:

=== STARTUP CONTEXT ===
Title: "${ideaTitle}"
Industry/Sector: ${industry}
Target Audience: ${targetAudience}
Description: "${description}"

=== VALIDATION DILIGENCE SIGNALS ===
Overall Validation Score: ${overallScore}/100
Verdict: ${verdictType} ("${verdict}")
Executive Summary: "${ctx.analysis?.executive_summary || 'N/A'}"
Customer Pain Points: ${JSON.stringify(problemValidation.customer_pain_points || [])}
Market TAM/SAM/SOM: TAM=${marketAnalysis.tam || 'N/A'}, SAM=${marketAnalysis.sam || 'N/A'}, SOM=${marketAnalysis.som || 'N/A'}
Market Trends: ${JSON.stringify(marketAnalysis.market_trends || [])}
Top Risks: ${JSON.stringify(risks.slice(0, 3))}
MVP Must-Have Features: ${JSON.stringify(mvpRoadmap.must_have_features || [])}
Financials / Target Margin: ${financialProj?.unit_economics?.gross_margin_pct ? `${financialProj.unit_economics.gross_margin_pct}% gross margin` : 'Standard SaaS'}

=== EXECUTION PARAMETERS ===
Execution Pace: "${pace}" (lean_bootstrapped = capital-efficient organic growth; venture_scale = aggressive milestone velocity & seed metrics; enterprise_b2b = high ACV, design partners & security review)
Team Capacity: "${capacity}" (solo_founder = focused single-threaded execution; small_team = 2-3 co-founders; funded_team = 4-6 cross-functional engineers & operators)

=== INSTRUCTIONS ===
1. Craft a chronological 6-Month Roadmap with EXACTLY 6 months (Months 1, 2, 3, 4, 5, 6).
2. Each month MUST address the exact reality of this idea:
   - Month 1: Problem-Solution Fit, Customer Discovery, Smoke Tests & Pre-Commitments
   - Month 2: Core MVP Build, Closed Alpha & Design Partner Validation
   - Month 3: Private Beta, Activation Funnel & Retention Benchmarking
   - Month 4: Public Launch Wedge, Distribution Loop & Community Seeding
   - Month 5: Monetization Gate, Pricing Validation & CAC:LTV Stress-Testing
   - Month 6: Scalable Growth Engine, Channel Repeatability & Seed Diligence Readiness
3. For EVERY month, provide:
   - Clear theme and phase title
   - 3-4 Key Objectives
   - 2-3 Primary KPIs with quantifiable targets and rationale
   - Strict "Success Gate" (a go/no-go hurdle before advancing)
   - 3-5 Tactical Action Items with category (validation, product, growth, monetization, operations), priority, estimated days, deliverable, and recommended modern SaaS tools (e.g. PostHog, Stripe, Linear, Apollo, Supabase, etc.)
   - Potential Pitfalls derived from this startup's specific risks
   - Suggested Tech & Tool Stack
4. Provide a definitive North Star Metric, an Executive Playbook (growth loop, critical assumptions, burn rule), and 2-3 Pivot Triggers.

Return strictly structured JSON conforming to the schema.`;

    const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let response: any = null;
    for (const model of models) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: growthRoadmapSchema,
            temperature: 0.35,
          },
        });
        if (response?.text) break;
      } catch (mErr) {
        console.warn(`[Growth Roadmap] Model ${model} failed, trying fallback:`, mErr);
      }
    }

    const text = response?.text?.trim() || '{}';
    const parsed: GrowthRoadmapData = JSON.parse(text);

    if (parsed.months && parsed.months.length > 0) {
      // Ensure unique action IDs
      parsed.months.forEach((m, mIdx) => {
        if (!m.month) m.month = mIdx + 1;
        if (m.actionItems) {
          m.actionItems.forEach((item, aIdx) => {
            if (!item.id) item.id = `m${m.month}-act-${aIdx + 1}`;
            item.completed = false;
          });
        }
      });
      return parsed;
    }
  } catch (err) {
    console.warn('[Growth Roadmap] Gemini generation fallback:', err);
  }

  // Heuristic Fallback Generator
  return generateHeuristicGrowthRoadmap({
    ideaTitle,
    industry,
    targetAudience,
    description,
    overallScore,
    pace,
    capacity,
    mvpRoadmap,
    risks,
  });
}

/**
 * High-fidelity heuristic fallback when Gemini API is unavailable
 */
export function generateHeuristicGrowthRoadmap(ctx: {
  ideaTitle: string;
  industry: string;
  targetAudience: string;
  description: string;
  overallScore: number;
  pace: ExecutionPace;
  capacity: TeamCapacity;
  mvpRoadmap: any;
  risks: any[];
}): GrowthRoadmapData {
  const isEnterprise = ctx.pace === 'enterprise_b2b';
  const isVenture = ctx.pace === 'venture_scale';
  const isSolo = ctx.capacity === 'solo_founder';

  const northStar = isEnterprise
    ? {
        name: 'Active Enterprise Pilots & Qualified Pipeline',
        sixMonthTarget: '$60k ARR or 5 Committed Annual Contracts',
        definition: 'Demonstrates willingness to pay high contract values and integrate into existing workflow.',
      }
    : isVenture
    ? {
        name: 'Weekly Active Workspaces with 40%+ D30 Retention',
        sixMonthTarget: '1,500 Active Workspaces & $8,000 MRR',
        definition: 'High organic engagement showing habit formation and venture-scale growth dynamics.',
      }
    : {
        name: 'Net Paid Subscribers & Positive Contribution Margin',
        sixMonthTarget: '150 Paying Customers ($4,500 MRR at 85% Gross Margin)',
        definition: 'Self-sustaining profitability proving unit economics before hiring or expansion.',
      };

  const months: MonthlyMilestone[] = [
    {
      month: 1,
      phaseTitle: 'Month 1: Customer Discovery & Demand Smoke-Testing',
      theme: `Verify deep urgency in ${ctx.targetAudience} before writing complex production code.`,
      priority: 'critical',
      keyObjectives: [
        'Conduct 35 structured customer discovery interviews using The Mom Test principles',
        'Publish high-converting landing page with value prop and interactive mockups',
        'Secure 50+ qualified email waitlist signups or 5 pre-order LOIs',
      ],
      primaryKpis: [
        { metric: 'Discovery Interviews', target: '35 completed', rationale: 'Uncover real willingness to pay and existing workarounds' },
        { metric: 'Landing Page Conversion', target: '> 12% opt-in', rationale: 'Validates messaging clarity and problem resonance' },
      ],
      successGate: isEnterprise
        ? 'At least 3 enterprise target buyers agree to second technical discovery meeting.'
        : 'At least 20 prospective users state this solves a weekly burning problem.',
      actionItems: [
        {
          id: 'm1-act-1',
          title: 'Cold Outreach & Interview Sprint',
          description: `Reach out to 100 prospective ${ctx.targetAudience} on LinkedIn/Twitter/Email to schedule 30-min discovery calls.`,
          category: 'validation',
          priority: 'critical',
          estimatedDays: isSolo ? 10 : 6,
          completed: false,
          deliverable: 'Interview Insights Repository & Pain Point Matrix',
          recommendedTools: ['Apollo.io', 'Cal.com', 'Notion'],
        },
        {
          id: 'm1-act-2',
          title: 'Value Proposition Smoke-Test Landing Page',
          description: `Build a clean, high-conviction landing page explaining the ${ctx.ideaTitle} core solution with an interactive product preview.`,
          category: 'growth',
          priority: 'high',
          estimatedDays: 4,
          completed: false,
          deliverable: 'Live landing page with analytics & waitlist capture',
          recommendedTools: ['Vercel', 'Tailwind', 'PostHog'],
        },
        {
          id: 'm1-act-3',
          title: 'Competitive Differentiation Teardown',
          description: 'Document current alternatives and define the single defensible feature wedge that incumbents ignore.',
          category: 'product',
          priority: 'high',
          estimatedDays: 3,
          completed: false,
          deliverable: '1-Page Wedge Specification',
          recommendedTools: ['Figma', 'Miro'],
        },
      ],
      potentialPitfalls: ['Accepting polite compliments instead of validating real commitments', 'Building before verifying customer workflow'],
      suggestedStack: ['Figma', 'Cal.com', 'PostHog', 'Resend'],
      estimatedBudgetUsd: '$50 - $200',
    },
    {
      month: 2,
      phaseTitle: 'Month 2: Core MVP Build & Closed Alpha Cohort',
      theme: 'Build strictly the non-negotiable P0 features and onboard 10 design partners.',
      priority: 'critical',
      keyObjectives: [
        'Deploy functional end-to-end prototype containing only core value loop',
        'Hand-onboard first 10-15 active alpha users with direct Slack/Discord channel',
        'Instrument telemetry for user activation, latency, and core event completion',
      ],
      primaryKpis: [
        { metric: 'Alpha User Activation', target: '10 active users completing core loop', rationale: 'Proves technical feasibility with real workflows' },
        { metric: 'Time-to-Value (TTV)', target: '< 4 minutes', rationale: 'Fast onboarding ensures high activation velocity' },
      ],
      successGate: '7 of 10 alpha users use the core feature weekly without founder hand-holding.',
      actionItems: [
        {
          id: 'm2-act-1',
          title: 'P0 Feature Sprint (Core Engine)',
          description: `Implement the primary workflow for ${ctx.ideaTitle} without speculative secondary settings.`,
          category: 'product',
          priority: 'critical',
          estimatedDays: isSolo ? 14 : 9,
          completed: false,
          deliverable: 'Tested, production-deployed web application',
          recommendedTools: ['React', 'TypeScript', 'Supabase', 'Node.js'],
        },
        {
          id: 'm2-act-2',
          title: 'Telemetry & Error Tracking Setup',
          description: 'Set up session recording, funnel event tracking, and automated error reporting.',
          category: 'operations',
          priority: 'high',
          estimatedDays: 3,
          completed: false,
          deliverable: 'Real-time analytics dashboard with activation funnels',
          recommendedTools: ['PostHog', 'Sentry'],
        },
        {
          id: 'm2-act-3',
          title: 'Concierge Onboarding Playbook',
          description: 'Schedule 1-on-1 walkthroughs with all alpha cohort members to observe first-run friction live.',
          category: 'validation',
          priority: 'high',
          estimatedDays: 5,
          completed: false,
          deliverable: 'UX Friction Audit & Sprint Fix List',
          recommendedTools: ['Loom', 'Zoom'],
        },
      ],
      potentialPitfalls: ['Feature creep delaying alpha launch', 'Ignoring early onboarding drop-offs'],
      suggestedStack: ['Supabase', 'Vite', 'Tailwind', 'PostHog'],
      estimatedBudgetUsd: '$100 - $350',
    },
    {
      month: 3,
      phaseTitle: 'Month 3: Private Beta & Retention Tuning',
      theme: 'Drive retention curves to plateau by aggressively removing friction from core workflow.',
      priority: 'high',
      keyObjectives: [
        'Expand to 50 active private beta workspaces/users',
        'Run Sean Ellis PMF survey ("How would you feel if you could no longer use this?")',
        'Ship top 3 user-requested workflow accelerators',
      ],
      primaryKpis: [
        { metric: 'PMF Survey Score', target: '> 40% "Very Disappointed"', rationale: 'Industry benchmark for true Product-Market Fit' },
        { metric: 'D14 User Retention', target: '> 35%', rationale: 'Ensures organic stickiness before scaling acquisition' },
      ],
      successGate: 'PMF survey "Very Disappointed" rate >= 35% with at least 30 responding users.',
      actionItems: [
        {
          id: 'm3-act-1',
          title: 'Retention & Churn Analysis Audit',
          description: 'Identify the exact step where disengaged users stop returning and rebuild that interaction.',
          category: 'product',
          priority: 'critical',
          estimatedDays: 6,
          completed: false,
          deliverable: 'Retention cohort teardown & fix deployment',
          recommendedTools: ['PostHog', 'Mixpanel'],
        },
        {
          id: 'm3-act-2',
          title: 'Automated Lifecycle Email Sequences',
          description: 'Build triggered emails for onboarding completion, weekly digest, and inactive user re-engagement.',
          category: 'growth',
          priority: 'medium',
          estimatedDays: 4,
          completed: false,
          deliverable: '4-part automated drip lifecycle campaigns',
          recommendedTools: ['Resend', 'Loops.so'],
        },
      ],
      potentialPitfalls: ['Scaling top-of-funnel before fixing a leaky bucket retention curve'],
      suggestedStack: ['Loops.so', 'PostHog', 'Linear'],
      estimatedBudgetUsd: '$150 - $400',
    },
    {
      month: 4,
      phaseTitle: 'Month 4: Public Launch & Early Distribution Wedge',
      theme: 'Execute coordinated public launch to seed the primary repeatable customer acquisition channel.',
      priority: 'high',
      keyObjectives: [
        'Public launch on Product Hunt, Hacker News, relevant niche subreddits, and industry forums',
        'Onboard 200+ new users during launch week',
        'Establish founder-led social proof loop and case study video testimonials',
      ],
      primaryKpis: [
        { metric: 'Launch Signups', target: '250+ new accounts', rationale: 'Creates initial critical mass for viral and referral loops' },
        { metric: 'Organic Referral Rate', target: '> 15% new users from referrals', rationale: 'Proves natural word-of-mouth excitement' },
      ],
      successGate: 'Acquire at least 150 activated users within 14 days of launch with < $10 blended CAC.',
      actionItems: [
        {
          id: 'm4-act-1',
          title: 'Launch Asset & Storytelling Package',
          description: 'Create high-impact demo video, founder manifesto, social assets, and press pitch.',
          category: 'growth',
          priority: 'critical',
          estimatedDays: 7,
          completed: false,
          deliverable: 'Launch kit with interactive video & social posts',
          recommendedTools: ['Screen Studio', 'Figma', 'Twitter/X'],
        },
        {
          id: 'm4-act-2',
          title: 'SEO & Programmatic Inbound Baseline',
          description: 'Publish 5 high-intent comparison and problem-solution guides targeting active searchers in this space.',
          category: 'growth',
          priority: 'medium',
          estimatedDays: 5,
          completed: false,
          deliverable: '5 search-indexed, long-tail acquisition articles',
          recommendedTools: ['Next.js / Vite', 'Ahrefs', 'Markdown'],
        },
      ],
      potentialPitfalls: ['Treating launch day as a one-time spike rather than an engine', 'Server bottlenecks under launch traffic'],
      suggestedStack: ['Product Hunt', 'Screen Studio', 'Supabase CDN'],
      estimatedBudgetUsd: '$200 - $600',
    },
    {
      month: 5,
      phaseTitle: 'Month 5: Monetization Gate & Unit Economics Validation',
      theme: 'Turn on pricing gates, validate willingness to pay, and calibrate CAC-to-LTV ratio.',
      priority: 'critical',
      keyObjectives: [
        'Launch self-serve billing tier with Stripe checkout and usage-based upgrades',
        'Convert at least 5% of active users to paying customers',
        'Calculate true Payback Period and customer acquisition cost across channels',
      ],
      primaryKpis: [
        { metric: 'Monthly Recurring Revenue (MRR)', target: isEnterprise ? '$5,000 MRR' : '$2,500 MRR', rationale: 'Proves hard economic value exchange' },
        { metric: 'Free-to-Paid Conversion', target: '> 4.5%', rationale: 'Demonstrates clear paywall value alignment' },
      ],
      successGate: 'Reach minimum 25 paying subscriptions or $2,000 MRR with zero refund requests.',
      actionItems: [
        {
          id: 'm5-act-1',
          title: 'Stripe Billing & Subscription Architecture',
          description: 'Integrate multi-tier pricing, customer portal, annual discounts, and automated receipts.',
          category: 'monetization',
          priority: 'critical',
          estimatedDays: 5,
          completed: false,
          deliverable: 'Live automated checkout and subscription billing',
          recommendedTools: ['Stripe', 'Supabase Webhooks'],
        },
        {
          id: 'm5-act-2',
          title: 'Packaging & Pricing Experiments',
          description: 'Test two distinct pricing tiers (e.g. Starter vs. Pro with advanced analytics or seats).',
          category: 'monetization',
          priority: 'high',
          estimatedDays: 4,
          completed: false,
          deliverable: 'Pricing A/B test results and optimal price point',
          recommendedTools: ['Stripe Customer Portal'],
        },
      ],
      potentialPitfalls: ['Pricing too low out of fear of rejection', 'Complicated checkout friction losing buyers'],
      suggestedStack: ['Stripe', 'Supabase', 'PostHog'],
      estimatedBudgetUsd: '$100 - $300',
    },
    {
      month: 6,
      phaseTitle: 'Month 6: Scalable Growth Engine & Seed Readiness',
      theme: 'Double down on the top performing acquisition channel and prepare seed diligence data room.',
      priority: 'high',
      keyObjectives: [
        'Achieve consistent 15%+ Month-over-Month revenue growth trajectory',
        'Assemble comprehensive Investor Due Diligence Data Room with VentureLens reports',
        'Standardize customer success playbook for zero-touch or high-efficiency onboarding',
      ],
      primaryKpis: [
        { metric: 'MoM Revenue Growth', target: '> 18% MoM', rationale: 'Key venture metric demonstrating repeatable expansion' },
        { metric: 'Net Revenue Retention (NRR)', target: '> 100%', rationale: 'Proves expansion revenue from existing cohorts' },
      ],
      successGate: `${northStar.sixMonthTarget} achieved with repeatable channel unit economics.`,
      actionItems: [
        {
          id: 'm6-act-1',
          title: 'Growth Loop Optimization Sprint',
          description: 'Pour resources into the single acquisition channel delivering the lowest CAC and highest retention.',
          category: 'growth',
          priority: 'critical',
          estimatedDays: 8,
          completed: false,
          deliverable: 'Scalable acquisition playbook with positive ROI',
          recommendedTools: ['Google Ads / Meta / Outbound', 'PostHog'],
        },
        {
          id: 'm6-act-2',
          title: 'Seed Diligence Data Room & Pitch Deck',
          description: 'Assemble cohort retention charts, financial actuals vs. model, customer quotes, and product vision.',
          category: 'operations',
          priority: 'high',
          estimatedDays: 6,
          completed: false,
          deliverable: 'Complete Seed Diligence Data Room & 12-slide deck',
          recommendedTools: ['Notion', 'DocSend', 'VentureLens AI'],
        },
      ],
      potentialPitfalls: ['Spreading focus across 5 channels instead of mastering 1 channel', 'Premature scaling before unit economics stabilize'],
      suggestedStack: ['Notion', 'DocSend', 'Stripe Sigma'],
      estimatedBudgetUsd: '$300 - $1,500',
    },
  ];

  return {
    summary: `A disciplined 6-month growth roadmap for ${ctx.ideaTitle} designed to de-risk customer demand, validate retention, and scale to ${northStar.sixMonthTarget} through capital-efficient execution.`,
    northStarMetric: northStar,
    executivePlaybook: {
      strategicFocus: isEnterprise
        ? 'High-touch design partnerships converting into five-figure annual contracts.'
        : isVenture
        ? 'Rapid product iterations targeting top-quartile retention and viral cohort loops.'
        : 'Lean capital efficiency with self-serve billing to achieve cashflow positive unit economics.',
      primaryGrowthLoop: isEnterprise
        ? 'Targeted outbound ABM + executive referrals + technical whitepapers'
        : 'Product-led viral utility + organic founder community building + search SEO',
      criticalAssumptionsToTest: [
        `Target ${ctx.targetAudience} have high enough urgency to change their current workflow`,
        'Core product delivers measurable value within the first 4 minutes of usage',
        'Cost to acquire a paying customer is recoverable within 5 months of gross margin',
      ],
      capitalEfficiencyGuideline: isSolo
        ? 'Keep total monthly operational burn under $350 until first 10 paying customers subscribe.'
        : 'Reinvest initial revenue directly into high-performing customer acquisition channels.',
    },
    months,
    suggestedPivotsOrTriggers: [
      {
        condition: 'If after Month 2, fewer than 5 of 15 alpha users log in weekly',
        recommendedPivot: 'Halt all new feature development; conduct 15 live teardown sessions to pivot to a sharper wedge pain point.',
      },
      {
        condition: 'If customer acquisition cost exceeds 60% of first-year LTV in Month 4',
        recommendedPivot: 'Shift from paid/outbound acquisition to content-led programmatic SEO and community partner integrations.',
      },
      {
        condition: 'If users love the product but churn when paywalled in Month 5',
        recommendedPivot: 'Switch from self-serve gating to enterprise team pricing or usage-based micro-billing.',
      },
    ],
  };
}

/**
 * Saves growth roadmap record to Supabase or file fallback
 */
export async function saveGrowthRoadmapToSupabase(params: {
  ideaId: string;
  userId?: string;
  userToken?: string;
  pace: ExecutionPace;
  teamCapacity: TeamCapacity;
  roadmapData: GrowthRoadmapData;
  completedActionIds?: string[];
}): Promise<GrowthRoadmapRecord> {
  const now = new Date().toISOString();
  const id = `rdmp-${params.ideaId}-${Date.now()}`;

  const record: GrowthRoadmapRecord = {
    id,
    idea_id: params.ideaId,
    user_id: params.userId,
    pace: params.pace,
    team_capacity: params.teamCapacity,
    roadmap_data: params.roadmapData,
    completed_action_ids: params.completedActionIds || [],
    created_at: now,
    updated_at: now,
  };

  // 1. Try Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http') && params.userToken) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${params.userToken}` } },
      });

      const { data, error } = await supabase
        .from('growth_roadmaps')
        .upsert(
          {
            idea_id: params.ideaId,
            user_id: params.userId,
            pace: params.pace,
            team_capacity: params.teamCapacity,
            roadmap_data: params.roadmapData,
            completed_action_ids: params.completedActionIds || [],
            updated_at: now,
          },
          { onConflict: 'idea_id' }
        )
        .select()
        .single();

      if (!error && data) {
        memoryRoadmaps.set(params.ideaId, data as any);
        persistRoadmapsToFile();
        return data as any;
      }
    } catch (dbErr) {
      // Table might not exist yet; gracefully fallback to file storage
      console.warn('[Growth Roadmap] Supabase write skipped, using local cache:', dbErr);
    }
  }

  // 2. Persist to file/memory store
  memoryRoadmaps.set(params.ideaId, record);
  persistRoadmapsToFile();
  return record;
}

/**
 * Retrieves growth roadmap by idea ID
 */
export async function getGrowthRoadmapFromSupabase(params: {
  ideaId: string;
  userToken?: string;
}): Promise<GrowthRoadmapRecord | null> {
  // 1. Try Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http') && params.userToken) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${params.userToken}` } },
      });

      const { data, error } = await supabase
        .from('growth_roadmaps')
        .select('*')
        .eq('idea_id', params.ideaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        memoryRoadmaps.set(params.ideaId, data as any);
        return data as any;
      }
    } catch (err) {
      // Fallback
    }
  }

  // 2. Try Memory/File Cache
  return memoryRoadmaps.get(params.ideaId) || null;
}

/**
 * Updates completed action items checklist
 */
export async function updateCompletedActionIds(
  ideaId: string,
  completedActionIds: string[]
): Promise<GrowthRoadmapRecord | null> {
  const existing = memoryRoadmaps.get(ideaId);
  if (!existing) return null;

  existing.completed_action_ids = completedActionIds;
  existing.updated_at = new Date().toISOString();

  memoryRoadmaps.set(ideaId, existing);
  persistRoadmapsToFile();
  return existing;
}
