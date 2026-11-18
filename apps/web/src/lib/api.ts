/**
 * CivicSphere AI & ClimAct Twin — Unified API Client
 * Centralized fetch utilities with automatic JWT Bearer token attachment
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers = {}, ...rest } = options;
  const authHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (token) {
    authHeaders["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: authHeaders,
    ...rest,
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {
      // Ignore JSON parse errors on failure
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // System Health
  async getHealth() {
    return apiFetch<{ status: string; version: string; country: string; vertical: string }>("/health");
  },

  // Regions & Spatial Matrix
  async getRegions(params: {
    level?: "adm2" | "h3";
    sensor_scarce_only?: boolean;
    sort_by?: string;
    ascending?: boolean;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.level) query.set("level", params.level);
    if (params.sensor_scarce_only) query.set("sensor_scarce_only", "true");
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.ascending !== undefined) query.set("ascending", String(params.ascending));
    if (params.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    return apiFetch<{
      level?: string;
      total_count?: number;
      total_matches?: number;
      records?: any[];
      results?: any[];
      provenance?: any;
    }>(`/api/v1/regions${qs ? `?${qs}` : ""}`);
  },

  async getRegionDossier(pcode: string) {
    return apiFetch<any>(`/api/v1/regions/${pcode}`);
  },

  async getExplainability(pcode: string, lang: "en" | "bn" = "en") {
    return apiFetch<any>(`/api/v1/regions/${pcode}/explain?lang=${lang}`);
  },

  // Data Hub & Quality Gate
  async getDatasets() {
    return apiFetch<{ total_datasets: number; datasets: any[] }>("/api/v1/data-hub/datasets");
  },

  async getQualityReport() {
    return apiFetch<any>("/api/v1/data-hub/quality-report");
  },

  // ClimAct Twin Policy Simulation
  async runSimulation(payload: {
    budget_usd: number;
    alpha_equity: number;
    w_risk?: number;
    sector_weights?: Record<string, number>;
    intervention_type?: string;
    scope?: "national" | "dhaka";
  }, token?: string) {
    return apiFetch<any>("/api/v1/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  async getScenarios(limit = 20, token?: string) {
    return apiFetch<{ total_returned: number; scenarios: any[] }>(`/api/v1/simulate/scenarios?limit=${limit}`, {
      token,
    });
  },

  async getInterventions() {
    return apiFetch<Record<string, any>>("/api/v1/simulate/interventions");
  },

  // Grounded AI Policy Copilot
  async queryCopilot(payload: {
    query: string;
    target_pcode?: string;
    lang?: "en" | "bn";
  }, token?: string) {
    return apiFetch<any>("/api/v1/copilot/query", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  // Policy Brief Generator
  async generateBrief(payload: {
    scenario_id?: string;
    lang?: "en" | "bn";
    custom_notes?: string;
    save_as_outcomes?: boolean;
  }, token?: string) {
    return apiFetch<any>("/api/v1/briefs/generate", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  getMarkdownMemoUrl(scenarioId: string, lang: "en" | "bn" = "en"): string {
    return `${API_BASE}/api/v1/briefs/${scenarioId}/markdown?lang=${lang}`;
  },

  // Closed-Loop Outcomes Tracker
  async getOutcomes(params: {
    status?: string;
    target_pcode?: string;
    responsible_agency?: string;
    scenario_id?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.target_pcode) query.set("target_pcode", params.target_pcode);
    if (params.responsible_agency) query.set("responsible_agency", params.responsible_agency);
    if (params.scenario_id) query.set("scenario_id", params.scenario_id);

    const qs = query.toString();
    return apiFetch<{
      total_count: number;
      summary: {
        total_outcomes: number;
        planned: number;
        active: number;
        under_review: number;
        completed: number;
      };
      outcomes: any[];
    }>(`/api/v1/outcomes${qs ? `?${qs}` : ""}`);
  },

  async createOutcome(payload: {
    title: string;
    target_pcode: string;
    responsible_agency: string;
    indicator_code: string;
    baseline_value: number;
    target_value: number;
    review_date: string;
    scenario_id?: string;
    evidence_url?: string;
  }, token?: string) {
    return apiFetch<any>("/api/v1/outcomes", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  async updateOutcome(outcomeId: string, payload: {
    observed_value?: number;
    status?: string;
    evidence_url?: string;
  }, token?: string) {
    return apiFetch<any>(`/api/v1/outcomes/${outcomeId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      token,
    });
  },

  // Governance & Audit Trail
  async getAuditLogs(token?: string, roleFilter?: string, actionFilter?: string) {
    const query = new URLSearchParams();
    if (roleFilter) query.set("role", roleFilter);
    if (actionFilter) query.set("action", actionFilter);
    const qs = query.toString();
    return apiFetch<any>(`/api/v1/governance/audit-logs${qs ? `?${qs}` : ""}`, { token });
  },

  async getGovernanceStatus(token?: string) {
    return apiFetch<any>("/api/v1/governance/system-status", { token });
  },

  async getNrbHub() {
    return apiFetch<any>("/api/v1/governance/nrb-hub");
  },
};
