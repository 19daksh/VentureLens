import { SwotAnalysisData, SwotRequestPayload } from '../types/swot';

const SWOT_CACHE_PREFIX = 'venturelens_swot_';

export async function generateSwotAnalysis(payload: SwotRequestPayload): Promise<SwotAnalysisData> {
  const token = localStorage.getItem('supabase_auth_token') || 'demo-token';

  const response = await fetch('/api/swot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errMessage = 'Failed to generate SWOT analysis.';
    try {
      const errData = await response.json();
      if (errData && errData.error) {
        errMessage = errData.error;
      }
    } catch {}
    throw new Error(errMessage);
  }

  const json = await response.json();
  const data: SwotAnalysisData = json.data;

  // Cache in localStorage as well
  if (data.id) {
    try {
      localStorage.setItem(`${SWOT_CACHE_PREFIX}${data.id}`, JSON.stringify(data));
      if (data.idea_id) {
        localStorage.setItem(`${SWOT_CACHE_PREFIX}idea_${data.idea_id}`, JSON.stringify(data));
      }
    } catch {}
  }

  return data;
}

export async function fetchSwotAnalysis(key: string): Promise<SwotAnalysisData | null> {
  // First check localStorage
  try {
    const cached = localStorage.getItem(`${SWOT_CACHE_PREFIX}idea_${key}`) || localStorage.getItem(`${SWOT_CACHE_PREFIX}${key}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.strengths) {
        // Return quickly, but still attempt server refresh in background if wanted
        return parsed;
      }
    }
  } catch {}

  const token = localStorage.getItem('supabase_auth_token') || 'demo-token';

  try {
    const response = await fetch(`/api/swot/${encodeURIComponent(key)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    if (json.success && json.data) {
      try {
        localStorage.setItem(`${SWOT_CACHE_PREFIX}${json.data.id}`, JSON.stringify(json.data));
        if (json.data.idea_id) {
          localStorage.setItem(`${SWOT_CACHE_PREFIX}idea_${json.data.idea_id}`, JSON.stringify(json.data));
        }
      } catch {}
      return json.data;
    }
    return null;
  } catch (err) {
    console.warn('[SWOT Client] Fetch error:', err);
    return null;
  }
}

export async function updateSwotAnalysis(swot: SwotAnalysisData): Promise<SwotAnalysisData> {
  const token = localStorage.getItem('supabase_auth_token') || 'demo-token';

  // Cache locally
  if (swot.id) {
    try {
      localStorage.setItem(`${SWOT_CACHE_PREFIX}${swot.id}`, JSON.stringify(swot));
      if (swot.idea_id) {
        localStorage.setItem(`${SWOT_CACHE_PREFIX}idea_${swot.idea_id}`, JSON.stringify(swot));
      }
    } catch {}
  }

  try {
    const response = await fetch(`/api/swot/${encodeURIComponent(swot.id || swot.idea_id || 'local')}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(swot),
    });

    if (response.ok) {
      const json = await response.json();
      return json.data || swot;
    }
  } catch (e) {
    console.warn('[SWOT Client] Update error:', e);
  }

  return swot;
}
