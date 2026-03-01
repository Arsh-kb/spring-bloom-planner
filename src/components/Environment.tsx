import { useEffect, useRef } from "react";
import bgNature from "@/assets/bg-nature.jpg";
import darkForest from "@/assets/dark-forest.mp4";
import { usePlanner } from "@/context/PlannerContext";

export function Environment() {
  // Grab pomodoroActive to trigger the 6 BPM haptics
  const { mode, season, moodTint, pomodoroActive } = usePlanner();
  
  // PERFORMANCE FIX: Use a ref instead of state to avoid massive re-renders
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (parallaxRef.current) {
            const x = (e.clientX / window.innerWidth - 0.5) * -20;
            const y = (e.clientY / window.innerHeight - 0.5) * -20;
            // Direct DOM manipulation bypasses the React render cycle
            parallaxRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Compose season + mood tint into filters
  const seasonFilter = `hue-rotate(${season.hueShift}deg) saturate(${season.saturation})`;
  const warmthFilter = moodTint.warmth !== 0
    ? `sepia(${Math.abs(moodTint.warmth) / 200}) hue-rotate(${moodTint.warmth > 0 ? moodTint.warmth * 0.3 : moodTint.warmth * 0.5}deg)`
    : '';
  const contrastFilter = moodTint.contrast !== 0
    ? `contrast(${1 + moodTint.contrast / 100})`
    : '';
  const composedFilter = [seasonFilter, warmthFilter, contrastFilter].filter(Boolean).join(' ');

  const atmosphereOpacity = moodTint.depth / 100;

  return (
    <div className="fixed inset-0 z-0 bg-background overflow-hidden" style={{ transition: 'all 3s ease-in-out' }}>
      
      {/* Layer 0: Background with Parallax drift (Now Ref-based) */}
      <div
        ref={parallaxRef}
        className="absolute inset-[-50px] transition-transform duration-700 ease-out will-change-transform"
        style={{ transform: `translate3d(0px, 0px, 0)` }}
      >
        {mode === "cave" ? (
          <video
            src={darkForest}
            autoPlay loop muted playsInline
            className="w-full h-full object-cover atmosphere-transition"
            style={{ filter: `var(--atmosphere-filter) ${composedFilter}` }}
          />
        ) : (
          <img
            src={bgNature}
            alt=""
            className="w-full h-full object-cover animate-slow-zoom atmosphere-transition"
            style={{ filter: `var(--atmosphere-filter) ${composedFilter}` }}
          />
        )}
      </div>

      {/* Atmosphere overlay */}
      <div
        className="absolute inset-0 atmosphere-transition pointer-events-none"
        style={{
          background: "var(--atmosphere-overlay)",
          mixBlendMode: "var(--atmosphere-blend)" as React.CSSProperties["mixBlendMode"],
          opacity: atmosphereOpacity,
        }}
      />

      {/* Season grain overlay */}
      {season.grain > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: season.grain,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '128px 128px',
            transition: 'opacity 3s ease-in-out',
          }}
        />
      )}

      {/* Sun flare */}
      {mode === "sun" && (
        <div className="absolute inset-0 pointer-events-none atmosphere-transition" style={{
          background: `radial-gradient(ellipse at 25% 15%, hsla(${38 + season.hueShift}, 80%, 70%, ${0.12 + season.warmth}) 0%, transparent 60%)`,
        }} />
      )}

      {/* Cave vignette */}
      {mode === "cave" && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at center, transparent 20%, hsla(0, 0%, 0%, 0.75) 100%)",
        }} />
      )}

      {/* Exam fog */}
      {mode === "exam" && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(180deg, hsla(210, 20%, 85%, 0.15) 0%, hsla(200, 15%, 70%, 0.1) 100%)",
        }} />
      )}

      {/* NATURE HAPTICS: 6 BPM Focus Pulse */}
      {pomodoroActive && (
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-overlay animate-nature-breathe"
          style={{
            background: mode === 'cave' 
              ? 'radial-gradient(ellipse at center, hsla(140, 60%, 50%, 0.15) 0%, transparent 60%)' 
              : 'radial-gradient(ellipse at center, hsla(38, 70%, 60%, 0.15) 0%, transparent 60%)'
          }}
        />
      )}
    </div>
  );
}