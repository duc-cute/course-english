import { useCallback, useEffect, useRef, useState } from "react";

type ConfettiParticle = {
  id: number;
  size: number;
  left: number;
  color: string;
  borderRadius: string;
  duration: number;
  delay: number;
};

const CONFETTI_COLORS = ["#0058be", "#6cf8bb", "#ffddb8", "#ba1a1a", "#006c49"];
const BATCH_SIZE = 60;

function createParticles(startId: number): ConfettiParticle[] {
  return Array.from({ length: BATCH_SIZE }, (_, i) => {
    const size = Math.random() * 8 + 6;
    return {
      id: startId + i,
      size,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      borderRadius: i % 2 === 0 ? "50%" : "2px",
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    };
  });
}

export function ConfettiCelebration() {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const nextIdRef = useRef(0);
  const reducedMotionRef = useRef(false);

  const burst = useCallback(() => {
    if (reducedMotionRef.current) return;

    const batch = createParticles(nextIdRef.current);
    nextIdRef.current += BATCH_SIZE;
    setParticles((prev) => [...prev, ...batch]);

    const maxLifetimeMs =
      Math.max(...batch.map((p) => (p.duration + p.delay) * 1000)) + 100;
    const batchIds = new Set(batch.map((p) => p.id));
    window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !batchIds.has(p.id)));
    }, maxLifetimeMs);
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotionRef.current) return;

    burst();
    const intervalId = window.setInterval(burst, 6000);
    return () => window.clearInterval(intervalId);
  }, [burst]);

  if (particles.length === 0) return null;

  return (
    <div className="exercise-result-confetti" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="exercise-result-confetti-piece"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}vw`,
            backgroundColor: p.color,
            borderRadius: p.borderRadius,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
