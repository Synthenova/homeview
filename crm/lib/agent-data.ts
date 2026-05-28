import {
  deleteAgentSourceRecord,
  getAgentSource,
  getAgentWorkspace,
  insertAgentSource,
  listAgentSources,
  saveAgentWorkspace,
  type AgentSource,
  type AgentWorkspace
} from "../../shared/agent-config";
import { sql } from "./db";

export async function readAgentWorkspace() {
  return getAgentWorkspace(sql);
}

export async function updateAgentWorkspace(input: { model: string; instructions: string }) {
  return saveAgentWorkspace(sql, input);
}

export async function readAgentSources() {
  return listAgentSources(sql);
}

export async function readAgentSource(id: string) {
  return getAgentSource(sql, id);
}

export async function createAgentSource(input: {
  objectKey: string;
  fileName: string;
  mediaType: string;
  sourceKind: AgentSource["sourceKind"];
  sizeBytes: number;
  publicUrl: string;
  textContent: string | null;
}) {
  return insertAgentSource(sql, input);
}

export async function removeAgentSource(id: string) {
  return deleteAgentSourceRecord(sql, id);
}

export type { AgentSource, AgentWorkspace };
