"use client";

import { useEffect, useRef } from "react";

export function UseCaseFeaturedCard() {
  const cardRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const video = videoRef.current;
    if (!card || !video) return;

    const playVideo = () => {
      void video.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          playVideo();
          return;
        }

        video.pause();
      },
      { threshold: 0.2 }
    );

    observer.observe(card);

    if (card.getBoundingClientRect().top < window.innerHeight * 0.9) {
      playVideo();
    }

    return () => observer.disconnect();
  }, []);

  return (
    <article ref={cardRef} className="use-card large-use">
      <div className="large-use-media" aria-hidden="true">
        <video
          ref={videoRef}
          className="large-use-video"
          src="/house_walkthru-card.mp4"
          loop
          muted
          playsInline
          preload="metadata"
        />
      </div>
      <div className="large-use-reveal" aria-hidden="true" />
      <div className="large-use-content">
        <span>01</span>
        <div className="large-use-copy">
          <h3>Real estate virtual tours</h3>
          <p>
            Replace flat listing galleries with a measured 3D home tour buyers can inspect before
            visiting.
          </p>
        </div>
      </div>
    </article>
  );
}
