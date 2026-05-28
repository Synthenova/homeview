"use client";

import { ComponentPropsWithoutRef, ElementType, ReactNode, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

type AnimatedSectionProps<T extends ElementType> = {
  children: ReactNode;
  className?: string;
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const hiddenState = {
  autoAlpha: 0,
  y: 40,
  filter: "blur(16px)"
};

const visibleState = {
  autoAlpha: 1,
  y: 0,
  filter: "blur(0px)",
  duration: 0.95,
  ease: "power3.out",
  stagger: 0.1
};

function getAnimationTargets(element: HTMLElement) {
  const manualTargets = gsap.utils.toArray<HTMLElement>(
    element.querySelectorAll(":scope > [data-animate]")
  );

  if (manualTargets.length) {
    return manualTargets;
  }

  return gsap.utils.toArray<HTMLElement>(
    element.querySelectorAll(":scope > :not([data-animate-skip])")
  );
}

export function AnimatedSection<T extends ElementType = "section">({
  children,
  className,
  as,
  ...rest
}: AnimatedSectionProps<T>) {
  const Tag = as ?? "section";
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      element.classList.add("is-visible");
      return;
    }

    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let cancelled = false;
    let sectionVisible = false;

    const getTargets = () => getAnimationTargets(element);

    const reset = () => {
      sectionVisible = false;
      const targets = getTargets();
      gsap.killTweensOf(targets);
      gsap.set(targets, hiddenState);
      element.classList.remove("is-visible");
    };

    const reveal = () => {
      sectionVisible = true;
      const targets = getTargets();
      gsap.killTweensOf(targets);
      gsap.to(targets, visibleState);
      element.classList.add("is-visible");
    };

    const syncTargets = () => {
      const targets = getTargets();
      if (!targets.length) return;

      if (sectionVisible) {
        const pending = targets.filter((target) => Number(gsap.getProperty(target, "opacity")) < 1);
        if (pending.length) {
          gsap.to(pending, visibleState);
        }
        return;
      }

      gsap.set(targets, hiddenState);
    };

    const bind = () => {
      const targets = getTargets();
      if (!targets.length) return false;

      gsap.set(targets, hiddenState);

      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.12) {
            reveal();
            return;
          }

          if (!entry.isIntersecting) {
            reset();
          }
        },
        {
          threshold: [0, 0.12, 0.25],
          rootMargin: "0px 0px -18% 0px"
        }
      );

      observer.observe(element);

      mutationObserver = new MutationObserver(() => {
        syncTargets();
      });

      mutationObserver.observe(element, { childList: true, subtree: true });

      return true;
    };

    if (!bind()) {
      requestAnimationFrame(() => {
        if (cancelled) return;
        bind();
      });
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      mutationObserver?.disconnect();
      gsap.killTweensOf(getTargets());
    };
  }, []);

  return (
    <Tag ref={ref as never} className={className} {...rest}>
      {children}
    </Tag>
  );
}
