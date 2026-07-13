import { useEffect, useState } from "react";

type Particle = {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
};

export function ForestTheme() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate a fixed set of slow drifting fireflies
    const list: Particle[] = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * -20,
      duration: Math.random() * 15 + 15,
    }));
    setParticles(list);
  }, []);

  return (
    <div className="particle-overlay">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle firefly"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
