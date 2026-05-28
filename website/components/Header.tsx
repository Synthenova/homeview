"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const SCROLL_THRESHOLD = 20;

export function Header() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const accumulatedDelta = useRef(0);
  const lastDirection = useRef<"up" | "down" | null>(null);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;

      ticking = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (currentY <= SCROLL_THRESHOLD) {
          setHidden(false);
          accumulatedDelta.current = 0;
          lastDirection.current = null;
          lastScrollY.current = currentY;
          ticking = false;
          return;
        }

        if (delta !== 0) {
          const direction = delta > 0 ? "down" : "up";

          if (direction !== lastDirection.current) {
            accumulatedDelta.current = 0;
            lastDirection.current = direction;
          }

          accumulatedDelta.current += delta;

          if (direction === "down" && accumulatedDelta.current >= SCROLL_THRESHOLD) {
            setHidden(true);
            accumulatedDelta.current = 0;
          }

          if (direction === "up" && accumulatedDelta.current <= -SCROLL_THRESHOLD) {
            setHidden(false);
            accumulatedDelta.current = 0;
          }
        }

        lastScrollY.current = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`site-header-shell${hidden ? " is-hidden" : ""}`}>
      <header className="site-header" aria-label="Primary navigation">
        <Link className="brand" href="/" aria-label="Homeview home">
          <span className="brand-mark" aria-hidden="true" />
          <span>Homeview</span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/#plans">Plans</Link>
          <Link href="/#examples">Demo</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <Link className="button button-dark header-cta" href="/contact">
          <span>Get quote</span>
          <span aria-hidden="true">↗</span>
        </Link>
      </header>
    </div>
  );
}
