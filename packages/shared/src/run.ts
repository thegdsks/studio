import type { Agent, AgentId } from './agent.js';

export interface Run {
  run_id: string;
  idea: string;
  startedAt: number;
  finishedAt?: number;
  agents: Record<AgentId, Agent>;
  /** When true, privacy-eligible agents (Strategist, Legal) try local Gemma first. */
  privacy_mode?: boolean;
}

export interface CreateRunRequest {
  idea: string;
  privacy_mode?: boolean;
}

export interface CreateRunResponse {
  run_id: string;
}
