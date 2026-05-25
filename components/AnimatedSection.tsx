"use client";

import { ComponentPropsWithoutRef, ElementType, ReactNode, useEffect, useRef } from "react";
import gsap from "gsap";

type AnimatedSectionProps<T extends ElementType> = {
  children: ReactNode;
  className?: string;
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const hiddenState = {
  autoAlpha: 0,
  y: 34,
  filter: "blur(18px)"
};

const visibleState = {
  autoAlpha: 1,
  y: 0,
  filter: "blur(0px)"
};

export function AnimatedSection<T extends ElementType = "section">({
  children,
  className,
  as,
  ...rest
}: AnimatedSectionProps<T>) {
  const Tag = as ?? "section";
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      element.classList.add("is-visible");
      return;
    }

    const targets = element.querySelectorAll("[data-animate]");
    if (!targets.length) return;

    gsap.set(targets, hiddenState);

    const reset = () => {
      gsap.killTweensOf(targets);
      gsap.set(targets, hiddenState);
      element.classList.remove("is-visible");
    };

    const reveal = () => {
      gsap.killTweensOf(targets);
      gsap.to(targets, {
        ...visibleState,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08
      });
      element.classList.add("is-visible");
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
          return;
        }

        reset();
      },
      { threshold: 0.08 }
    );

    observer.observe(element);

    if (element.getBoundingClientRect().top < window.innerHeight * 0.9) {
      window.setTimeout(reveal, 80);
    }

    return () => {
      observer.disconnect();
      gsap.killTweensOf(targets);
    };
  }, []);

  return (
    <Tag ref={ref as never} className={className} {...rest}>
      {children}
    </Tag>
  );
}
