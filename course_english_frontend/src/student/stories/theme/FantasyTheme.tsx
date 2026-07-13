import { useEffect, useState } from "react";

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
};

const MAGICAL_COLORS = ["#d946ef", "#f472b6", "#a855f7", "#fbbf24", "#60a5fa"];

export function FantasyTheme() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate magical floating sparkles
    const list: Particle[] = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * -16,
      duration: Math.random() * 12 + 10,
      color: MAGICAL_COLORS[Math.floor(Math.random() * MAGICAL_COLORS.length)],
    }));
    setParticles(list);
  }, []);

  return (
    <div className="particle-overlay">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle magic-sparkle"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}
