"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    pc?: any;
  }
}

export function PlayCanvasViewer() {
  const [launched, setLaunched] = useState(false);
  const [status, setStatus] = useState("Click to load the interactive walkthrough.");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (launched) return;

    const video = previewVideoRef.current;
    const shell = video?.closest(".viewer-shell");
    if (!video || !shell) return;

    const playPreview = () => {
      void video.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          playPreview();
          return;
        }

        video.pause();
      },
      { threshold: 0.2 }
    );

    observer.observe(shell);

    if (shell.getBoundingClientRect().top < window.innerHeight * 0.9) {
      playPreview();
    }

    return () => observer.disconnect();
  }, [launched]);

  useEffect(() => {
    if (!launched || !canvasRef.current) return;
    let destroyed = false;
    let app: any;

    async function boot() {
      setStatus("Loading PlayCanvas...");
      await loadPlayCanvas();
      const pc = window.pc;
      if (destroyed || !canvasRef.current) return;
      if (!pc) {
        setStatus("PlayCanvas could not load. Try refreshing the page.");
        return;
      }

      app = new pc.Application(canvasRef.current, {
        mouse: new pc.Mouse(canvasRef.current),
        touch: new pc.TouchDevice(canvasRef.current)
      });
      app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
      app.setCanvasResolution(pc.RESOLUTION_AUTO);
      app.start();

      const camera = new pc.Entity("camera");
      camera.addComponent("camera", { clearColor: new pc.Color(0.97, 0.97, 0.94) });
      camera.setPosition(0, 1.6, 4.8);
      camera.lookAt(0, 0.7, 0);
      app.root.addChild(camera);

      const light = new pc.Entity("light");
      light.addComponent("light", {
        type: "directional",
        color: new pc.Color(1, 0.96, 0.9),
        intensity: 2.2
      });
      light.setEulerAngles(42, 32, 0);
      app.root.addChild(light);

      const model = new pc.Entity("homeview-preview");
      model.addComponent("render", { type: "box" });
      model.setLocalScale(1.9, 1.1, 1.45);
      model.setPosition(0, 0.7, 0);
      app.root.addChild(model);

      const floor = new pc.Entity("floor");
      floor.addComponent("render", { type: "plane" });
      floor.setLocalScale(5, 1, 5);
      floor.setPosition(0, 0, 0);
      app.root.addChild(floor);

      const splatUrl = process.env.NEXT_PUBLIC_PLAYCANVAS_SPLAT_URL;
      if (splatUrl) {
        setStatus("PlayCanvas loaded. Splat URL is configured for production handoff.");
      } else {
        setStatus("Interactive demo loaded. Add NEXT_PUBLIC_PLAYCANVAS_SPLAT_URL when the splat is ready.");
      }

      app.on("update", (dt: number) => {
        model.rotate(0, 18 * dt, 0);
      });

      window.addEventListener("resize", () => app?.resizeCanvas());
    }

    boot();

    return () => {
      destroyed = true;
      app?.destroy?.();
    };
  }, [launched]);

  return (
    <div className="viewer-shell playcanvas-shell" id="demo" data-animate-skip>
      {!launched ? (
        <>
          <video
            ref={previewVideoRef}
            className="viewer-preview-video"
            src="/interactive-demo-short.mp4"
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <button className="demo-launch-button" type="button" onClick={() => setLaunched(true)}>
            Launch interactive demo
          </button>
        </>
      ) : (
        <>
          <canvas ref={canvasRef} className="playcanvas-canvas" aria-label="PlayCanvas walkthrough demo" />
          <p className="playcanvas-status">{status}</p>
        </>
      )}
    </div>
  );
}

function loadPlayCanvas() {
  if (window.pc) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-playcanvas]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("PlayCanvas failed to load")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "/vendor/playcanvas.min.js";
    script.async = true;
    script.dataset.playcanvas = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("PlayCanvas failed to load"));
    document.head.appendChild(script);
  });
}
