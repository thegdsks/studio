import type { Agent, AgentId } from './agent.js';

export interface Run {
  run_id: string;
  idea: string;
  startedAt: number;
  finishedAt?: number;
  agents: Record<AgentId, Agent>;
}

export interface CreateRunRequest {
  idea: string;
}

export interface CreateRunResponse {
  run_id: string;
}
