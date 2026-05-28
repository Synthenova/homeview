"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const testimonials = [
  {
    quote:
      "We stopped sending ten separate photo folders. The 3D model became the shared reference for the property.",
    name: "Sarah Jenkins",
    role: "Director of Leasing, Meridian Property Group",
    image: "/images/testimonials/sarah-jenkins.png"
  },
  {
    quote:
      "Guests book with more confidence when they can walk the unit before check-in. Fewer surprises, fewer refunds.",
    name: "Marcus Chen",
    role: "Portfolio Manager, StayWell Stays",
    image: "/images/testimonials/marcus-chen.png"
  },
  {
    quote:
      "Claims move faster when adjusters can inspect every room, finish, and fixture without another site visit.",
    name: "Elena Rivera",
    role: "Claims Director, Harbor Mutual",
    image: "/images/testimonials/elena-rivera.png"
  },
  {
    quote:
      "Move-in and move-out documentation finally looks the same across our entire rental portfolio.",
    name: "James Whitfield",
    role: "VP of Operations, UrbanKey Rentals",
    image: "/images/testimonials/james-whitfield.png"
  }
] as const;

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
  ease: "power3.out"
};

export function ProofTestimonialCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const quoteRef = useRef<HTMLQuoteElement>(null);
  const authorRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const targets = [quoteRef.current, authorRef.current].filter(Boolean) as HTMLElement[];
    if (!targets.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplayIndex(activeIndex);
      gsap.set(targets, { autoAlpha: 1, y: 0, filter: "blur(0px)" });
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      gsap.set(targets, hiddenState);
      gsap.to(targets, visibleState);
      return;
    }

    gsap.killTweensOf(targets);
    gsap.to(targets, {
      autoAlpha: 0,
      y: 40,
      filter: "blur(16px)",
      duration: 0.45,
      ease: "power2.in",
      onComplete: () => {
        setDisplayIndex(activeIndex);
        gsap.set(targets, hiddenState);
        gsap.to(targets, visibleState);
      }
    });
  }, [activeIndex]);

  const active = testimonials[displayIndex];

  return (
    <div className="proof-carousel" aria-live="polite">
      <blockquote ref={quoteRef}>“{active.quote}”</blockquote>
      <div className="proof-author" ref={authorRef}>
        <Image
          className="proof-author-photo"
          src={active.image}
          alt=""
          width={44}
          height={44}
        />
        <div className="proof-author-meta">
          <strong>{active.name}</strong>
          <span>{active.role}</span>
        </div>
      </div>
      <div className="proof-carousel-dots" aria-hidden="true">
        {testimonials.map((testimonial, index) => (
          <span key={testimonial.name} className={index === activeIndex ? "is-active" : undefined} />
        ))}
      </div>
    </div>
  );
}
