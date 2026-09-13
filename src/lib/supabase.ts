import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StartupIdea, FullAnalysis } from '../types/analysis';
import { UserProfile } from '../types/auth';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '' &&
  supabaseUrl.startsWith('http')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Local storage key prefixes for fallback / offline-first mode
const STORAGE_KEYS = {
  USER: 'venturelens_auth_user',
  SESSION: 'venturelens_auth_session',
  IDEAS: 'venturelens_startup_ideas',
  ANALYSES: 'venturelens_analyses',
  PROFILES: 'venturelens_profiles',
};

// Seed sample startup idea if clean install so the user can immediately test Compare, History, and Reports!
export function seedInitialDataIfEmpty(userId: string) {
  try {
    const existingIdeas = localStorage.getItem(STORAGE_KEYS.IDEAS);
    if (!existingIdeas || JSON.parse(existingIdeas).length === 0) {
      const sampleIdeaId = 'idea-sample-1';
      const sampleAnalysisId = 'analysis-sample-1';
      const now = new Date().toISOString();

      const sampleIdea: StartupIdea = {
        id: sampleIdeaId,
        user_id: userId,
        title: 'FleetPulse - Predictive Fleet Battery Management',
        description: 'An AI-powered IoT and telemetry platform for electric delivery fleet managers to predict battery degradation, optimize depot charging schedules, and prevent roadside downtime.',
        industry: 'CleanTech & Logistics',
        target_audience: 'Mid-to-large commercial electric van and truck fleet operators with 50+ vehicles.',
        additional_info: 'Currently pilots operating with 2 municipal fleet owners. Proprietary telemetry connectors developed.',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      };

      const sampleAnalysis: FullAnalysis = {
        id: sampleAnalysisId,
        idea_id: sampleIdeaId,
        user_id: userId,
        overall_score: 87,
        verdict: 'High-conviction B2B venture with compelling commercial ROI and tailwinds from commercial EV mandates.',
        verdict_type: 'Build',
        confidence_indicator: 'High Confidence (89% market data fit)',
        executive_summary: 'FleetPulse addresses an urgent operational bottleneck in the commercial EV transition: unpredicted battery degradation and chaotic depot charging spikes. The unit economics are robust ($120/vehicle/mo SaaS) with immediate fleet downtime savings.',
        problem_score: 91,
        market_score: 88,
        competition_score: 79,
        revenue_score: 92,
        technical_score: 83,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        problem_validation: {
          problem_strength_score: 91,
          problem_severity: 'Critical',
          frequency: 'Daily',
          existing_alternatives: ['Generic telematics (Geotab, Samsara)', 'Manual spreadsheet logging', 'OEM dashboard silos (Ford Pro, Rivian FleetOS)'],
          customer_pain_points: [
            'Unplanned battery thermal events or state-of-health drops causing missed delivery windows',
            'Surge electricity tariffs due to uncoordinated 4 PM depot plug-in spikes',
            'Lack of cross-OEM battery health visibility across mixed fleets'
          ],
          validation_insights: 'Commercial fleet managers report fleet downtime costs upwards of $1,200 per vehicle per day. Battery warranty claims frequently fail due to insufficient diagnostic logs.'
        },
        market_analysis: {
          market_opportunity_score: 88,
          tam: '$18.4 Billion (Global Commercial Fleet Telematics & Energy Management)',
          sam: '$3.8 Billion (Electric Commercial Delivery Van Fleet Software in NA & Europe)',
          som: '$210 Million (Fast-charging delivery fleets in Tier-1 logistics corridors)',
          demand_score: 89,
          growth_potential: 'High Growth (34% CAGR through 2032)',
          market_trends: [
            'Corporate Net-Zero mandates accelerating Class 3-6 EV delivery adoption',
            'Dynamic grid pricing punishing unmanaged megawatt depot charging',
            'Second-life battery residual value tracking required by fleet leasing companies'
          ],
          key_insights: 'The shift from diesel to electric fleet management shifts the primary variable cost from fuel pump pricing to battery health and grid demand charges.'
        },
        competitor_analysis: {
          competition_score: 79,
          competitive_landscape_summary: 'Incumbent telematics giants focus on GPS routing and driver safety; specialized battery diagnostics are emerging from European startups but lack cross-OEM plug-and-play APIs.',
          differentiation_strategy: 'FleetPulse sits as an agnostic layer on top of existing Geotab/Samsara hardware, focusing purely on predictive electrochemical degradation and dynamic depot charge scheduling.',
          competitors: [
            {
              name: 'Geotab / Samsara',
              description: 'General IoT telematics and ELD compliance market leaders',
              strengths: ['Massive distribution', 'Hardware installed in millions of cabs', 'Trusted enterprise brands'],
              weaknesses: ['Shallow battery telemetry', 'No smart charging load optimization', 'Slow to build EV-specific algorithms'],
              target_customer: 'Enterprise fleet dispatchers',
              differentiation_opportunity: 'Integrate into their app marketplaces rather than replacing hardware'
            },
            {
              name: 'Volytica Diagnostics',
              description: 'European battery health analytics platform',
              strengths: ['Strong lab-grade algorithms', 'Academic backing'],
              weaknesses: ['Primarily bus/stationary storage focused', 'Weak US presence and minimal depot charging software integration'],
              target_customer: 'Bus operators and storage developers',
              differentiation_opportunity: 'Focus on North American last-mile delivery fleet depots'
            }
          ]
        },
        business_model: {
          recommended_business_model: 'Per-vehicle Tiered SaaS + Depot Load Optimization Utility Share',
          customer_segment: 'Commercial parcel, food delivery, and service fleets with 25-500 EV vans',
          pricing_strategy: '$89 - $139 per vehicle / month billed annually, with hardware OBD-II dongles provided at cost',
          revenue_streams: [
            'Monthly recurring telematics SaaS subscription',
            'Utility demand-response peak shaving revenue split (15-20%)',
            'Battery residual certification reports for lease-end vehicle remarketing'
          ],
          monetization_strategy: 'Land with a 10-vehicle free proof-of-concept demonstrating electricity cost reduction within 30 days, then expand fleet-wide.',
          unit_economics_considerations: 'Target CAC of $4,200 with average fleet contract value of $36,000/year (30 vehicles @ $100/mo). Projected LTV:CAC ratio of 6.2:1 with <0.5% monthly logo churn.',
          revenue_potential_score: 92
        },
        technical_feasibility: {
          technical_feasibility_score: 83,
          recommended_technology_direction: 'Python/FastAPI microservices for physics-informed machine learning battery models; TimescaleDB/PostgreSQL for timeseries streaming; React dashboard.',
          major_technical_requirements: [
            'J1939 and CAN-bus telemetry ingestion via standard OBD-II cellular dongles',
            'Physics-informed neural network (PINN) for cell state-of-health estimation',
            'OpenADR 2.0b integration for automated demand response with local utilities'
          ],
          complexity: 'Medium-High',
          scalability_considerations: 'High data ingestion volume (1Hz telemetry per vehicle). Requires timeseries partitioning and edge pre-filtering.',
          technical_risks: [
            'Proprietary OEM CAN-bus message encryption (e.g. newer Tesla/Rivian protocols)',
            'Cellular coverage dead spots in suburban delivery routes requiring offline buffering'
          ]
        },
        risks: [
          {
            category: 'Market',
            description: 'Slower than projected enterprise commercial EV delivery vehicle delivery pipelines by major automotive OEMs.',
            severity: 'Medium',
            probability: 'Medium',
            impact: 'High',
            mitigation: 'Target existing early adopters (Amazon DSPs, FedEx contractors, DHL) and hybrid electric fleet operators.'
          },
          {
            category: 'Technical',
            description: 'OEMs locking down CAN-bus diagnostic ports with cybersecurity gateways (ISO 21434).',
            severity: 'High',
            probability: 'Medium',
            impact: 'High',
            mitigation: 'Partner directly with OEM cloud developer APIs (Ford Pro API, GM Envolve) alongside physical OBD-II dongles.'
          },
          {
            category: 'Competitive',
            description: 'Samsara or Geotab launching native battery health dashboards.',
            severity: 'Medium',
            probability: 'High',
            impact: 'Medium',
            mitigation: 'Build patent-defensible battery electrochemical life models and utility grid integration that generalist telematics cannot match.'
          }
        ],
        mvp_roadmap: {
          phases: [
            {
              phase: 'Phase 1: Telemetry Core & Battery Health Score',
              duration: '6 Weeks',
              features: ['OBD-II CAN-bus ingestion pipe', 'Unified battery state-of-health (SoH) index', 'Over-temperature & cell imbalance alerts'],
              goal: 'Prove diagnostic accuracy on pilot fleet of 20 delivery vans against physical multimeter benchmarks.',
              priority: 'Critical'
            },
            {
              phase: 'Phase 2: Depot Charge Scheduler',
              duration: '8 Weeks',
              features: ['Automated charging queue scheduler based on next-day route mileage', 'Peak-hour grid tariff avoidance algorithm'],
              goal: 'Demonstrate measured 22% reduction in electricity utility bills for depot pilot.',
              priority: 'High'
            },
            {
              phase: 'Phase 3: OEM Cloud Integration & Fleet Expansion',
              duration: '10 Weeks',
              features: ['Ford Pro and GM Cloud API connectors (hardware-less onboarding)', 'Multi-depot enterprise permissions and reporting'],
              goal: 'Enable 1-click cloud sync for fleets without plugging physical dongles.',
              priority: 'High'
            }
          ],
          must_have_features: [
            'Real-time Battery State-of-Health (SoH) percentage and degradation curve',
            'Depot charging scheduler with local utility peak tariff avoidance',
            'Urgent anomaly alerts (cell thermal runaway warning, sudden voltage drop)',
            'Fleet vehicle list with filter by battery health status'
          ],
          nice_to_have_features: [
            'Weather-adjusted range prediction (cabin heating load impact)',
            'Driver driving style score (regenerative braking efficiency rating)'
          ],
          future_features: [
            'V2G (Vehicle-to-Grid) energy arbitrage monetization engine',
            'Automated warranty breach notification generator for OEM claims'
          ]
        },
        recommendations: [
          {
            action: 'Secure signed LOIs with 2 regional Amazon Delivery Service Partners (DSPs) before writing production code.',
            priority: 'Immediate',
            category: 'Validation',
            reason: 'DSPs operate on razor-thin margins and have fixed electric van route lengths, making them ideal early adopters.'
          },
          {
            action: 'Prioritize software-only onboarding via Ford Pro and Geotab Marketplace integration.',
            priority: 'High',
            category: 'Go-To-Market',
            reason: 'Eliminating the requirement for physical hardware dongles reduces customer onboarding friction from weeks to minutes.'
          },
          {
            action: 'File provisional patent on the combined battery degradation & dynamic depot charging optimization algorithm.',
            priority: 'High',
            category: 'Product',
            reason: 'Defends the venture against commoditization by legacy GPS fleet tracking providers.'
          }
        ],
        go_to_market: {
          initial_target_customer: 'Amazon DSP and FedEx Ground contractors running 20 to 80 electric delivery vans in California and New York.',
          acquisition_channels: [
            'Geotab & Samsara App Marketplace listings',
            'Direct outbound to Fleet Operations VPs on LinkedIn',
            'Presenting case studies at NAFA Fleet Management Institute and Advanced Clean Transportation (ACT) Expo'
          ],
          launch_strategy: 'Free 30-day "Battery Audit": plug into 5 vehicles, deliver an instant health and electricity savings report, then upsell the annual software agreement.',
          positioning: 'The intelligent battery and charging brain for modern electric delivery fleets.',
          early_validation_strategy: 'Offer zero-risk guarantee: if FleetPulse does not identify at least 2x its annual fee in electricity savings or downtime prevention, the fleet pays nothing.'
        },
        final_verdict: {
          overall_score: 87,
          verdict: 'Clear "Build" signal. High commercial urgency, well-defined B2B buyer with purchasing budget, and significant technical moat against generalist competitors.',
          verdict_type: 'Build',
          confidence_indicator: 'High Confidence',
          strongest_aspects: [
            'Extreme ROI visibility ($1,200/day downtime cost vs $120/mo software fee)',
            'Strong regulatory tailwinds forcing commercial fleet electrification',
            'High switching costs once integrated with depot charging infrastructure'
          ],
          weakest_aspects: [
            'Sales cycles for enterprise municipal fleets can take 6-9 months',
            'Dependence on OEM data access openness'
          ],
          biggest_risk: 'Hardware-level diagnostic port access restrictions imposed by legacy automotive OEMs.',
          recommended_next_step: 'Deploy prototype telemetry logger with the 2 municipal fleet partners and measure baseline battery variance across identical route cycles.'
        }
      };

      sampleIdea.analysis = sampleAnalysis;
      localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify([sampleIdea]));
      localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify([sampleAnalysis]));
    }
  } catch (e) {
    console.error('Error seeding initial data:', e);
  }
}

// Local Database Helpers for fallback / offline-first mode
export const localDb = {
  getIdeas(userId: string): StartupIdea[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.IDEAS);
      if (!data) return [];
      const parsed: StartupIdea[] = JSON.parse(data);
      return parsed.filter(item => item.user_id === userId);
    } catch {
      return [];
    }
  },

  getIdeaById(id: string, userId: string): StartupIdea | null {
    const list = this.getIdeas(userId);
    return list.find(item => item.id === id) || null;
  },

  saveIdea(idea: StartupIdea): void {
    const all = this.getAllIdeas();
    const index = all.findIndex(i => i.id === idea.id);
    if (index >= 0) {
      all[index] = idea;
    } else {
      all.unshift(idea);
    }
    localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(all));
  },

  getAllIdeas(): StartupIdea[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.IDEAS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  deleteIdea(id: string, userId: string): boolean {
    const all = this.getAllIdeas();
    const filtered = all.filter(i => !(i.id === id && i.user_id === userId));
    localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(filtered));

    // Also remove associated analysis
    const allAnalyses = this.getAllAnalyses();
    const filteredAnalyses = allAnalyses.filter(a => !(a.idea_id === id && a.user_id === userId));
    localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(filteredAnalyses));
    return true;
  },

  saveAnalysis(analysis: FullAnalysis): void {
    const all = this.getAllAnalyses();
    const index = all.findIndex(a => a.id === analysis.id);
    if (index >= 0) {
      all[index] = analysis;
    } else {
      all.unshift(analysis);
    }
    localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(all));

    // Also update attached idea
    const ideas = this.getAllIdeas();
    const idea = ideas.find(i => i.id === analysis.idea_id);
    if (idea) {
      idea.status = 'completed';
      idea.analysis = analysis;
      idea.updated_at = new Date().toISOString();
      this.saveIdea(idea);
    }
  },

  getAnalysisByIdeaId(ideaId: string, userId: string): FullAnalysis | null {
    const all = this.getAllAnalyses();
    return all.find(a => a.idea_id === ideaId && a.user_id === userId) || null;
  },

  getAllAnalyses(): FullAnalysis[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANALYSES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getProfile(userId: string): UserProfile | null {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.PROFILES}_${userId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveProfile(profile: UserProfile): void {
    localStorage.setItem(`${STORAGE_KEYS.PROFILES}_${profile.id}`, JSON.stringify(profile));
  },

  wipeUserData(userId: string): void {
    const allIdeas = this.getAllIdeas().filter(i => i.user_id !== userId);
    localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(allIdeas));

    const allAnalyses = this.getAllAnalyses().filter(a => a.user_id !== userId);
    localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(allAnalyses));

    localStorage.removeItem(`${STORAGE_KEYS.PROFILES}_${userId}`);
  }
};
