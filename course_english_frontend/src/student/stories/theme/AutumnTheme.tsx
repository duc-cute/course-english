import { useEffect, useState } from "react";

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
};

const LEAF_COLORS = ["#f97316", "#ea580c", "#ca8a04", "#b45309", "#b91c1c"];

export function AutumnTheme() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate falling leaves in warm colors
    const list: Particle[] = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * -22,
      duration: Math.random() * 10 + 15,
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
    }));
    setParticles(list);
  }, []);

  return (
    <div className="particle-overlay">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle leaf-fall"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}
