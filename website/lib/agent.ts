import { buildAgent } from "../../shared/agent-runtime";
import type { AgentSource, AgentWorkspace } from "../../shared/agent-config";

export function createHomeviewAgent(
  workspace: AgentWorkspace,
  sources: AgentSource[],
  options?: Parameters<typeof buildAgent>[2]
) {
  return buildAgent(workspace, sources, options);
}
