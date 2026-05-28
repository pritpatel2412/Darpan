const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error on ${endpoint} (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

export interface Tender {
  id: string;
  tender_id: string;
  source_portal: string;
  title: string;
  department: string;
  ministry: string | null;
  state: string | null;
  category: string | null;
  estimated_value: number | null;
  awarded_value: number | null;
  currency: string;
  published_at: string | null;
  bid_open_at: string | null;
  bid_close_at: string | null;
  awarded_at: string | null;
  bid_window_hours: number | null;
  bid_count: number;
  raw_spec_text: string | null;
  spec_doc_hash: string | null;
  project_location: string | null;
  project_lat: number | null;
  project_lng: number | null;
  source_url: string | null;
  raw_json: any | null;
  parse_quality: number;
  is_pre_award: boolean;
  ingested_at: string;
  updated_at: string;
  fraud_score?: {
    confidence: number;
    tier: string;
    groq_narrative: string;
    groq_likelihood: string;
    groq_strongest: string;
    price_ratio: number | null;
  };
}

export interface Contractor {
  id: string;
  cin: string | null;
  name: string;
  name_normalized: string | null;
  pan: string | null;
  registration_date: string | null;
  registration_source: string;
  registered_state: string | null;
  registered_address: string | null;
  directors: Array<{ name: string; din?: string; since?: string }> | null;
  total_won: number;
  total_value_won: number;
  watchlist: boolean;
  watchlist_reason: string | null;
  ed_case_found: boolean;
  ed_case_details: string | null;
  first_seen_at: string;
  verified_at: string | null;
}

export interface Official {
  id: string;
  name: string;
  designation: string;
  department: string;
  pan_partial: string | null;
  din_list: string[] | null;
  relations_count: number;
  risk_multiplier: number;
  fingerprint_matches: any | null;
  first_seen_at: string;
  updated_at: string;
}

export interface RTIApplication {
  id: string;
  tender_id: string | null;
  fraud_score_id: string | null;
  pio_name: string | null;
  pio_designation: string | null;
  pio_department: string | null;
  pio_address: string | null;
  pio_email: string | null;
  ministry_code: string | null;
  dept_code: string | null;
  application_text: string;
  questions_count: number | null;
  legal_provisions: string[] | null;
  annexure_pdf_path: string | null;
  filed_via: string;
  filed_at: string | null;
  confirmation_number: string | null;
  status: string;
  response_due_at: string | null;
  first_appeal_due_at: string | null;
  response_received_at: string | null;
  response_text: string | null;
  first_appeal_filed_at: string | null;
  first_appeal_confirmation: string | null;
  cic_filed_at: string | null;
  cic_confirmation: string | null;
  outcome: string | null;
  created_at: string;
}

export interface GlobalSearchItem {
  id: string;
  type: "tender" | "contractor";
  title: string;
  subtitle: string;
  href: string;
  fraudTier?: string;
}

export interface MarchRushWatchItem {
  department: string;
  state: string;
  total_annual_value_inr: number;
  annual_tender_count: number;
  q4_value_inr: number;
  q4_tender_count: number;
  q4_concentration_pct: number;
  is_flagged: boolean;
  risk_tier: string;
}

export interface MarchRushData {
  countdown_days_to_q4: number;
  watchlist: MarchRushWatchItem[];
}

export const api = {
  // Tenders
  listTenders: (params?: { state?: string; portal?: string; category?: string; page?: number; limit?: number }) => {
    const qStr = new URLSearchParams(params as any).toString();
    return fetchJson<{ tenders: Tender[]; total: number; page: number; pages: number }>(`/tenders?${qStr}`);
  },

  listFlaggedTenders: (params?: { state?: string; min_score?: number; tier?: string; page?: number; limit?: number }) => {
    const mappedParams: any = { ...params };
    if (params?.min_score) mappedParams.min_score = params.min_score.toString();
    const qStr = new URLSearchParams(mappedParams).toString();
    return fetchJson<{ tenders: Tender[]; total: number; page: number; pages: number }>(`/tenders/flagged?${qStr}`);
  },

  getTenderDetail: (uuid: string) => {
    return fetchJson<{ tender: Tender; fraud_score: any; bids: any[]; rtis: any[] }>(`/tenders/${uuid}`);
  },

  getTenderEvidence: (uuid: string) => {
    return fetchJson<any>(`/tenders/${uuid}/evidence`);
  },

  getTenderScoreBreakdown: (uuid: string) => {
    return fetchJson<any>(`/tenders/${uuid}/score`);
  },

  searchTenders: (q: string, state?: string) => {
    const params: any = { q };
    if (state) params.state = state;
    const qStr = new URLSearchParams(params).toString();
    return fetchJson<Tender[]>(`/tenders/search?${qStr}`);
  },

  // Global Search helper matching searchHUD
  globalSearch: async (q: string): Promise<{ results: GlobalSearchItem[] }> => {
    if (!q || q.length < 2) return { results: [] };
    
    // Fuzzy search tenders and contractors simultaneously
    try {
      const [tendersRes, contractorsRes] = await Promise.all([
        fetchJson<Tender[]>(`/tenders/search?q=${encodeURIComponent(q)}`),
        fetchJson<Contractor[]>(`/contractors?limit=10`) // Simple fallback since we don't have specialized fuzzy contractor endpoint
      ]);

      const filteredContractors = contractorsRes.filter(c => 
        c.name.toLowerCase().includes(q.toLowerCase()) || 
        c.cin?.toLowerCase().includes(q.toLowerCase())
      );

      const results: GlobalSearchItem[] = [];

      tendersRes.forEach(t => {
        results.push({
          id: t.id,
          type: "tender",
          title: t.title,
          subtitle: `${t.department} | ${t.tender_id}`,
          href: `/tender/${t.id}`
        });
      });

      filteredContractors.forEach(c => {
        results.push({
          id: c.id,
          type: "contractor",
          title: c.name,
          subtitle: `CIN: ${c.cin || 'N/A'} | Registered ${c.registered_state || 'N/A'}`,
          href: `/contractors`
        });
      });

      return { results };
    } catch (e) {
      console.error("Global search failed:", e);
      return { results: [] };
    }
  },

  // Contractors
  listContractors: (limit = 20) => {
    return fetchJson<Contractor[]>(`/contractors?limit=${limit}`);
  },

  getContractorHistory: (cin: string) => {
    return fetchJson<any>(`/contractors/profile/${cin}`);
  },

  // Officials
  listOfficials: (limit = 20) => {
    return fetchJson<Official[]>(`/officials?limit=${limit}`);
  },

  // March Rush
  getMarchRush: () => {
    return fetchJson<MarchRushData>("/dashboard/march-rush");
  },

  // Network Collusion Graph
  getNetworkGraph: () => {
    return fetchJson<{ nodes: any[]; links: any[] }>("/network/graph");
  },

  // RTI tracking
  listRtis: () => {
    return fetchJson<RTIApplication[]>("/rti");
  },

  getRtiStats: () => {
    return fetchJson<any>("/rti/stats");
  },

  // Instant Scans
  runInstantScan: (tenderId: string, portal = "gem") => {
    return fetchJson<any>("/scanner/instant", {
      method: "POST",
      body: JSON.stringify({ tender_id: tenderId, portal })
    });
  },

  // Tips and Whistleblower
  submitTip: (payload: { tip_text: string; tip_audio_path?: string; tip_doc_path?: string; language?: string }) => {
    return fetchJson<any>("/scanner/tip", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Dashboard Stats & Lists
  getDashboardStats: () => {
    return fetchJson<any>("/fraud/stats");
  },

  getStateHeatmap: () => {
    return fetchJson<any[]>("/fraud/heatmap");
  },

  getDepartmentLeaderboard: () => {
    return fetchJson<any[]>("/fraud/departments");
  },

  getRecentActivity: () => {
    return fetchJson<any>("/fraud/feed");
  }
};
