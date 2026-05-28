"use client";

import Cal from "@calcom/embed-react";
import { useEffect, useRef } from "react";
import { calLink } from "@/lib/site";

function capCalEmbedHeight(shell: HTMLElement, compact: boolean) {
  const section = shell.closest(".cal-section");
  const kicker = section?.querySelector(".section-kicker") as HTMLElement | null;
  const kickerHeight = kicker?.getBoundingClientRect().height ?? 0;
  const minHeight = compact ? 460 : 520;
  const maxHeight = compact ? 560 : 640;
  const targetHeight = kickerHeight
    ? Math.min(Math.max(Math.round(kickerHeight), minHeight), maxHeight)
    : compact
      ? 540
      : 600;

  shell.style.setProperty("--cal-embed-height", `${targetHeight}px`);

  shell.querySelectorAll("iframe.cal-embed, cal-inline, .cal-inline-container").forEach((node) => {
    const element = node as HTMLElement;
    element.style.height = `${targetHeight}px`;
    element.style.maxHeight = `${targetHeight}px`;
    element.style.minHeight = "0";
  });
}

export function CalEmbed({ compact = false }: { compact?: boolean }) {
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const applyHeight = () => capCalEmbedHeight(shell, compact);

    const mutationObserver = new MutationObserver(applyHeight);
    mutationObserver.observe(shell, {
      subtree: true,
      attributes: true,
      attributeFilter: ["style"]
    });

    const kicker = shell.closest(".cal-section")?.querySelector(".section-kicker");
    const resizeObserver = kicker ? new ResizeObserver(applyHeight) : null;
    if (kicker && resizeObserver) {
      resizeObserver.observe(kicker);
    }

    applyHeight();

    return () => {
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
    };
  }, [compact]);

  return (
    <div ref={shellRef} className={compact ? "cal-shell compact-cal" : "cal-shell"}>
      <Cal
        calLink={calLink}
        config={{
          layout: compact ? "column_view" : "month_view",
          duration: "15"
        }}
      />
    </div>
  );
}
