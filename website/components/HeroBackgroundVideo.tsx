"use client";

import { useEffect, useRef } from "react";

export function HeroBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const hero = video?.closest(".hero");
    if (!video || !hero) return;

    const playFromStart = () => {
      video.currentTime = 0;
      void video.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          playFromStart();
          return;
        }

        video.pause();
      },
      { threshold: 0.15 }
    );

    observer.observe(hero);

    if (hero.getBoundingClientRect().top < window.innerHeight * 0.9) {
      playFromStart();
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="hero-video-wrap" aria-hidden="true" data-animate-skip>
      <video
        ref={videoRef}
        className="hero-video"
        src="/homeview_hero_bg_vid.mp4"
        muted
        playsInline
        preload="metadata"
      />
    </div>
  );
}
