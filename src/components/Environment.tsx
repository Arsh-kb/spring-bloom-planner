import { useEffect, useState } from "react";
import bgNature from "@/assets/bg-nature.jpg";
import darkForest from "@/assets/dark-forest.mp4";
import { usePlanner } from "@/context/PlannerContext";

export function Environment() {
  const { mode } = usePlanner();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // 🖱️ The Parallax Engine
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * -20;
      const y = (e.clientY / window.innerHeight - 0.5) * -20;
      setOffset({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-background overflow-hidden">
      {/* Layer 0: Background with Parallax drift */}
      <div
        className="absolute inset-[-50px] transition-transform duration-700 ease-out will-change-transform"
        style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
      >
        {mode === "cave" ? (
          <video
            src={darkForest}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover atmosphere-transition"
            style={{ filter: "var(--atmosphere-filter)" }}
          />
        ) : (
          <img
            src={bgNature}
            alt=""
            className="w-full h-full object-cover animate-slow-zoom atmosphere-transition"
            style={{ filter: "var(--atmosphere-filter)" }}
          />
        )}
      </div>

      {/* Atmosphere overlay */}
      <div
        className="absolute inset-0 atmosphere-transition pointer-events-none"
        style={{
          background: "var(--atmosphere-overlay)",
          mixBlendMode: "var(--atmosphere-blend)" as React.CSSProperties["mixBlendMode"],
        }}
      />

      {/* Sun flare for sun mode */}
      {mode === "sun" && (
        <div
          className="absolute inset-0 pointer-events-none atmosphere-transition"
          style={{
            background:
              "radial-gradient(ellipse at 25% 15%, hsla(38, 80%, 70%, 0.12) 0%, transparent 60%)",
          }}
        />
      )}

      {/* Vignette for cave mode */}
      {mode === "cave" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 20%, hsla(0, 0%, 0%, 0.75) 100%)",
          }}
        />
      )}

      {/* Fog overlay for exam mode */}
      {mode === "exam" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, hsla(210, 20%, 85%, 0.15) 0%, hsla(200, 15%, 70%, 0.1) 100%)",
          }}
        />
      )}
    </div>
  );
}