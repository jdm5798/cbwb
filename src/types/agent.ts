export type AgentStatus = "RUNNING" | "SUCCESS" | "FAILED" | "PARTIAL";

export interface AgentRunRecord {
  id: string;
  type: string;
  provider: string | null;
  status: AgentStatus;
  logs: string[];
  summary: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface IngestRequest {
  provider: "barttorvik" | "haslametrics";
  season?: number;
}
