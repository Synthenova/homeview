"use client";

import Image from "next/image";
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
    <div className="viewer-shell playcanvas-shell" id="demo">
      {!launched ? (
        <>
          <Image
            className="viewer-image"
            src="/images/06-sample_home_viewer_image.png"
            alt="Interactive view of a bright open-plan living room"
            width={786}
            height={318}
            priority
          />
          <ViewerOverlay />
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

function ViewerOverlay() {
  return (
    <>
      <aside className="viewer-map" aria-label="Floor selector">
        <div className="map-title">
          <span>Ground floor</span>
          <span aria-hidden="true">⌄</span>
        </div>
        <Image src="/images/07-sample_home_floorplan_minimap.png" alt="Ground floor minimap" width={115} height={119} />
        <ul>
          <li>Rooftop</li>
          <li>First floor</li>
          <li className="is-active">Ground floor</li>
          <li>Basement</li>
        </ul>
      </aside>
      <div className="pin pin-a" aria-label="Room marker" />
      <div className="pin pin-b" aria-label="Room marker" />
      <div className="pin pin-c" aria-label="Living room marker"><span>Living room</span></div>
      <div className="viewer-share"><span aria-hidden="true">⇧</span><span>Share</span></div>
      <div className="viewer-controls" aria-label="Viewer controls">
        <button type="button" aria-label="Previous">←</button>
        <button type="button" className="pause" aria-label="Pause">Ⅱ</button>
        <button type="button" aria-label="Next">→</button>
      </div>
      <div className="tool-controls" aria-label="Viewer tools">
        <button type="button" aria-label="3D model">◇</button>
        <button type="button" aria-label="Measure">╱</button>
        <button type="button" aria-label="Fullscreen">⌜</button>
      </div>
      <div className="zoom-controls" aria-label="Zoom controls">
        <button type="button" aria-label="Compass">✦</button>
        <button type="button" aria-label="Zoom in">+</button>
        <button type="button" aria-label="Zoom out">−</button>
        <button type="button" aria-label="Layers">▱</button>
      </div>
    </>
  );
}
