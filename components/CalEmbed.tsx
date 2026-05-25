"use client";

import Cal from "@calcom/embed-react";
import { calLink } from "@/lib/site";

export function CalEmbed({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "cal-shell compact-cal" : "cal-shell"}>
      <Cal
        calLink={calLink}
        config={{
          layout: "month_view",
          duration: "15"
        }}
      />
    </div>
  );
}
