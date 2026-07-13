import { useEffect, useState } from "react";

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
};

export function SnowTheme() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate soft falling snowflakes
    const list: Particle[] = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * -18,
      duration: Math.random() * 8 + 12,
    }));
    setParticles(list);
  }, []);

  return (
    <div className="particle-overlay">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle snowflake"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
