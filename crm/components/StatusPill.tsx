import { resolveStatusColor } from "../../shared/crm-status-colors";

type StatusPillProps = {
  label: string;
  statusName: string;
  color?: string | null;
  className?: string;
};

export function StatusPill({ label, statusName, color, className }: StatusPillProps) {
  const resolved = resolveStatusColor(statusName, color ?? null);
  const classes = ["crm-status-pill", className].filter(Boolean).join(" ");

  return (
    <span className={classes} style={{ "--status-color": resolved } as React.CSSProperties}>
      {label}
    </span>
  );
}

export function statusColorFromOptions(
  statuses: Array<{ name: string; color: string }>,
  statusName: string
) {
  return statuses.find((status) => status.name === statusName)?.color ?? resolveStatusColor(statusName, null);
}
