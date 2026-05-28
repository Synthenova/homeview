import { CrmShell } from "@/components/CrmShell";
import { requireCurrentUser } from "@/lib/auth";
import { readAgentSources, readAgentWorkspace } from "@/lib/agent-data";
import { AgentPlayground } from "./playground";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
  await requireCurrentUser();
  const [workspace, sources] = await Promise.all([readAgentWorkspace(), readAgentSources()]);

  if (!workspace) {
    throw new Error("Agent workspace is missing.");
  }

  return (
    <CrmShell>
      <AgentPlayground initialWorkspace={workspace} initialSources={sources} />
    </CrmShell>
  );
}
