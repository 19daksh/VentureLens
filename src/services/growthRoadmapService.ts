import {
  GrowthRoadmapData,
  GrowthRoadmapRecord,
  ExecutionPace,
  TeamCapacity,
} from '../types/growthRoadmap';

const LOCAL_STORAGE_KEY = 'venturelens_growth_roadmaps';

function getLocalStore(): Record<string, GrowthRoadmapRecord> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToLocalStore(record: GrowthRoadmapRecord) {
  try {
    const store = getLocalStore();
    store[record.idea_id] = record;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('[Growth Roadmap Client] Failed to cache locally:', err);
  }
}

export async function fetchGrowthRoadmap(
  ideaId: string,
  userToken?: string
): Promise<GrowthRoadmapRecord | null> {
  // 1. Try local cache first for instant UX
  const localStore = getLocalStore();
  const cached = localStore[ideaId] || null;

  try {
    const headers: Record<string, string> = {};
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }

    const res = await fetch(`/api/growth-roadmap/${ideaId}`, { headers });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        saveToLocalStore(json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Growth Roadmap Client] Network fetch error, using cache:', err);
  }

  return cached;
}

export async function generateGrowthRoadmap(params: {
  ideaId: string;
  pace: ExecutionPace;
  teamCapacity: TeamCapacity;
  analysisContext: any;
  userToken?: string;
}): Promise<GrowthRoadmapRecord> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (params.userToken) {
    headers['Authorization'] = `Bearer ${params.userToken}`;
  }

  const res = await fetch('/api/growth-roadmap/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ideaId: params.ideaId,
      pace: params.pace,
      teamCapacity: params.teamCapacity,
      analysisContext: params.analysisContext,
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || 'Failed to generate growth roadmap.');
  }

  const json = await res.json();
  const record: GrowthRoadmapRecord = json.data;
  saveToLocalStore(record);
  return record;
}

export async function toggleActionProgress(params: {
  ideaId: string;
  completedActionIds: string[];
  userToken?: string;
}): Promise<GrowthRoadmapRecord | null> {
  // Update local cache immediately
  const localStore = getLocalStore();
  const existing = localStore[params.ideaId];
  if (existing) {
    existing.completed_action_ids = params.completedActionIds;
    existing.updated_at = new Date().toISOString();
    saveToLocalStore(existing);
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (params.userToken) {
      headers['Authorization'] = `Bearer ${params.userToken}`;
    }

    const res = await fetch(`/api/growth-roadmap/${params.ideaId}/progress`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ completedActionIds: params.completedActionIds }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        saveToLocalStore(json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Growth Roadmap Client] Progress sync warning:', err);
  }

  return existing || null;
}

/**
 * Generates an executive Markdown overview of the roadmap
 */
export function formatRoadmapAsMarkdown(ideaTitle: string, data: GrowthRoadmapData): string {
  let md = `# 🚀 6-Month Growth Roadmap: ${ideaTitle}\n\n`;
  md += `**Strategic North Star:** ${data.northStarMetric.name} (${data.northStarMetric.sixMonthTarget})\n`;
  md += `*${data.northStarMetric.definition}*\n\n`;
  md += `## Executive Strategy\n${data.summary}\n\n`;
  md += `**Primary Growth Loop:** ${data.executivePlaybook.primaryGrowthLoop}\n`;
  md += `**Capital Guideline:** ${data.executivePlaybook.capitalEfficiencyGuideline}\n\n`;
  md += `### Critical Assumptions to De-Risk\n`;
  data.executivePlaybook.criticalAssumptionsToTest.forEach((assump, idx) => {
    md += `${idx + 1}. ${assump}\n`;
  });
  md += `\n---\n\n`;

  data.months.forEach((m) => {
    md += `## Month ${m.month}: ${m.phaseTitle}\n`;
    md += `**Focus Theme:** ${m.theme}\n`;
    md += `**Success Gate:** ${m.successGate}\n\n`;
    md += `**Key Objectives:**\n`;
    m.keyObjectives.forEach((obj) => (md += `- ${obj}\n`));
    md += `\n**Target KPIs:**\n`;
    m.primaryKpis.forEach((kpi) => (md += `- **${kpi.metric}:** ${kpi.target} (${kpi.rationale})\n`));
    md += `\n**Action Items:**\n`;
    m.actionItems.forEach((act) => {
      md += `- [ ] **${act.title}** (${act.category.toUpperCase()} • ~${act.estimatedDays}d): ${act.description} → Deliverable: *${act.deliverable}*\n`;
    });
    md += `\n**Suggested Stack:** ${m.suggestedStack.join(', ')}\n\n`;
  });

  if (data.suggestedPivotsOrTriggers && data.suggestedPivotsOrTriggers.length > 0) {
    md += `## ⚠️ Early Warning Pivot Triggers\n`;
    data.suggestedPivotsOrTriggers.forEach((p) => {
      md += `- **Trigger:** ${p.condition}\n  **Pivot:** ${p.recommendedPivot}\n`;
    });
  }

  md += `\nGenerated by VentureLens AI • Automated Growth Diligence Engine\n`;
  return md;
}

/**
 * Exports roadmap tasks into CSV format for Notion/Linear/Sheets
 */
export function exportRoadmapToCsv(ideaTitle: string, data: GrowthRoadmapData): void {
  const headers = ['Month', 'Phase Title', 'Task ID', 'Action Title', 'Category', 'Priority', 'Est Days', 'Status', 'Deliverable', 'Tools'];
  const rows: string[][] = [headers];

  data.months.forEach((m) => {
    m.actionItems.forEach((item) => {
      rows.push([
        `Month ${m.month}`,
        `"${m.phaseTitle.replace(/"/g, '""')}"`,
        item.id,
        `"${item.title.replace(/"/g, '""')}"`,
        item.category,
        item.priority,
        String(item.estimatedDays),
        item.completed ? 'Completed' : 'To Do',
        `"${item.deliverable.replace(/"/g, '""')}"`,
        `"${(item.recommendedTools || []).join(', ')}"`,
      ]);
    });
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const safeName = ideaTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.setAttribute('download', `${safeName}-growth-roadmap.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
