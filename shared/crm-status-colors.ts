export const DEFAULT_STATUS_COLOR = "#64748b";

export const STATUS_COLORS: Record<string, string> = {
  new: "#2563eb",
  engaged: "#0891b2",
  qualified: "#7c3aed",
  proposal_sent: "#ca8a04",
  follow_up: "#ea580c",
  won: "#16a34a",
  lost: "#dc2626",
  archived: "#6b7280",
  vip_followup: "#9333ea",
  vip_agent_followup: "#4f46e5"
};

export function resolveStatusColor(name: string, storedColor?: string | null) {
  if (storedColor) return storedColor;
  return STATUS_COLORS[name] ?? DEFAULT_STATUS_COLOR;
}

export function defaultStatusColorForName(name: string) {
  return resolveStatusColor(name, null);
}
